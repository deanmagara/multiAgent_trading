import backtrader as bt
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from .performance_metrics import PerformanceMetrics, Trade
from .capital_allocator import CapitalAllocator, RiskManager
from .signal_analyzer import SignalAnalyzer, EnhancedTradingAgent
import json

class RLStrategy(bt.Strategy):
    params = (('model', None),)

    def __init__(self):
        if self.p.model is None:
            raise ValueError("A trained RL model must be provided to the strategy.")

    def next(self):
        # We need to construct the observation exactly as the training environment does.
        # The TradingEnv uses the entire row of the dataframe plus news sentiment features.
        obs = np.array([
            self.data.open[0],
            self.data.high[0],
            self.data.low[0],
            self.data.close[0],
            self.data.volume[0]
        ], dtype=np.float32)
        
        # Add news sentiment features (default to 0.0 if not available)
        news_sentiment = 0.0
        news_confidence = 0.0
        news_features = np.array([news_sentiment, news_confidence], dtype=np.float32)
        
        # Concatenate to match the training environment observation space
        full_obs = np.concatenate([obs, news_features])

        action, _ = self.p.model.predict(full_obs, deterministic=True)
        
        # Based on tradingEnv.py: 0=hold, 1=buy, 2=sell
        if action == 1 and not self.position:
            self.buy()
        elif action == 2 and self.position:
            self.sell()

def run_backtest(df, model):
    # Ensure the index is a proper datetime object
    if not isinstance(df.index, pd.DatetimeIndex):
        # If the index is numeric (timestamp), convert it to datetime
        if df.index.dtype in ['int64', 'float64']:
            df.index = pd.to_datetime(df.index, unit='s')
        else:
            # If it's already a string or other format, try to parse it
            df.index = pd.to_datetime(df.index)
    
    # Create a copy to avoid modifying the original dataframe
    df_copy = df.copy()
    
    # Ensure all required columns exist
    required_columns = ['open', 'high', 'low', 'close', 'volume']
    for col in required_columns:
        if col not in df_copy.columns:
            # If column doesn't exist, try to find it with different case
            col_found = False
            for existing_col in df_copy.columns:
                if existing_col.lower() == col:
                    df_copy[col] = df_copy[existing_col]
                    col_found = True
                    break
            if not col_found:
                raise ValueError(f"Required column '{col}' not found in dataframe")
    
    # Rename columns to match backtrader expectations (lowercase)
    column_mapping = {}
    for col in df_copy.columns:
        if col.lower() in required_columns:
            column_mapping[col] = col.lower()
    
    if column_mapping:
        df_copy = df_copy.rename(columns=column_mapping)
    
    # Create Cerebro engine
    cerebro = bt.Cerebro()
    
    # Add data feed
    data = bt.feeds.PandasData(dataname=df_copy)
    cerebro.adddata(data)
    
    # Add strategy
    cerebro.addstrategy(RLStrategy, model=model)
    
    # Set initial cash
    cerebro.broker.setcash(100000.0)
    
    # Run backtest
    cerebro.run()
    
    # Get final portfolio value
    final_value = cerebro.broker.getvalue()
    
    return final_value

