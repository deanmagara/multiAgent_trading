import pandas as pd
from .tradingEnv import TradingEnv
from .data import data_handler

def make_env(df: pd.DataFrame = None, symbol: str = "AAPL", period: str = "1y", interval: str = "1d"):
    """
    Utility function to create a TradingEnv.
    If df is not provided, it fetches data using the DataHandler.
    """
    if df is None:
        df = data_handler.fetch_data(symbol=symbol, period=period, interval=interval)
        if df is None:
            raise ValueError(f"Could not fetch data for {symbol}. Environment cannot be created.")
            
    return TradingEnv(df)