import yfinance as yf
import pandas as pd

class DataFetcher:
    def __init__(self):
        self.cache = {}

    def fetch_data(self, ticker, period="5y", interval="1d"):
        if ticker not in self.cache:
            data = yf.download(ticker, period=period, interval=interval)
            self.cache[ticker] = self.preprocess(data)
        return self.cache[ticker].copy()

    def preprocess(self, data):
        # Add technical indicators
        data['SMA_20'] = data['Close'].rolling(20).mean()
        data['RSI'] = self.calculateRsi(data['Close'])
        data.dropna(inplace=True)
        return data

    def calculateRsi(self, series, period=14):
        delta = series.diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(period).mean()
        avg_loss = loss.rolling(period).mean()
        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))