import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from .technical_indicators import TechnicalIndicators

@dataclass
class TimeframeAnalysis:
    timeframe: str
    trend: str  # 'bullish', 'bearish', 'sideways'
    strength: float  # -1 to 1
    support: float
    resistance: float
    key_levels: List[float]
    momentum: float
    volatility: float

@dataclass
class MultiTimeframeResult:
    short_term: TimeframeAnalysis
    medium_term: TimeframeAnalysis
    long_term: TimeframeAnalysis
    combined_analysis: Dict
    consensus_signal: str
    overall_confidence: float

class MultiTimeframeAnalyzer:
    def __init__(self):
        self.tech_indicators = TechnicalIndicators()
        
        # Timeframe configurations
        self.timeframes = {
            'short_term': '1H',
            'medium_term': '4H', 
            'long_term': '1D'
        }
        
        # Weight for each timeframe
        self.timeframe_weights = {
            'short_term': 0.2,
            'medium_term': 0.3,
            'long_term': 0.5
        }
    
    def analyze_all_timeframes(self, df: pd.DataFrame) -> MultiTimeframeResult:
        """Analyze market data across multiple timeframes"""
        
        # Resample data for different timeframes
        short_term_df = self._resample_dataframe(df, '1H')
        medium_term_df = self._resample_dataframe(df, '4H')
        long_term_df = self._resample_dataframe(df, '1D')
        
        # Analyze each timeframe
        short_analysis = self._analyze_timeframe(short_term_df, 'short_term')
        medium_analysis = self._analyze_timeframe(medium_term_df, 'medium_term')
        long_analysis = self._analyze_timeframe(long_term_df, 'long_term')
        
        # Combine analyses
        combined = self._combine_timeframe_analyses([short_analysis, medium_analysis, long_analysis])
        
        return MultiTimeframeResult(
            short_term=short_analysis,
            medium_term=medium_analysis,
            long_term=long_analysis,
            combined_analysis=combined,
            consensus_signal=combined['consensus_signal'],
            overall_confidence=combined['overall_confidence']
        )
    
    def _resample_dataframe(self, df: pd.DataFrame, timeframe: str) -> pd.DataFrame:
        """Resample data to different timeframe"""
        if timeframe == '1H':
            timeframe = '1h'
        elif timeframe == '4H':
            timeframe = '4h'
        elif timeframe == '1D':
            timeframe = '1d'
        
        resampled = df.resample(timeframe).agg({
            'open': 'first',
            'high': 'max',
            'low': 'min',
            'close': 'last',
            'volume': 'sum'
        }).dropna()
        
        return resampled
    
    def _analyze_timeframe(self, df: pd.DataFrame, timeframe_name: str) -> TimeframeAnalysis:
        """Analyze a specific timeframe"""
        
        # Calculate technical indicators
        indicators = self.tech_indicators.analyze_all_indicators(df)
        
        # Determine trend
        trend, strength = self._determine_trend(df, indicators)
        
        # Find support and resistance
        support, resistance = self._find_support_resistance(df)
        
        # Calculate key levels
        key_levels = self._calculate_key_levels(df)
        
        # Calculate momentum
        momentum = self._calculate_momentum(df, indicators)
        
        # Calculate volatility
        volatility = self._calculate_volatility(df)
        
        return TimeframeAnalysis(
            timeframe=timeframe_name,
            trend=trend,
            strength=strength,
            support=support,
            resistance=resistance,
            key_levels=key_levels,
            momentum=momentum,
            volatility=volatility
        )
    
    def _determine_trend(self, df: pd.DataFrame, indicators: Dict) -> Tuple[str, float]:
        """Determine trend direction and strength"""
        
        # Get moving averages
        sma_20_result = indicators.get('sma_20')
        sma_50_result = indicators.get('sma_50')
        ma_20 = sma_20_result.value if sma_20_result else df['close'].mean()
        ma_50 = sma_50_result.value if sma_50_result else df['close'].mean()
        current_price = df['close'].iloc[-1]
        
        # Get RSI
        rsi_result = indicators.get('rsi')
        rsi = rsi_result.value if rsi_result else 50
        
        # Get MACD
        macd_result = indicators.get('macd')
        macd_signal = macd_result.signal if macd_result else 'neutral'
        
        # Calculate trend strength
        trend_score = 0
        
        # Price vs moving averages
        if current_price > ma_20 > ma_50:
            trend_score += 0.4
        elif current_price < ma_20 < ma_50:
            trend_score -= 0.4
        
        # RSI analysis
        if rsi > 50:
            trend_score += 0.2
        else:
            trend_score -= 0.2
        
        # MACD analysis
        if macd_signal == 'bullish':
            trend_score += 0.2
        elif macd_signal == 'bearish':
            trend_score -= 0.2
        
        # Determine trend
        if trend_score > 0.3:
            trend = 'bullish'
            strength = min(trend_score, 1.0)
        elif trend_score < -0.3:
            trend = 'bearish'
            strength = max(trend_score, -1.0)
        else:
            trend = 'sideways'
            strength = 0.0
        
        return trend, strength
    
    def _find_support_resistance(self, df: pd.DataFrame) -> Tuple[float, float]:
        """Find support and resistance levels"""
        
        # Use pivot points
        high = df['high'].iloc[-1]
        low = df['low'].iloc[-1]
        close = df['close'].iloc[-1]
        
        # Pivot point
        pivot = (high + low + close) / 3
        
        # Support and resistance
        r1 = 2 * pivot - low
        s1 = 2 * pivot - high
        r2 = pivot + (high - low)
        s2 = pivot - (high - low)
        
        # Use recent lows and highs as additional levels
        recent_low = df['low'].tail(20).min()
        recent_high = df['high'].tail(20).max()
        
        support = min(s1, recent_low)
        resistance = max(r1, recent_high)
        
        return support, resistance
    
    def _calculate_key_levels(self, df: pd.DataFrame) -> List[float]:
        """Calculate key price levels"""
        
        current_price = df['close'].iloc[-1]
        
        # Fibonacci retracement levels
        high = df['high'].max()
        low = df['low'].min()
        diff = high - low
        
        fib_levels = [
            low + 0.236 * diff,  # 23.6%
            low + 0.382 * diff,  # 38.2%
            low + 0.5 * diff,    # 50%
            low + 0.618 * diff,  # 61.8%
            low + 0.786 * diff   # 78.6%
        ]
        
        # Add current price and round to 5 decimal places
        key_levels = [round(level, 5) for level in fib_levels]
        key_levels.append(round(current_price, 5))
        
        return sorted(key_levels)
    
    def _calculate_momentum(self, df: pd.DataFrame, indicators: Dict) -> float:
        """Calculate momentum score"""
        
        # Get RSI
        rsi_result = indicators.get('rsi')
        rsi = rsi_result.value if rsi_result else 50
        
        # Get MACD
        macd_result = indicators.get('macd')
        macd_value = macd_result.value if macd_result else 0
        macd_signal = macd_result.signal if macd_result else 'neutral'
        
        # Calculate momentum score
        momentum_score = 0
        
        # RSI momentum
        if rsi > 70:
            momentum_score -= 0.3  # Overbought
        elif rsi < 30:
            momentum_score += 0.3  # Oversold
        elif rsi > 50:
            momentum_score += 0.1  # Bullish momentum
        else:
            momentum_score -= 0.1  # Bearish momentum
        
        # MACD momentum
        if macd_signal == 'bullish':
            momentum_score += 0.2
        else:
            momentum_score -= 0.2
        
        return max(-1.0, min(1.0, momentum_score))
    
    def _calculate_volatility(self, df: pd.DataFrame) -> float:
        """Calculate volatility"""
        
        # Calculate daily returns
        returns = df['close'].pct_change().dropna()
        
        # Calculate volatility (standard deviation of returns)
        volatility = returns.std()
        
        return volatility
    
    def _combine_timeframe_analyses(self, analyses: List[TimeframeAnalysis]) -> Dict:
        """Combine analyses from different timeframes"""
        
        # Calculate weighted consensus
        total_weight = 0
        weighted_strength = 0
        trend_votes = {'bullish': 0, 'bearish': 0, 'sideways': 0}
        
        for analysis in analyses:
            weight = self.timeframe_weights.get(analysis.timeframe, 0.33)
            total_weight += weight
            weighted_strength += analysis.strength * weight
            trend_votes[analysis.trend] += weight
        
        # Determine consensus trend
        consensus_trend = max(trend_votes, key=trend_votes.get)
        
        # Calculate overall confidence
        overall_confidence = abs(weighted_strength) if total_weight > 0 else 0
        
        # Determine consensus signal
        if consensus_trend == 'bullish' and overall_confidence > 0.6:
            consensus_signal = 'buy'
        elif consensus_trend == 'bearish' and overall_confidence > 0.6:
            consensus_signal = 'sell'
        else:
            consensus_signal = 'hold'
        
        return {
            'consensus_trend': consensus_trend,
            'consensus_signal': consensus_signal,
            'overall_confidence': overall_confidence,
            'weighted_strength': weighted_strength,
            'trend_votes': trend_votes,
            'timeframe_agreement': max(trend_votes.values()) / total_weight if total_weight > 0 else 0
        } 