import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime
from .technical_indicators import TechnicalIndicators
from .multi_timeframe_analyzer import MultiTimeframeAnalyzer
from .ensemble_voting import EnsembleVotingSystem
from .data import data_handler

class SignalGenerator:
    def __init__(self):
        self.technical_indicators = TechnicalIndicators()
        self.mtf_analyzer = MultiTimeframeAnalyzer()
        self.ensemble_voting = EnsembleVotingSystem()
    
    def generate_signals_for_pair(self, pair: str) -> List[Dict]:
        """Generate trading signals for a specific forex pair"""
        try:
            print(f"�� Generating signals for {pair}")
            
            # Fetch market data
            df = data_handler.fetch_forex_data(pair, period="1y", interval="1d")
            if df is None or df.empty:
                print(f"❌ No data available for {pair}")
                return []
            
            print(f"✅ Data fetched for {pair}, shape: {df.shape}")
            
            # Calculate technical indicators using the correct method
            indicators = self.technical_indicators.analyze_all_indicators(df)
            print(f"📊 Technical indicators calculated: {len(indicators)} indicators")
            
            # Also get raw indicator values for compatibility
            raw_indicators = self.technical_indicators.calculate_all(df)
            
            # Perform multi-timeframe analysis
            mtf_analysis = self.mtf_analyzer.analyze_all_timeframes(df)
            print(f"⏰ Multi-timeframe analysis completed")
            
            # Get ensemble voting result
            ensemble_result = self.ensemble_voting.get_ensemble_signal(
                market_data=df,
                news_data=None
            )
            print(f"�� Ensemble result: {ensemble_result.final_signal}, confidence: {ensemble_result.confidence}")
            
            # Calculate overall confidence
            confidence = self._calculate_confidence(indicators, mtf_analysis, ensemble_result)
            print(f"�� Overall confidence: {confidence}")
            
            # Create signal
            signal = self._create_signal_from_analysis(
                pair=pair,
                df=df,
                indicators=indicators,
                raw_indicators=raw_indicators,
                mtf_analysis=mtf_analysis,
                ensemble_result=ensemble_result,
                confidence=confidence
            )
            
            if signal:
                print(f"✅ Signal generated for {pair}: {signal['direction']} - {signal['recommendation']}")
            else:
                print(f"⚠️ No signal generated for {pair} (likely 'hold' signal)")
            
            return [signal] if signal else []
            
        except Exception as e:
            print(f"❌ Error generating signals for {pair}: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _calculate_confidence(self, indicators: Dict, mtf_analysis, ensemble_result) -> float:
        """Calculate overall confidence score for the signal"""
        try:
            # Base confidence from ensemble agreement
            base_confidence = ensemble_result.agreement_level if hasattr(ensemble_result, 'agreement_level') else 0.5
            
            # Technical indicator confidence
            tech_confidence = 0.0
            if indicators:
                # Check if key indicators are in agreement
                rsi_result = indicators.get('rsi')
                macd_result = indicators.get('macd')
                bb_result = indicators.get('bollinger_bands')
                
                if rsi_result and macd_result and bb_result:
                    # Simple agreement check
                    agreements = 0
                    total_indicators = 3
                    
                    # RSI oversold/overbought check
                    if rsi_result.value < 30 or rsi_result.value > 70:
                        agreements += 1
                    
                    # MACD signal check
                    if macd_result.signal in ['buy', 'sell']:
                        agreements += 1
                    
                    # Bollinger Bands position check
                    if abs(bb_result.value) > 0.5:  # Near bands
                        agreements += 1
                    
                    tech_confidence = agreements / total_indicators
            
            # Multi-timeframe confidence - FIXED: Use correct key name
            mtf_confidence = 0.0
            if hasattr(mtf_analysis, 'combined_analysis'):
                combined = mtf_analysis.combined_analysis
                weighted_strength = combined.get('weighted_strength', 0)
                mtf_confidence = min(abs(weighted_strength), 1.0)
            
            # Weighted average
            final_confidence = (
                base_confidence * 0.4 +
                tech_confidence * 0.4 +
                mtf_confidence * 0.2
            )
            
            return min(final_confidence, 1.0)
            
        except Exception as e:
            print(f"Error calculating confidence: {e}")
            return 0.5
    
    def _create_signal_from_analysis(self, pair: str, df: pd.DataFrame, indicators: Dict, 
                                   raw_indicators: Dict, mtf_analysis, ensemble_result, 
                                   confidence: float) -> Optional[Dict]:
        """Create a trading signal from the analysis results"""
        try:
            # Get latest price data
            latest_price = df['close'].iloc[-1]
            latest_high = df['high'].iloc[-1]
            latest_low = df['low'].iloc[-1]
            
            # Determine signal direction based on ensemble result
            direction = ensemble_result.final_signal if hasattr(ensemble_result, 'final_signal') else 'hold'
            
            # FIXED: Always create a signal, even for 'hold' signals
            # This allows the frontend to show "no action" signals
            if direction == 'hold':
                # Create a "hold" signal with neutral values
                formatted_pair = self._format_pair_name(pair)
                
                return {
                    "pair": formatted_pair,
                    "direction": "hold",  # Changed from None to "hold"
                    "strength": 0.0,
                    "confidence": round(confidence, 2),
                    "confidence_breakdown": {
                        "technical": round(confidence * 0.4, 2),
                        "fundamental": round(confidence * 0.2, 2),
                        "sentiment": round(confidence * 0.2, 2),
                        "volatility": 0.0
                    },
                    "recommendation": "weak",
                    "timestamp": datetime.now().isoformat(),
                    "entry_price": round(latest_price, 5),
                    "stop_loss": round(latest_price, 5),
                    "take_profit": round(latest_price, 5),
                    "risk_amount": 0.0,
                    "position_size": 0.0,
                    "analysis": {
                        "rsi": 50.0,
                        "macd": "neutral",
                        "bollinger_position": 0.5,
                        "trend_strength": 0.0
                    }
                }
            
            # Calculate signal strength based on confidence and agreement
            agreement_level = ensemble_result.agreement_level if hasattr(ensemble_result, 'agreement_level') else 0.5
            strength = min(confidence * agreement_level, 0.95)
            
            # Calculate entry, stop loss, and take profit levels
            # Use raw indicators for ATR calculation
            atr_value = raw_indicators.get('atr', pd.Series([0.001])).iloc[-1] if 'atr' in raw_indicators else 0.001
            
            # Get volatility from ATR
            volatility = atr_value / latest_price if latest_price > 0 else 0.001
            
            if direction == 'buy':
                entry_price = latest_price
                stop_loss = entry_price - (atr_value * 2)  # 2 ATR for stop loss
                take_profit = entry_price + (atr_value * 3)  # 3 ATR for take profit
            else:  # sell
                entry_price = latest_price
                stop_loss = entry_price + (atr_value * 2)
                take_profit = entry_price - (atr_value * 3)
            
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
            
            # Extract values from IndicatorResult objects
            rsi_result = indicators.get('rsi')
            rsi_value = rsi_result.value if rsi_result else 0
            
            macd_result = indicators.get('macd')
            macd_signal = macd_result.signal if macd_result else 'neutral'
            
            bb_result = indicators.get('bollinger_bands')
            bb_position = bb_result.value if bb_result else 0
            
            # Get trend strength from multi-timeframe analysis - FIXED: Use correct key
            trend_strength = 0
            if hasattr(mtf_analysis, 'combined_analysis'):
                combined = mtf_analysis.combined_analysis
                trend_strength = abs(combined.get('weighted_strength', 0))
            
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
        
        print(f"�� Generating signals for {len(pairs)} pairs: {pairs}")
        
        for pair in pairs:
            signals = self.generate_signals_for_pair(pair)
            all_signals.extend(signals)
            print(f"📊 Total signals so far: {len(all_signals)}")
        
        print(f"✅ Final signal count: {len(all_signals)}")
        return all_signals

# Create global instance
signal_generator = SignalGenerator()