import numpy as np
import pandas as pd
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class Trade:
    entry_time: datetime
    exit_time: datetime
    pair: str
    entry_price: float
    exit_price: float
    position_size: float
    direction: str
    pnl: float
    pnl_pct: float
    confidence: float

class PerformanceMetrics:
    def __init__(self):
        self.trades: List[Trade] = []
        self.daily_returns: List[float] = []
        self.equity_curve: List[float] = []
        self.initial_capital = 10000.0
        self.current_capital = 10000.0
        
    def add_trade(self, trade: Trade):
        """Add a completed trade"""
        self.trades.append(trade)
        self.current_capital += trade.pnl
        self.equity_curve.append(self.current_capital)
        
    def calculate_sharpe_ratio(self, risk_free_rate: float = 0.02) -> float:
        """Calculate Sharpe ratio"""
        if len(self.daily_returns) < 2:
            return 0.0
            
        returns = np.array(self.daily_returns)
        excess_returns = returns - (risk_free_rate / 252)  # Daily risk-free rate
        
        if np.std(excess_returns) == 0:
            return 0.0
            
        return np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)
    
    def calculate_max_drawdown(self) -> Dict[str, float]:
        """Calculate maximum drawdown"""
        if len(self.equity_curve) < 2:
            return {"max_drawdown": 0.0, "max_drawdown_pct": 0.0}
            
        equity = np.array(self.equity_curve)
        peak = np.maximum.accumulate(equity)
        drawdown = (equity - peak) / peak
        
        max_dd = np.min(drawdown)
        max_dd_pct = abs(max_dd) * 100
        
        return {
            "max_drawdown": max_dd,
            "max_drawdown_pct": max_dd_pct
        }
    
    def calculate_win_rate(self) -> float:
        """Calculate win rate"""
        if len(self.trades) == 0:
            return 0.0
            
        winning_trades = sum(1 for trade in self.trades if trade.pnl > 0)
        return winning_trades / len(self.trades)
    
    def calculate_profit_factor(self) -> float:
        """Calculate profit factor"""
        if len(self.trades) == 0:
            return 0.0
            
        gross_profit = sum(trade.pnl for trade in self.trades if trade.pnl > 0)
        gross_loss = abs(sum(trade.pnl for trade in self.trades if trade.pnl < 0))
        
        if gross_loss == 0:
            return float('inf') if gross_profit > 0 else 0.0
            
        return gross_profit / gross_loss
    
    def calculate_average_trade_duration(self) -> timedelta:
        """Calculate average trade duration"""
        if len(self.trades) == 0:
            return timedelta(0)
            
        total_duration = sum(
            (trade.exit_time - trade.entry_time) for trade in self.trades
        )
        return total_duration / len(self.trades)
    
    def calculate_risk_adjusted_return(self) -> float:
        """Calculate risk-adjusted return (Sortino ratio)"""
        if len(self.daily_returns) < 2:
            return 0.0
            
        returns = np.array(self.daily_returns)
        negative_returns = returns[returns < 0]
        
        if len(negative_returns) == 0:
            return np.mean(returns) * 252
            
        downside_deviation = np.std(negative_returns)
        if downside_deviation == 0:
            return np.mean(returns) * 252
            
        return (np.mean(returns) * 252) / downside_deviation
    
    def get_performance_summary(self) -> Dict:
        """Get comprehensive performance summary"""
        return {
            "total_trades": len(self.trades),
            "win_rate": self.calculate_win_rate(),
            "profit_factor": self.calculate_profit_factor(),
            "sharpe_ratio": self.calculate_sharpe_ratio(),
            "max_drawdown": self.calculate_max_drawdown(),
            "average_trade_duration": self.calculate_average_trade_duration(),
            "risk_adjusted_return": self.calculate_risk_adjusted_return(),
            "total_return": (self.current_capital - self.initial_capital) / self.initial_capital,
            "current_capital": self.current_capital
        }
    
    def check_profitability_targets(self) -> Dict[str, bool]:
        """Check if performance meets profitability targets"""
        summary = self.get_performance_summary()
        
        return {
            "sharpe_ratio_target": summary["sharpe_ratio"] > 1.5,
            "max_drawdown_target": summary["max_drawdown"]["max_drawdown_pct"] < 15.0,
            "win_rate_target": summary["win_rate"] > 0.55,
            "profit_factor_target": summary["profit_factor"] > 1.5
        }
    
    def generate_trade_analysis(self) -> Dict:
        """Generate detailed trade analysis"""
        if len(self.trades) == 0:
            return {}
            
        trades_df = pd.DataFrame([
            {
                'entry_time': trade.entry_time,
                'exit_time': trade.exit_time,
                'pair': trade.pair,
                'pnl': trade.pnl,
                'pnl_pct': trade.pnl_pct,
                'confidence': trade.confidence,
                'direction': trade.direction
            }
            for trade in self.trades
        ])
        
        return {
            "pair_performance": trades_df.groupby('pair')['pnl'].agg(['sum', 'mean', 'count']).to_dict(),
            "confidence_analysis": trades_df.groupby(pd.cut(trades_df['confidence'], bins=5))['pnl'].mean().to_dict(),
            "direction_performance": trades_df.groupby('direction')['pnl'].agg(['sum', 'mean', 'count']).to_dict()
        } 