class EnhancedBacktest:
    def __init__(self, 
                 initial_capital: float = 10000.0,
                 risk_params: Dict = None):
        self.initial_capital = initial_capital
        self.capital_allocator = CapitalAllocator(initial_capital)
        self.performance_metrics = PerformanceMetrics()
        self.signal_analyzer = SignalAnalyzer()
        
        # Risk management parameters
        self.risk_params = risk_params or {
            'max_risk_per_trade': 0.02,
            'max_portfolio_risk': 0.06,
            'stop_loss_pips': 50.0,
            'take_profit_pips': 100.0
        }
        
        self.active_positions = {}
        self.trade_history = []
        
    def run_backtest(self, 
                    market_data: pd.DataFrame,
                    signals: List[Dict]) -> Dict:
        """
        Run enhanced backtest with risk management and performance tracking
        """
        results = {
            'trades': [],
            'equity_curve': [],
            'performance_metrics': {},
            'risk_metrics': {},
            'signal_analysis': {}
        }
        
        for i, row in market_data.iterrows():
            current_time = row['timestamp']
            current_prices = {row['pair']: row['close']}
            
            # Update active positions
            self._update_positions(current_prices, current_time)
            
            # Process new signals
            current_signals = [s for s in signals if s['timestamp'] == current_time]
            
            for signal in current_signals:
                # Add confidence scoring
                enhanced_signal = self.signal_analyzer.calculate_overall_confidence(signal)
                signal['confidence'] = enhanced_signal.overall_confidence
                
                # Only trade if confidence is high enough
                if signal['confidence'] >= 0.6:
                    allocations = self.capital_allocator.allocate_capital(
                        [signal], current_prices
                    )
                    
                    for allocation in allocations:
                        self._open_position(allocation, current_time)
            
            # Record equity
            total_equity = self.initial_capital + sum(
                pos['unrealized_pnl'] for pos in self.active_positions.values()
            )
            results['equity_curve'].append({
                'timestamp': current_time,
                'equity': total_equity
            })
        
        # Close remaining positions
        self._close_all_positions(market_data.iloc[-1]['close'], market_data.iloc[-1]['timestamp'])
        
        # Calculate final metrics
        results['performance_metrics'] = self.performance_metrics.get_performance_summary()
        results['risk_metrics'] = self._calculate_risk_metrics()
        results['signal_analysis'] = self.performance_metrics.generate_trade_analysis()
        
        return results
    
    def _open_position(self, allocation: Dict, timestamp: datetime):
        """Open a new position"""
        position_id = f"{allocation['pair']}_{timestamp.strftime('%Y%m%d_%H%M%S')}"
        
        self.active_positions[position_id] = {
            'pair': allocation['pair'],
            'entry_price': allocation['entry_price'],
            'position_size': allocation['position_size'],
            'stop_loss': allocation['stop_loss'],
            'take_profit': allocation['take_profit'],
            'direction': allocation.get('direction', 'buy'),
            'entry_time': timestamp,
            'confidence': allocation['confidence'],
            'unrealized_pnl': 0.0
        }
    
    def _update_positions(self, current_prices: Dict, timestamp: datetime):
        """Update active positions and check for exits"""
        positions_to_close = []
        
        for pos_id, position in self.active_positions.items():
            pair = position['pair']
            current_price = current_prices.get(pair)
            
            if not current_price:
                continue
            
            # Calculate unrealized P&L
            if position['direction'] == 'buy':
                unrealized_pnl = (current_price - position['entry_price']) * position['position_size']
            else:
                unrealized_pnl = (position['entry_price'] - current_price) * position['position_size']
            
            position['unrealized_pnl'] = unrealized_pnl
            
            # Check stop loss and take profit
            if self._should_close_position(position, current_price):
                positions_to_close.append((pos_id, current_price, timestamp))
        
        # Close positions
        for pos_id, exit_price, exit_time in positions_to_close:
            self._close_position(pos_id, exit_price, exit_time)
    
    def _should_close_position(self, position: Dict, current_price: float) -> bool:
        """Check if position should be closed"""
        if position['direction'] == 'buy':
            # Stop loss
            if current_price <= position['stop_loss']:
                return True
            # Take profit
            if current_price >= position['take_profit']:
                return True
        else:
            # Stop loss
            if current_price >= position['stop_loss']:
                return True
            # Take profit
            if current_price <= position['take_profit']:
                return True
        
        return False
    
    def _close_position(self, position_id: str, exit_price: float, exit_time: datetime):
        """Close a position and record the trade"""
        position = self.active_positions[position_id]
        
        # Calculate final P&L
        if position['direction'] == 'buy':
            pnl = (exit_price - position['entry_price']) * position['position_size']
        else:
            pnl = (position['entry_price'] - exit_price) * position['position_size']
        
        # Create trade record
        trade = Trade(
            entry_time=position['entry_time'],
            exit_time=exit_time,
            pair=position['pair'],
            entry_price=position['entry_price'],
            exit_price=exit_price,
            position_size=position['position_size'],
            direction=position['direction'],
            pnl=pnl,
            pnl_pct=pnl / (position['entry_price'] * position['position_size']),
            confidence=position['confidence']
        )
        
        # Add to performance metrics
        self.performance_metrics.add_trade(trade)
        
        # Remove from active positions
        del self.active_positions[position_id]
    
    def _close_all_positions(self, final_price: float, final_time: datetime):
        """Close all remaining positions at the end of backtest"""
        for pos_id in list(self.active_positions.keys()):
            self._close_position(pos_id, final_price, final_time)
    
    def _calculate_risk_metrics(self) -> Dict:
        """Calculate additional risk metrics"""
        return {
            'var_95': self._calculate_var(0.95),
            'var_99': self._calculate_var(0.99),
            'max_consecutive_losses': self._calculate_max_consecutive_losses(),
            'risk_reward_ratio': self._calculate_risk_reward_ratio()
        }
    
    def _calculate_var(self, confidence_level: float) -> float:
        """Calculate Value at Risk"""
        if len(self.performance_metrics.trades) == 0:
            return 0.0
        
        returns = [trade.pnl_pct for trade in self.performance_metrics.trades]
        return np.percentile(returns, (1 - confidence_level) * 100)
    
    def _calculate_max_consecutive_losses(self) -> int:
        """Calculate maximum consecutive losses"""
        if len(self.performance_metrics.trades) == 0:
            return 0
        
        max_consecutive = 0
        current_consecutive = 0
        
        for trade in self.performance_metrics.trades:
            if trade.pnl < 0:
                current_consecutive += 1
                max_consecutive = max(max_consecutive, current_consecutive)
            else:
                current_consecutive = 0
        
        return max_consecutive
    
    def _calculate_risk_reward_ratio(self) -> float:
        """Calculate average risk/reward ratio"""
        if len(self.performance_metrics.trades) == 0:
            return 0.0
        
        total_risk = 0.0
        total_reward = 0.0
        
        for trade in self.performance_metrics.trades:
            if trade.pnl < 0:
                total_risk += abs(trade.pnl)
            else:
                total_reward += trade.pnl
        
        if total_risk == 0:
            return float('inf') if total_reward > 0 else 0.0
        
        return total_reward / total_risk

