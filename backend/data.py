import yfinance as yf
import pandas as pd
from typing import Optional

FOREX_PAIRS = [
    "EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCHF=X",
    "AUDUSD=X", "USDCAD=X", "NZDUSD=X", "BTC-USD"
]

class DataHandler:
    """
    A class to handle fetching, preprocessing, and storing market data.
    """
    def __init__(self):
        self.data_cache = {}

    def fetch_data(self, symbol: str, period: str = "1y", interval: str = "1d", force_reload: bool = False) -> Optional[pd.DataFrame]:
        """
        Fetches historical market data from Yahoo Finance.
        Caches the data to avoid repeated downloads.
        """
        cache_key = f"{symbol}_{period}_{interval}"
        if not force_reload and cache_key in self.data_cache:
            return self.data_cache[cache_key].copy()

        try:
            # Download data with explicit auto_adjust parameter to avoid warning
            df = yf.download(symbol, period=period, interval=interval, progress=False, auto_adjust=True)
            
            if df.empty:
                print(f"No data found for symbol {symbol} with period {period} and interval {interval}.")
                return None
            
            # Ensure the index is a DatetimeIndex and reset it properly
            df.index = pd.to_datetime(df.index)
            
            # Preprocess the data
            df = self.preprocess_data(df)
            
            # Double-check that the index is still a DatetimeIndex
            if not isinstance(df.index, pd.DatetimeIndex):
                print(f"Warning: Index is not DatetimeIndex for {symbol}, converting...")
                df.index = pd.to_datetime(df.index)
            
            self.data_cache[cache_key] = df
            return df.copy()

        except Exception as e:
            print(f"An error occurred while fetching data for {symbol}: {e}")
            return None

    def fetch_forex_data(self, pair: str, period: str = "1y", interval: str = "1d", force_reload: bool = False) -> Optional[pd.DataFrame]:
        # Remove the validation to allow any pair
        # if pair not in FOREX_PAIRS:
        #     raise ValueError(f"Unsupported forex pair: {pair}")
        return self.fetch_data(pair, period, interval, force_reload)

    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocesses the dataframe. Fills missing values and ensures correct dtypes.
        """
        # Store the original index
        original_index = df.index
        
        # If yfinance returns a MultiIndex (e.g., [('Open', ''), ...]), flatten it.
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # Convert column names to lowercase for consistency with technical indicators
        df.columns = [col.lower() for col in df.columns]
        
        # Fill missing values
        df.ffill(inplace=True)
        df.bfill(inplace=True)
        
        # Ensure the index is preserved as DatetimeIndex
        df.index = pd.to_datetime(original_index)
        
        # Verify the data structure
        print(f"Data shape: {df.shape}, Index type: {type(df.index)}, Columns: {list(df.columns)}")
        
        return df

data_handler = DataHandler()
