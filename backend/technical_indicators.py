import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

@dataclass
class IndicatorResult:
    value: float
    signal: str  # 'buy', 'sell', 'neutral'
    strength: float  # 0 to 1
    description: str

class TechnicalIndicators:
    def __init__(self):
        self.lookback_periods = {
            'sma': [20, 50, 200],
            'ema': [12, 26],
            'rsi': 14,
            'macd': {'fast': 12, 'slow': 26, 'signal': 9},
            'bollinger': 20,
            'stochastic': 14,
            'atr': 14,
            'adx': 14
        }
    
    def analyze_all_indicators(self, df: pd.DataFrame) -> Dict[str, IndicatorResult]:
        """Analyze all technical indicators"""
        
        results = {}
        
        # Moving Averages
        results.update(self._analyze_moving_averages(df))
        
        # Oscillators
        results.update(self._analyze_oscillators(df))
        
        # Volatility Indicators
        results.update(self._analyze_volatility_indicators(df))
        
        # Trend Indicators
        results.update(self._analyze_trend_indicators(df))
        
        # Volume Indicators
        results.update(self._analyze_volume_indicators(df))
        
        return results
    
    def _analyze_moving_averages(self, df: pd.DataFrame) -> Dict[str, IndicatorResult]:
        """Analyze moving averages"""
        results = {}
        
        current_price = df['close'].iloc[-1]
        
        # Simple Moving Averages
        for period in self.lookback_periods['sma']:
            sma = self.calculate_sma(df['close'], period)
            sma_value = sma.iloc[-1]
            
            # Determine signal
            if current_price > sma_value:
                signal = 'buy'
                strength = min((current_price - sma_value) / sma_value, 1.0)
            else:
                signal = 'sell'
                strength = min((sma_value - current_price) / sma_value, 1.0)
            
            results[f'sma_{period}'] = IndicatorResult(
                value=sma_value,
                signal=signal,
                strength=strength,
                description=f'{period}-period SMA'
            )
        
        # Exponential Moving Averages
        for period in self.lookback_periods['ema']:
            ema = self.calculate_ema(df['close'], period)
            ema_value = ema.iloc[-1]
            
            if current_price > ema_value:
                signal = 'buy'
                strength = min((current_price - ema_value) / ema_value, 1.0)
            else:
                signal = 'sell'
                strength = min((ema_value - current_price) / ema_value, 1.0)
            
            results[f'ema_{period}'] = IndicatorResult(
                value=ema_value,
                signal=signal,
                strength=strength,
                description=f'{period}-period EMA'
            )
        
        return results
    
    def _analyze_oscillators(self, df: pd.DataFrame) -> Dict[str, IndicatorResult]:
        """Analyze oscillators"""
        results = {}
        
        # RSI
        rsi = self.calculate_rsi(df['close'])
        rsi_value = rsi.iloc[-1]
        
        if rsi_value < 30:
            signal = 'buy'
            strength = (30 - rsi_value) / 30
        elif rsi_value > 70:
            signal = 'sell'
            strength = (rsi_value - 70) / 30
        else:
            signal = 'neutral'
            strength = 0.0
        
        results['rsi'] = IndicatorResult(
            value=rsi_value,
            signal=signal,
            strength=strength,
            description='RSI (Relative Strength Index)'
        )
        
        # Stochastic
        stoch = self.calculate_stochastic(df)
        k_value = stoch['%K'].iloc[-1]
        d_value = stoch['%D'].iloc[-1]
        
        if k_value < 20 and d_value < 20:
            signal = 'buy'
            strength = (20 - min(k_value, d_value)) / 20
        elif k_value > 80 and d_value > 80:
            signal = 'sell'
            strength = (max(k_value, d_value) - 80) / 20
        else:
            signal = 'neutral'
            strength = 0.0
        
        results['stochastic'] = IndicatorResult(
            value=k_value,
            signal=signal,
            strength=strength,
            description='Stochastic Oscillator'
        )
        
        return results
    
    def _analyze_volatility_indicators(self, df: pd.DataFrame) -> Dict[str, IndicatorResult]:
        """Analyze volatility indicators"""
        results = {}
        
        # Bollinger Bands
        bb = self.calculate_bollinger_bands(df['close'])
        current_price = df['close'].iloc[-1]
        upper_band = bb['upper'].iloc[-1]
        lower_band = bb['lower'].iloc[-1]
        middle_band = bb['middle'].iloc[-1]
        
        # Calculate position within bands
        band_width = upper_band - lower_band
        if band_width > 0:
            position = (current_price - lower_band) / band_width
        else:
            position = 0.5
        
        if current_price < lower_band:
            signal = 'buy'
            strength = min((lower_band - current_price) / current_price, 1.0)
        elif current_price > upper_band:
            signal = 'sell'
            strength = min((current_price - upper_band) / current_price, 1.0)
        else:
            signal = 'neutral'
            strength = 0.0
        
        results['bollinger_bands'] = IndicatorResult(
            value=position,
            signal=signal,
            strength=strength,
            description='Bollinger Bands Position'
        )
        
        # ATR (Average True Range)
        atr = self.calculate_atr(df)
        atr_value = atr.iloc[-1]
        
        # ATR doesn't give buy/sell signals, but indicates volatility
        results['atr'] = IndicatorResult(
            value=atr_value,
            signal='neutral',
            strength=0.0,
            description='Average True Range (Volatility)'
        )
        
        return results
    
    def _analyze_trend_indicators(self, df: pd.DataFrame) -> Dict[str, IndicatorResult]:
        """Analyze trend indicators"""
        results = {}
        
        # MACD
        macd_data = self.calculate_macd(df['close'])
        macd_line = macd_data['macd'].iloc[-1]
        signal_line = macd_data['signal'].iloc[-1]
        histogram = macd_data['histogram'].iloc[-1]
        
        if macd_line > signal_line and histogram > 0:
            signal = 'buy'
            strength = min(abs(histogram) / abs(macd_line), 1.0) if macd_line != 0 else 0.0
        elif macd_line < signal_line and histogram < 0:
            signal = 'sell'
            strength = min(abs(histogram) / abs(macd_line), 1.0) if macd_line != 0 else 0.0
        else:
            signal = 'neutral'
            strength = 0.0
        
        results['macd'] = IndicatorResult(
            value=macd_line,
            signal=signal,
            strength=strength,
            description='MACD (Moving Average Convergence Divergence)'
        )
        
        # ADX (Average Directional Index)
        adx = self.calculate_adx(df)
        adx_value = adx['ADX'].iloc[-1]
        di_plus = adx['DI+'].iloc[-1]
        di_minus = adx['DI-'].iloc[-1]
        
        if adx_value > 25:  # Strong trend
            if di_plus > di_minus:
                signal = 'buy'
                strength = min(adx_value / 100, 1.0)
            else:
                signal = 'sell'
                strength = min(adx_value / 100, 1.0)
        else:
            signal = 'neutral'
            strength = 0.0
        
        results['adx'] = IndicatorResult(
            value=adx_value,
            signal=signal,
            strength=strength,
            description='ADX (Average Directional Index)'
        )
        
        return results
    
    def _analyze_volume_indicators(self, df: pd.DataFrame) -> Dict[str, IndicatorResult]:
        """Analyze volume indicators"""
        results = {}
        
        # Volume SMA
        volume_sma = self.calculate_sma(df['volume'], 20)
        current_volume = df['volume'].iloc[-1]
        avg_volume = volume_sma.iloc[-1]
        
        # Volume ratio
        volume_ratio = current_volume / avg_volume if avg_volume > 0 else 1.0
        
        # Volume doesn't give direct buy/sell signals
        results['volume_ratio'] = IndicatorResult(
            value=volume_ratio,
            signal='neutral',
            strength=0.0,
            description='Volume Ratio (Current vs Average)'
        )
        
        return results
    
    # Individual indicator calculation methods
    def calculate_sma(self, series: pd.Series, period: int) -> pd.Series:
        """Calculate Simple Moving Average"""
        return series.rolling(window=period).mean()
    
    def calculate_ema(self, series: pd.Series, period: int) -> pd.Series:
        """Calculate Exponential Moving Average"""
        return series.ewm(span=period).mean()
    
    def calculate_rsi(self, series: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI"""
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def calculate_macd(self, series: pd.Series) -> pd.DataFrame:
        """Calculate MACD"""
        ema_fast = self.calculate_ema(series, self.lookback_periods['macd']['fast'])
        ema_slow = self.calculate_ema(series, self.lookback_periods['macd']['slow'])
        macd_line = ema_fast - ema_slow
        signal_line = self.calculate_ema(macd_line, self.lookback_periods['macd']['signal'])
        histogram = macd_line - signal_line
        
        return pd.DataFrame({
            'macd': macd_line,
            'signal': signal_line,
            'histogram': histogram
        })
    
    def calculate_bollinger_bands(self, series: pd.Series, period: int = 20, std_dev: float = 2) -> pd.DataFrame:
        """Calculate Bollinger Bands"""
        sma = self.calculate_sma(series, period)
        std = series.rolling(window=period).std()
        upper_band = sma + (std * std_dev)
        lower_band = sma - (std * std_dev)
        
        return pd.DataFrame({
            'upper': upper_band,
            'middle': sma,
            'lower': lower_band
        })
    
    def calculate_stochastic(self, df: pd.DataFrame, k_period: int = 14, d_period: int = 3) -> pd.DataFrame:
        """Calculate Stochastic Oscillator"""
        low_min = df['low'].rolling(window=k_period).min()
        high_max = df['high'].rolling(window=k_period).max()
        
        k_percent = 100 * ((df['close'] - low_min) / (high_max - low_min))
        d_percent = k_percent.rolling(window=d_period).mean()
        
        return pd.DataFrame({
            '%K': k_percent,
            '%D': d_percent
        })
    
    def calculate_atr(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Calculate Average True Range"""
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        atr = true_range.rolling(window=period).mean()
        
        return atr
    
    def calculate_adx(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """Calculate Average Directional Index"""
        # Calculate True Range
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        
        # Calculate Directional Movement
        up_move = df['high'] - df['high'].shift()
        down_move = df['low'].shift() - df['low']
        
        dm_plus = np.where((up_move > down_move) & (up_move > 0), up_move, 0)
        dm_minus = np.where((down_move > up_move) & (down_move > 0), down_move, 0)
        
        # Calculate smoothed values
        tr_smooth = true_range.rolling(window=period).mean()
        dm_plus_smooth = pd.Series(dm_plus).rolling(window=period).mean()
        dm_minus_smooth = pd.Series(dm_minus).rolling(window=period).mean()
        
        # Calculate DI+ and DI-
        di_plus = 100 * (dm_plus_smooth / tr_smooth)
        di_minus = 100 * (dm_minus_smooth / tr_smooth)
        
        # Calculate DX and ADX
        dx = 100 * np.abs(di_plus - di_minus) / (di_plus + di_minus)
        adx = pd.Series(dx).rolling(window=period).mean()
        
        return pd.DataFrame({
            'ADX': adx,
            'DI+': di_plus,
            'DI-': di_minus
        })
    
    def calculate_all(self, df: pd.DataFrame) -> Dict:
        """Calculate all technical indicators and return comprehensive analysis"""
        try:
            # Calculate basic indicators
            rsi = self.calculate_rsi(df['close'])
            macd_data = self.calculate_macd(df['close'])
            bb_data = self.calculate_bollinger_bands(df['close'])
            atr = self.calculate_atr(df)
            
            # Calculate trend indicators
            sma_20 = self.calculate_sma(df['close'], 20)
            sma_50 = self.calculate_sma(df['close'], 50)
            ema_12 = self.calculate_ema(df['close'], 12)
            ema_26 = self.calculate_ema(df['close'], 26)
            
            # Calculate volatility (using ATR as proxy)
            volatility = atr.iloc[-1] if not atr.empty else 0.001
            
            # Extract values for technical score calculation
            rsi_values = rsi.tolist() if not rsi.empty else [50]
            macd_values = macd_data['macd'].tolist() if not macd_data.empty else [0]
            bb_upper_values = bb_data['upper'].tolist() if not bb_data.empty else [df['close'].iloc[-1]]
            bb_lower_values = bb_data['lower'].tolist() if not bb_data.empty else [df['close'].iloc[-1]]
            
            # Generate technical scores
            technical_score = self._calculate_technical_score(df, rsi_values, macd_values, bb_upper_values, bb_lower_values)
            fundamental_score = self._calculate_fundamental_score(df)
            sentiment_score = self._calculate_sentiment_score(df)
            
            return {
                'rsi': rsi,
                'macd': macd_data['macd'],
                'macd_signal': macd_data['signal'],
                'bollinger_upper': bb_data['upper'],
                'bollinger_lower': bb_data['lower'],
                'atr': atr,
                'sma_20': sma_20,
                'sma_50': sma_50,
                'ema_12': ema_12,
                'ema_26': ema_26,
                'volatility': volatility,
                'technical_score': technical_score,
                'fundamental_score': fundamental_score,
                'sentiment_score': sentiment_score,
                'bollinger_position': self._calculate_bollinger_position(df, bb_upper_values, bb_lower_values)
            }
        except Exception as e:
            print(f"Error calculating indicators: {e}")
            return {}
    
    def _calculate_technical_score(self, df: pd.DataFrame, rsi: List[float], macd: List[float], 
                                 bollinger_upper: List[float], bollinger_lower: List[float]) -> float:
        """Calculate overall technical score"""
        try:
            latest_price = df['close'].iloc[-1]
            latest_rsi = rsi[-1] if rsi else 50
            latest_macd = macd[-1] if macd else 0
            latest_bollinger_upper = bollinger_upper[-1] if bollinger_upper else latest_price
            latest_bollinger_lower = bollinger_lower[-1] if bollinger_lower else latest_price
            
            # RSI analysis (0-100 scale)
            rsi_score = 0.5
            if latest_rsi < 30:  # Oversold
                rsi_score = 0.8
            elif latest_rsi > 70:  # Overbought
                rsi_score = 0.2
            elif 40 <= latest_rsi <= 60:  # Neutral
                rsi_score = 0.5
            
            # MACD analysis
            macd_score = 0.5
            if latest_macd > 0:
                macd_score = 0.7
            else:
                macd_score = 0.3
            
            # Bollinger Bands analysis
            bb_score = 0.5
            if latest_price <= latest_bollinger_lower:
                bb_score = 0.8  # Potential buy
            elif latest_price >= latest_bollinger_upper:
                bb_score = 0.2  # Potential sell
            
            # Combine scores
            technical_score = (rsi_score + macd_score + bb_score) / 3
            return round(technical_score, 2)
            
        except Exception as e:
            print(f"Error calculating technical score: {e}")
            return 0.5

    def _calculate_fundamental_score(self, df: pd.DataFrame) -> float:
        # Implementation of _calculate_fundamental_score method
        # This method should return a float representing the fundamental score
        # For now, we'll return a placeholder value
        return 0.5

    def _calculate_sentiment_score(self, df: pd.DataFrame) -> float:
        # Implementation of _calculate_sentiment_score method
        # This method should return a float representing the sentiment score
        # For now, we'll return a placeholder value
        return 0.5

    def _calculate_bollinger_position(self, df: pd.DataFrame, bollinger_upper: List[float], bollinger_lower: List[float]) -> float:
        # Implementation of _calculate_bollinger_position method
        # This method should return a float representing the bollinger position
        # For now, we'll return a placeholder value
        return 0.5 