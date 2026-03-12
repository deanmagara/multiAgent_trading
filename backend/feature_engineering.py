import pandas as pd
import numpy as np

class FeatureEngineer:
    def create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        features = pd.DataFrame(index=df.index)
        features['close'] = df['close']
        features['returns_1'] = df['close'].pct_change(1)
        features['returns_5'] = df['close'].pct_change(5)
        features['sma_10'] = df['close'].rolling(10).mean()
        features['sma_50'] = df['close'].rolling(50).mean()
        features['rsi_14'] = self.rsi(df['close'], 14)
        features['volatility_10'] = df['close'].rolling(10).std()
        features['volatility_50'] = df['close'].rolling(50).std()
        features = features.dropna()
        return features

    def rsi(self, series, period=14):
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))