import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from .multi_timeframe_analyzer import MultiTimeframeAnalyzer
from .technical_indicators import TechnicalIndicators
from .signal_analyzer import SignalAnalyzer

@dataclass
class AgentVote:
    agent_name: str
    signal: str  # 'buy', 'sell', 'hold'
    confidence: float
    weight: float
    reasoning: str

@dataclass
class EnsembleResult:
    final_signal: str
    confidence: float
    agreement_level: float
    votes: List[AgentVote]
    consensus_breakdown: Dict[str, int]

class EnsembleVotingSystem:
    def __init__(self):
        self.mtf_analyzer = MultiTimeframeAnalyzer()
        self.tech_indicators = TechnicalIndicators()
        self.signal_analyzer = SignalAnalyzer()
        
        # Agent weights (can be adjusted based on performance)
        self.agent_weights = {
            'technical_agent': 0.3,
            'sentiment_agent': 0.2,
            'multi_timeframe_agent': 0.25,
            'momentum_agent': 0.15,
            'volatility_agent': 0.1
        }
        
        # Minimum confidence threshold
        self.min_confidence = 0.6
        self.min_agreement = 0.6
    
    def collect_votes(self, market_data: Dict, news_data: Dict = None) -> List[AgentVote]:
        """Collect votes from all agents"""
        votes = []
        
        # Technical Agent Vote
        tech_vote = self._get_technical_vote(market_data)
        votes.append(tech_vote)
        
        # Sentiment Agent Vote
        sentiment_vote = self._get_sentiment_vote(market_data, news_data)
        votes.append(sentiment_vote)
        
        # Multi-timeframe Agent Vote
        mtf_vote = self._get_multi_timeframe_vote(market_data)
        votes.append(mtf_vote)
        
        # Momentum Agent Vote
        momentum_vote = self._get_momentum_vote(market_data)
        votes.append(momentum_vote)
        
        # Volatility Agent Vote
        volatility_vote = self._get_volatility_vote(market_data)
        votes.append(volatility_vote)
        
        return votes
    
    def _get_technical_vote(self, market_data: Dict) -> AgentVote:
        """Get technical analysis vote"""
        # Convert market data to DataFrame
        df = self._prepare_dataframe(market_data)
        
        # Calculate technical indicators
        indicators = self.tech_indicators.analyze_all_indicators(df)
        
        # Aggregate indicator signals
        buy_signals = sum(1 for ind in indicators.values() if ind.signal == 'buy')
        sell_signals = sum(1 for ind in indicators.values() if ind.signal == 'sell')
        total_indicators = len(indicators)
        
        # Determine signal
        if buy_signals > sell_signals and buy_signals / total_indicators > 0.5:
            signal = 'buy'
            confidence = buy_signals / total_indicators
        elif sell_signals > buy_signals and sell_signals / total_indicators > 0.5:
            signal = 'sell'
            confidence = sell_signals / total_indicators
        else:
            signal = 'hold'
            confidence = 0.5
        
        reasoning = f"Technical indicators: {buy_signals} buy, {sell_signals} sell signals"
        
        return AgentVote(
            agent_name='technical_agent',
            signal=signal,
            confidence=confidence,
            weight=self.agent_weights['technical_agent'],
            reasoning=reasoning
        )
    
    def _get_sentiment_vote(self, market_data: Dict, news_data: Dict = None) -> AgentVote:
        """Get sentiment analysis vote"""
        # Simulate sentiment analysis
        sentiment_score = np.random.uniform(-1, 1)  # Replace with actual sentiment analysis
        
        if sentiment_score > 0.3:
            signal = 'buy'
            confidence = min(abs(sentiment_score), 0.9)
        elif sentiment_score < -0.3:
            signal = 'sell'
            confidence = min(abs(sentiment_score), 0.9)
        else:
            signal = 'hold'
            confidence = 0.5
        
        reasoning = f"Sentiment score: {sentiment_score:.2f}"
        
        return AgentVote(
            agent_name='sentiment_agent',
            signal=signal,
            confidence=confidence,
            weight=self.agent_weights['sentiment_agent'],
            reasoning=reasoning
        )
    
    def _get_multi_timeframe_vote(self, market_data: Dict) -> AgentVote:
        """Get multi-timeframe analysis vote"""
        df = self._prepare_dataframe(market_data)
        
        # Analyze multiple timeframes
        mtf_analysis = self.mtf_analyzer.analyze_all_timeframes(df)
        combined = mtf_analysis.combined_analysis
        
        print("Combined analysis:", combined, type(combined))
        
        # FIXED: Use correct key names from the dictionary
        consensus_trend = combined.get('consensus_trend', 'sideways')
        weighted_strength = combined.get('weighted_strength', 0.0)
        
        # Determine signal based on overall trend
        if consensus_trend == 'bullish':
            signal = 'buy'
            confidence = weighted_strength
        elif consensus_trend == 'bearish':
            signal = 'sell'
            confidence = abs(weighted_strength)
        else:
            signal = 'hold'
            confidence = 0.5
        
        reasoning = f"Multi-timeframe trend: {consensus_trend}"
        
        return AgentVote(
            agent_name='multi_timeframe_agent',
            signal=signal,
            confidence=confidence,
            weight=self.agent_weights['multi_timeframe_agent'],
            reasoning=reasoning
        )
    
    def _get_momentum_vote(self, market_data: Dict) -> AgentVote:
        """Get momentum analysis vote"""
        df = self._prepare_dataframe(market_data)
        
        # Calculate momentum indicators
        rsi = self.tech_indicators.calculate_rsi(df['close'])
        macd = self.tech_indicators.calculate_macd(df['close'])
        
        # Analyze momentum
        rsi_value = rsi.iloc[-1]
        macd_value = macd['macd'].iloc[-1]
        macd_signal = macd['signal'].iloc[-1]
        
        momentum_score = 0
        if rsi_value < 30:
            momentum_score += 1
        elif rsi_value > 70:
            momentum_score -= 1
        
        if macd_value > macd_signal:
            momentum_score += 1
        else:
            momentum_score -= 1
        
        # Determine signal
        if momentum_score > 0:
            signal = 'buy'
            confidence = 0.7
        elif momentum_score < 0:
            signal = 'sell'
            confidence = 0.7
        else:
            signal = 'hold'
            confidence = 0.5
        
        reasoning = f"Momentum score: {momentum_score}"
        
        return AgentVote(
            agent_name='momentum_agent',
            signal=signal,
            confidence=confidence,
            weight=self.agent_weights['momentum_agent'],
            reasoning=reasoning
        )
    
    def _get_volatility_vote(self, market_data: Dict) -> AgentVote:
        """Get volatility analysis vote"""
        df = self._prepare_dataframe(market_data)
        
        # Calculate volatility
        atr = self.tech_indicators.calculate_atr(df)
        bb = self.tech_indicators.calculate_bollinger_bands(df['close'])
        
        current_atr = atr.iloc[-1]
        bb_width = (bb['upper'].iloc[-1] - bb['lower'].iloc[-1]) / bb['middle'].iloc[-1]
        
        # Volatility-based signal
        if bb_width > 0.05:  # High volatility
            signal = 'hold'  # Avoid trading in high volatility
            confidence = 0.8
        else:
            signal = 'hold'  # Neutral in normal volatility
            confidence = 0.5
        
        reasoning = f"Volatility: ATR={current_atr:.4f}, BB Width={bb_width:.3f}"
        
        return AgentVote(
            agent_name='volatility_agent',
            signal=signal,
            confidence=confidence,
            weight=self.agent_weights['volatility_agent'],
            reasoning=reasoning
        )
    
    def _prepare_dataframe(self, market_data: Dict) -> pd.DataFrame:
        """Prepare DataFrame from market data"""
        # Handle different input types
        if isinstance(market_data, pd.DataFrame):
            # If it's already a DataFrame, return it
            return market_data
        elif isinstance(market_data, dict) and 'market_data' in market_data:
            # If it's a dict with 'market_data' key, extract the DataFrame
            if isinstance(market_data['market_data'], pd.DataFrame):
                return market_data['market_data']
            else:
                # Convert records to DataFrame
                df = pd.DataFrame(market_data['market_data'])
        elif isinstance(market_data, list):
            # If it's a list of records
            df = pd.DataFrame(market_data)
        else:
            # If it's a single record dict
            df = pd.DataFrame([market_data])
        
        # Ensure we have a DatetimeIndex
        if not isinstance(df.index, pd.DatetimeIndex):
            # Try to create a DatetimeIndex from the data
            if 'date' in df.columns:
                df.index = pd.to_datetime(df['date'])
            elif 'timestamp' in df.columns:
                df.index = pd.to_datetime(df['timestamp'])
            else:
                # Create a default DatetimeIndex
                df.index = pd.date_range(start='2020-01-01', periods=len(df), freq='D')
        
        # Ensure we have the required columns
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        for col in required_columns:
            if col not in df.columns:
                df[col] = 0.0
        
        return df
    
    def calculate_ensemble_result(self, votes: List[AgentVote]) -> EnsembleResult:
        """Calculate final ensemble result from votes"""
        # Count votes by signal
        signal_counts = {'buy': 0, 'sell': 0, 'hold': 0}
        weighted_scores = {'buy': 0.0, 'sell': 0.0, 'hold': 0.0}
        
        for vote in votes:
            signal_counts[vote.signal] += 1
            weighted_scores[vote.signal] += vote.confidence * vote.weight
        
        # Determine final signal
        final_signal = max(weighted_scores, key=weighted_scores.get)
        final_confidence = weighted_scores[final_signal]
        
        # Calculate agreement level
        total_votes = len(votes)
        agreement_level = signal_counts[final_signal] / total_votes
        
        # Check if we meet minimum thresholds
        if final_confidence < self.min_confidence or agreement_level < self.min_agreement:
            final_signal = 'hold'
            final_confidence = 0.5
        
        return EnsembleResult(
            final_signal=final_signal,
            confidence=final_confidence,
            agreement_level=agreement_level,
            votes=votes,
            consensus_breakdown=signal_counts
        )
    
    def get_ensemble_signal(self, market_data, news_data: Dict = None) -> EnsembleResult:
        """Get ensemble trading signal"""
        # Handle both DataFrame and Dict inputs
        if isinstance(market_data, pd.DataFrame):
            # If it's a DataFrame, wrap it in the expected format
            data_dict = {'market_data': market_data}
        else:
            # If it's already a dict, use it as is
            data_dict = market_data
        
        # Collect votes from all agents
        votes = self.collect_votes(data_dict, news_data)
        
        # Calculate ensemble result
        result = self.calculate_ensemble_result(votes)
        
        return result 