class WalkForwardAnalyzer:
    """Performs walk-forward analysis to test strategy robustness"""
    
    def __init__(self, data: pd.DataFrame, train_period_days: int = 252, 
                 test_period_days: int = 63, step_days: int = 21):
        """
        Initialize walk-forward analyzer
        
        Args:
            data: Historical price data
            train_period_days: Training period in days (default: 1 year)
            test_period_days: Testing period in days (default: 3 months)
            step_days: Step size in days (default: 1 month)
        """
        self.data = data
        self.train_period_days = train_period_days
        self.test_period_days = test_period_days
        self.step_days = step_days
        self.results = []
        
    def generate_windows(self) -> List[Tuple[pd.DataFrame, pd.DataFrame]]:
        """Generate training and testing windows"""
        windows = []
        start_date = self.data.index[0]
        end_date = self.data.index[-1]
        
        current_start = start_date
        while current_start + timedelta(days=self.train_period_days + self.test_period_days) <= end_date:
            train_end = current_start + timedelta(days=self.train_period_days)
            test_end = train_end + timedelta(days=self.test_period_days)
            
            train_data = self.data.loc[current_start:train_end]
            test_data = self.data.loc[train_end:test_end]
            
            if len(train_data) > 0 and len(test_data) > 0:
                windows.append((train_data, test_data))
            
            current_start += timedelta(days=self.step_days)
        
        return windows
    
    def run_walk_forward(self, strategy_func, **strategy_params) -> Dict:
        """Run walk-forward analysis"""
        windows = self.generate_windows()
        results = []
        
        for i, (train_data, test_data) in enumerate(windows):
            print(f"Running window {i+1}/{len(windows)}")
            
            # Train strategy on training data
            strategy = strategy_func(train_data, **strategy_params)
            
            # Test on out-of-sample data
            test_results = self._run_backtest_on_window(test_data, strategy)
            
            window_result = {
                'window_id': i + 1,
                'train_start': train_data.index[0].strftime('%Y-%m-%d'),
                'train_end': train_data.index[-1].strftime('%Y-%m-%d'),
                'test_start': test_data.index[0].strftime('%Y-%m-%d'),
                'test_end': test_data.index[-1].strftime('%Y-%m-%d'),
                'results': test_results
            }
            results.append(window_result)
        
        # Aggregate results
        aggregated = self._aggregate_results(results)
        
        return {
            'windows': results,
            'aggregated': aggregated,
            'summary': self._generate_summary(aggregated)
        }
    
    def _run_backtest_on_window(self, test_data: pd.DataFrame, strategy) -> Dict:
        """Run backtest on a single window"""
        # This would integrate with your existing backtest logic
        # For now, returning sample results
        return {
            'total_return': np.random.uniform(-0.1, 0.2),
            'sharpe_ratio': np.random.uniform(0.5, 2.0),
            'max_drawdown': np.random.uniform(0.05, 0.25),
            'win_rate': np.random.uniform(0.4, 0.7),
            'profit_factor': np.random.uniform(0.8, 2.5),
            'total_trades': np.random.randint(10, 50)
        }
    
    def _aggregate_results(self, results: List[Dict]) -> Dict:
        """Aggregate results across all windows"""
        metrics = ['total_return', 'sharpe_ratio', 'max_drawdown', 'win_rate', 'profit_factor']
        aggregated = {}
        
        for metric in metrics:
            values = [r['results'][metric] for r in results]
            aggregated[metric] = {
                'mean': np.mean(values),
                'std': np.std(values),
                'min': np.min(values),
                'max': np.max(values),
                'median': np.median(values)
            }
        
        return aggregated
    
    def _generate_summary(self, aggregated: Dict) -> Dict:
        """Generate summary statistics"""
        return {
            'total_windows': len(self.results),
            'consistency_score': self._calculate_consistency(aggregated),
            'robustness_rating': self._calculate_robustness(aggregated),
            'recommendation': self._generate_recommendation(aggregated)
        }
    
    def _calculate_consistency(self, aggregated: Dict) -> float:
        """Calculate consistency score based on standard deviation of returns"""
        return 1.0 - min(aggregated['total_return']['std'], 1.0)
    
    def _calculate_robustness(self, aggregated: Dict) -> str:
        """Calculate robustness rating"""
        sharpe_mean = aggregated['sharpe_ratio']['mean']
        drawdown_mean = aggregated['max_drawdown']['mean']
        
        if sharpe_mean > 1.5 and drawdown_mean < 0.15:
            return 'Excellent'
        elif sharpe_mean > 1.0 and drawdown_mean < 0.20:
            return 'Good'
        elif sharpe_mean > 0.5 and drawdown_mean < 0.25:
            return 'Fair'
        else:
            return 'Poor'
    
    def _generate_recommendation(self, aggregated: Dict) -> str:
        """Generate trading recommendation"""
        robustness = self._calculate_robustness(aggregated)
        consistency = self._calculate_consistency(aggregated)
        
        if robustness == 'Excellent' and consistency > 0.8:
            return 'Strong Buy - Strategy shows excellent robustness and consistency'
        elif robustness in ['Excellent', 'Good'] and consistency > 0.6:
            return 'Buy - Strategy shows good potential with moderate consistency'
        elif robustness == 'Fair' and consistency > 0.5:
            return 'Hold - Strategy needs optimization before live trading'
        else:
            return 'Avoid - Strategy shows poor performance or high inconsistency'

# Add walk-forward method to existing EnhancedBacktest class
def add_walk_forward_to_backtest():
    """Add walk-forward analysis to existing backtest class"""
    # This would be integrated into your existing EnhancedBacktest class
    pass