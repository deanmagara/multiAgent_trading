from typing import Dict, List, Optional
from dataclasses import dataclass
import logging

@dataclass
class SignalConfidence:
    technical_score: float = 0.0
    fundamental_score: float = 0.0
    sentiment_score: float = 0.0
    volatility_score: float = 0.0
    overall_confidence: float = 0.0

class SignalAnalyzer:
    def __init__(self):
        self.confidence_weights = {
            'technical': 0.4,
            'fundamental': 0.2,
            'sentiment': 0.2,
            'volatility': 0.2
        }
        
    def calculate_technical_confidence(self, signal: Dict) -> float:
        """Calculate technical analysis confidence"""
        confidence = 0.0
        
        # Signal strength
        strength = signal.get('strength', 0.0)
        confidence += strength * 0.3
        
        # Multiple timeframe confirmation
        timeframes = signal.get('timeframes', [])
        if len(timeframes) >= 2:
            confidence += 0.2
        
        # Indicator convergence
        indicators = signal.get('indicators', {})
        bullish_indicators = sum(1 for ind in indicators.values() if ind > 0)
        bearish_indicators = sum(1 for ind in indicators.values() if ind < 0)
        
        if abs(bullish_indicators - bearish_indicators) >= 2:
            confidence += 0.3
        
        # Volume confirmation
        if signal.get('volume_confirmation', False):
            confidence += 0.2
            
        return min(confidence, 1.0)
    
    def calculate_fundamental_confidence(self, signal: Dict) -> float:
        """Calculate fundamental analysis confidence"""
        confidence = 0.0
        
        # Economic calendar events
        if not signal.get('high_impact_news', False):
            confidence += 0.4
        
        # Interest rate differentials
        if signal.get('interest_rate_advantage', False):
            confidence += 0.3
        
        # Economic data alignment
        if signal.get('economic_data_bullish', False):
            confidence += 0.3
            
        return min(confidence, 1.0)
    
    def calculate_sentiment_confidence(self, signal: Dict) -> float:
        """Calculate sentiment analysis confidence"""
        confidence = 0.0
        
        # News sentiment
        news_sentiment = signal.get('news_sentiment', 0.0)
        confidence += abs(news_sentiment) * 0.4
        
        # Market sentiment
        market_sentiment = signal.get('market_sentiment', 0.0)
        confidence += abs(market_sentiment) * 0.3
        
        # Social sentiment
        social_sentiment = signal.get('social_sentiment', 0.0)
        confidence += abs(social_sentiment) * 0.3
        
        return min(confidence, 1.0)
    
    def calculate_volatility_confidence(self, signal: Dict) -> float:
        """Calculate volatility-based confidence"""
        confidence = 0.0
        
        # Volatility level
        volatility = signal.get('volatility', 0.0)
        if 0.01 <= volatility <= 0.03:  # Optimal volatility range
            confidence += 0.5
        elif 0.005 <= volatility <= 0.05:  # Acceptable range
            confidence += 0.3
        
        # Volatility trend
        if signal.get('volatility_decreasing', False):
            confidence += 0.3
        
        # ATR-based confidence
        atr_ratio = signal.get('atr_ratio', 1.0)
        if 0.5 <= atr_ratio <= 2.0:
            confidence += 0.2
            
        return min(confidence, 1.0)
    
    def calculate_overall_confidence(self, signal: Dict) -> SignalConfidence:
        """Calculate overall signal confidence"""
        technical = self.calculate_technical_confidence(signal)
        fundamental = self.calculate_fundamental_confidence(signal)
        sentiment = self.calculate_sentiment_confidence(signal)
        volatility = self.calculate_volatility_confidence(signal)
        
        overall = (
            technical * self.confidence_weights['technical'] +
            fundamental * self.confidence_weights['fundamental'] +
            sentiment * self.confidence_weights['sentiment'] +
            volatility * self.confidence_weights['volatility']
        )
        
        return SignalConfidence(
            technical_score=technical,
            fundamental_score=fundamental,
            sentiment_score=sentiment,
            volatility_score=volatility,
            overall_confidence=overall
        )

class EnhancedTradingAgent:
    def __init__(self, agent_type: str, signal_analyzer: SignalAnalyzer = None):
        self.agent_type = agent_type
        self.signal_analyzer = signal_analyzer or SignalAnalyzer()
        self.confidence_threshold = 0.6
        self.min_signal_strength = 0.3
        
    def analyze_signal(self, signal: Dict) -> Dict:
        """Analyze signal and add confidence scoring"""
        confidence = self.signal_analyzer.calculate_overall_confidence(signal)
        
        # Add confidence scores to signal
        signal['confidence'] = confidence.overall_confidence
        signal['confidence_breakdown'] = {
            'technical': confidence.technical_score,
            'fundamental': confidence.fundamental_score,
            'sentiment': confidence.sentiment_score,
            'volatility': confidence.volatility_score
        }
        
        # Filter signals based on confidence
        if confidence.overall_confidence < self.confidence_threshold:
            signal['recommendation'] = 'reject'
        elif signal.get('strength', 0.0) < self.min_signal_strength:
            signal['recommendation'] = 'weak'
        else:
            signal['recommendation'] = 'strong'
            
        return signal
    
    def generate_signal(self, market_data: Dict) -> Optional[Dict]:
        """Generate trading signal with confidence scoring"""
        # Base signal generation (implement based on agent type)
        base_signal = self._generate_base_signal(market_data)
        
        if base_signal:
            return self.analyze_signal(base_signal)
        
        return None
    
    def _generate_base_signal(self, market_data: Dict) -> Optional[Dict]:
        """Generate base signal - to be implemented by specific agents"""
        # This would be implemented differently for each agent type
        pass

class TechnicalAgent(EnhancedTradingAgent):
    def __init__(self):
        super().__init__("technical")
        
    def _generate_base_signal(self, market_data: Dict) -> Optional[Dict]:
        """Generate technical analysis signal"""
        # Implement technical analysis logic here
        # This is a placeholder - you'll need to implement actual technical analysis
        return {
            'pair': market_data.get('pair'),
            'direction': 'buy',  # or 'sell'
            'strength': 0.7,
            'timeframes': ['1h', '4h'],
            'indicators': {
                'rsi': 0.6,
                'macd': 0.8,
                'bollinger': 0.5
            },
            'volume_confirmation': True,
            'volatility': 0.02,
            'atr_ratio': 1.2
        } 