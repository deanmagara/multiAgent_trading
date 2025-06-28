import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from .technical_indicators import TechnicalIndicators
from .multi_timeframe_analyzer import MultiTimeframeAnalyzer
from .ensemble_voting import EnsembleVotingSystem
from .signal_analyzer import SignalAnalyzer
from .data import data_handler

class SignalGenerator:
    """Generates real trading signals based on technical analysis and market data"""
    
    def __init__(self):
        self.technical_indicators = TechnicalIndicators()
        self.multi_timeframe_analyzer = MultiTimeframeAnalyzer()
        self.ensemble_voting = EnsembleVotingSystem()
        self.signal_analyzer = SignalAnalyzer()
        
    def generate_signals_for_pair(self, pair: str, period: str = "1d", interval: str = "1h") -> List[Dict]:
        """Generate real trading signals for a specific currency pair"""
        try:
            # Fetch real market data
            df = data_handler.fetch_forex_data(pair, period=period, interval=interval)
            if df is None or df.empty:
                return []
            
            # Calculate technical indicators
            indicators = self.technical_indicators.analyze_all_indicators(df)
            
            # Multi-timeframe analysis
            mtf_analysis = self.multi_timeframe_analyzer.analyze_all_timeframes(df)
            
            # Generate ensemble signal
            ensemble_result = self.ensemble_voting.get_ensemble_signal({
                'market_data': df.to_dict('records'),
                'indicators': indicators
            })
            
            # Analyze signal confidence
            signal_confidence = self.signal_analyzer.calculate_overall_confidence({
                'technical': indicators,
                'multi_timeframe': mtf_analysis,
                'ensemble': ensemble_result
            })
            
            # Generate signal based on analysis
            signal = self._create_signal_from_analysis(
                pair, df, indicators, mtf_analysis, ensemble_result, signal_confidence
            )
            
            return [signal] if signal else []
            
        except Exception as e:
            print(f"Error generating signals for {pair}: {e}")
            return []
    
    def _create_signal_from_analysis(self, pair: str, df: pd.DataFrame, indicators: Dict, 
                                   mtf_analysis: Dict, ensemble_result: Dict, 
                                   confidence: float) -> Optional[Dict]:
        """Create a trading signal from the analysis results"""
        try:
            # Get latest price data
            latest_price = df['close'].iloc[-1]
            latest_high = df['high'].iloc[-1]
            latest_low = df['low'].iloc[-1]
            
            # Determine signal direction based on ensemble result
            direction = ensemble_result.get('final_signal', 'hold')
            if direction == 'hold':
                return None
            
            # Calculate signal strength based on confidence and agreement
            strength = min(confidence * ensemble_result.get('agreement_level', 0.5), 0.95)
            
            # Calculate entry, stop loss, and take profit levels
            atr_result = indicators.get('atr')
            atr = atr_result.value if atr_result else 0.001
            
            # Get volatility from ATR
            volatility = atr / latest_price if latest_price > 0 else 0.001
            
            if direction == 'buy':
                entry_price = latest_price
                stop_loss = entry_price - (atr * 2)  # 2 ATR for stop loss
                take_profit = entry_price + (atr * 3)  # 3 ATR for take profit
            else:  # sell
                entry_price = latest_price
                stop_loss = entry_price + (atr * 2)
                take_profit = entry_price - (atr * 3)
            
            # Calculate position size based on risk management
            risk_per_trade = 200.0  # $200 risk per trade
            risk_per_pip = abs(entry_price - stop_loss) / 10000  # For forex
            position_size = risk_per_trade / (risk_per_pip * 10)  # 10 pip risk
            
            # Determine recommendation based on confidence and strength
            if confidence > 0.8 and strength > 0.7:
                recommendation = "strong"
            elif confidence > 0.6 and strength > 0.5:
                recommendation = "moderate"
            else:
                recommendation = "weak"
            
            # Format pair name
            formatted_pair = self._format_pair_name(pair)
            
            # FIXED: Extract values from IndicatorResult objects
            rsi_result = indicators.get('rsi')
            rsi_value = rsi_result.value if rsi_result else 0
            
            macd_result = indicators.get('macd')
            macd_signal = macd_result.signal if macd_result else 'neutral'
            
            bb_result = indicators.get('bollinger_bands')
            bb_position = bb_result.value if bb_result else 0
            
            # Get trend strength from multi-timeframe analysis
            trend_strength = 0
            if hasattr(mtf_analysis, 'combined_analysis'):
                trend_strength = mtf_analysis.combined_analysis.get('trend_strength', 0)
            
            return {
                "pair": formatted_pair,
                "direction": direction,
                "strength": round(strength, 2),
                "confidence": round(confidence, 2),
                "confidence_breakdown": {
                    "technical": round(confidence * 0.4, 2),  # Technical analysis weight
                    "fundamental": round(confidence * 0.2, 2),  # Fundamental weight
                    "sentiment": round(confidence * 0.2, 2),  # Sentiment weight
                    "volatility": round(volatility, 2)
                },
                "recommendation": recommendation,
                "timestamp": datetime.now().isoformat(),
                "entry_price": round(entry_price, 5),
                "stop_loss": round(stop_loss, 5),
                "take_profit": round(take_profit, 5),
                "risk_amount": risk_per_trade,
                "position_size": round(position_size, 2),
                "analysis": {
                    "rsi": round(rsi_value, 2),
                    "macd": macd_signal,
                    "bollinger_position": round(bb_position, 2),
                    "trend_strength": round(trend_strength, 2)
                }
            }
            
        except Exception as e:
            print(f"Error creating signal: {e}")
            return None
    
    def _format_pair_name(self, pair: str) -> str:
        """Convert pair format from EURUSD=X to EUR/USD"""
        pair_map = {
            'EURUSD=X': 'EUR/USD',
            'GBPUSD=X': 'GBP/USD',
            'USDJPY=X': 'USD/JPY',
            'USDCHF=X': 'USD/CHF',
            'AUDUSD=X': 'AUD/USD',
            'USDCAD=X': 'USD/CAD',
            'NZDUSD=X': 'NZD/USD',
        }
        return pair_map.get(pair, pair.replace('=X', '').replace('USD', '/USD'))
    
    def generate_all_signals(self) -> List[Dict]:
        """Generate signals for all major currency pairs"""
        pairs = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X']
        all_signals = []
        
        for pair in pairs:
            signals = self.generate_signals_for_pair(pair)
            all_signals.extend(signals)
        
        return all_signals

# Create global instance
signal_generator = SignalGenerator() 