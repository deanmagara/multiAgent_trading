import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class RiskParameters:
    max_risk_per_trade: float = 0.02  # 2% max risk per trade
    max_portfolio_risk: float = 0.06  # 6% max portfolio risk
    stop_loss_pips: float = 50.0
    take_profit_pips: float = 100.0
    max_correlation: float = 0.7
    max_positions: int = 5

class RiskManager:
    def __init__(self, risk_params: RiskParameters = None):
        self.risk_params = risk_params or RiskParameters()
        self.active_positions: Dict[str, Dict] = {}
        
    def calculate_position_size(self, 
                              account_balance: float,
                              entry_price: float,
                              stop_loss_price: float,
                              pair: str,
                              confidence: float) -> Tuple[float, Dict]:
        """
        Calculate position size based on risk management rules
        """
        # Calculate risk amount in currency
        risk_amount = account_balance * self.risk_params.max_risk_per_trade
        
        # Adjust for signal confidence
        confidence_multiplier = min(confidence, 1.0)
        adjusted_risk = risk_amount * confidence_multiplier
        
        # Calculate position size based on stop loss distance
        price_distance = abs(entry_price - stop_loss_price)
        if price_distance == 0:
            return 0.0, {"error": "Invalid stop loss distance"}
            
        position_size = adjusted_risk / price_distance
        
        # Check portfolio risk limits
        total_portfolio_risk = self.calculate_portfolio_risk(account_balance)
        if total_portfolio_risk + adjusted_risk > account_balance * self.risk_params.max_portfolio_risk:
            position_size *= 0.5  # Reduce position size
        
        # Check correlation limits
        if self.check_correlation_violation(pair):
            position_size *= 0.3  # Significantly reduce position size
            
        return position_size, {
            "risk_amount": adjusted_risk,
            "confidence_multiplier": confidence_multiplier,
            "portfolio_risk": total_portfolio_risk
        }
    
    def calculate_portfolio_risk(self, account_balance: float) -> float:
        """Calculate current portfolio risk"""
        total_risk = 0.0
        for position in self.active_positions.values():
            total_risk += position.get('risk_amount', 0.0)
        return total_risk
    
    def check_correlation_violation(self, new_pair: str) -> bool:
        """Check if adding new pair would violate correlation limits"""
        if len(self.active_positions) == 0:
            return False
            
        # Simple correlation check based on currency pairs
        base_currencies = [pos['pair'][:3] for pos in self.active_positions.values()]
        new_base = new_pair[:3]
        
        # Count similar base currencies
        similar_count = base_currencies.count(new_base)
        return similar_count >= 2  # Allow max 2 positions in same base currency
    
    def add_position(self, pair: str, position_data: Dict):
        """Add new position to tracking"""
        self.active_positions[pair] = position_data
    
    def remove_position(self, pair: str):
        """Remove position from tracking"""
        if pair in self.active_positions:
            del self.active_positions[pair]

class CapitalAllocator:
    def __init__(self, initial_capital: float = 10000.0):
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.risk_manager = RiskManager()
        self.performance_metrics = PerformanceMetrics()
        
    def allocate_capital(self, 
                        signals: List[Dict],
                        current_prices: Dict[str, float]) -> List[Dict]:
        """
        Allocate capital based on signals and risk management rules
        """
        allocations = []
        
        for signal in signals:
            pair = signal['pair']
            entry_price = current_prices.get(pair)
            confidence = signal.get('confidence', 0.5)
            
            if not entry_price:
                continue
                
            # Calculate stop loss and take profit
            stop_loss = self.calculate_stop_loss(signal, entry_price)
            take_profit = self.calculate_take_profit(signal, entry_price)
            
            # Calculate position size
            position_size, risk_info = self.risk_manager.calculate_position_size(
                self.current_capital,
                entry_price,
                stop_loss,
                pair,
                confidence
            )
            
            if position_size > 0:
                allocation = {
                    'pair': pair,
                    'position_size': position_size,
                    'entry_price': entry_price,
                    'stop_loss': stop_loss,
                    'take_profit': take_profit,
                    'confidence': confidence,
                    'risk_amount': risk_info['risk_amount'],
                    'signal_strength': signal.get('strength', 0.0),
                    'timestamp': signal.get('timestamp')
                }
                
                allocations.append(allocation)
                
                # Track position
                self.risk_manager.add_position(pair, {
                    'risk_amount': risk_info['risk_amount'],
                    'pair': pair
                })
        
        return allocations
    
    def calculate_stop_loss(self, signal: Dict, entry_price: float) -> float:
        """Calculate stop loss based on signal and risk parameters"""
        direction = signal.get('direction', 'buy')
        stop_loss_pips = self.risk_manager.risk_params.stop_loss_pips
        
        if direction == 'buy':
            return entry_price - (stop_loss_pips * 0.0001)
        else:
            return entry_price + (stop_loss_pips * 0.0001)
    
    def calculate_take_profit(self, signal: Dict, entry_price: float) -> float:
        """Calculate take profit based on signal and risk parameters"""
        direction = signal.get('direction', 'buy')
        take_profit_pips = self.risk_manager.risk_params.take_profit_pips
        
        if direction == 'buy':
            return entry_price + (take_profit_pips * 0.0001)
        else:
            return entry_price - (take_profit_pips * 0.0001)
    
    def update_capital(self, pnl: float):
        """Update capital after trade"""
        self.current_capital += pnl
        self.performance_metrics.add_trade(pnl)
