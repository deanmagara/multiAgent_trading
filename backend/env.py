import yfinance as yf
import pandas as pd
import talib
from .tradingEnv import TradingEnv

def make_env():
    df = yf.download("AAPL", period="1y", interval="1d")
    df = df.dropna().reset_index(drop=True)
    # Add TA-Lib indicators
    df['SMA_20'] = talib.SMA(df['Close'], timeperiod=20)
    df['RSI_14'] = talib.RSI(df['Close'], timeperiod=14)
    df = df.dropna().reset_index(drop=True)
    return TradingEnv(df)