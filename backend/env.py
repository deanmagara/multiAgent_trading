import yfinance as yf
import pandas as pd
from tradingEnv import TradingEnv

def make_env():
    df = yf.download("AAPL", period="1y", interval="1d")
    df = df.dropna().reset_index(drop=True)
    return TradingEnv(df)