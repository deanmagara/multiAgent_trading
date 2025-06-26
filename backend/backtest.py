import backtrader as bt
import pandas as pd
import numpy as np

class RLStrategy(bt.Strategy):
    params = (('model', None),)

    def __init__(self):
        if self.p.model is None:
            raise ValueError("A trained RL model must be provided to the strategy.")

    def next(self):
        # We need to construct the observation exactly as the training environment does.
        # The TradingEnv uses the entire row of the dataframe.
        # We assume the yfinance columns: Open, High, Low, Close, Volume, Adj Close
        # Backtrader's default PandasData feed does not include 'Adj Close'.
        # For simplicity, we will construct the observation from the available standard columns.
        # This requires ensuring the agent is trained on the same observation space.
        obs = np.array([
            self.data.open[0],
            self.data.high[0],
            self.data.low[0],
            self.data.close[0],
            self.data.volume[0]
        ], dtype=np.float32)

        action, _ = self.p.model.predict(obs, deterministic=True)
        
        # Based on tradingEnv.py: 0=hold, 1=buy, 2=sell
        if action == 1 and not self.position:
            self.buy()
        elif action == 2 and self.position:
            self.sell()

def run_backtest(df, model):
    # Ensure the index is a proper datetime object
    if not isinstance(df.index, pd.DatetimeIndex):
        # If the index is numeric (timestamp), convert it to datetime
        if df.index.dtype in ['int64', 'float64']:
            df.index = pd.to_datetime(df.index, unit='s')
        else:
            # If it's already a string or other format, try to parse it
            df.index = pd.to_datetime(df.index)
    
    # Create a copy to avoid modifying the original dataframe
    df_copy = df.copy()
    
    # Ensure all required columns exist
    required_columns = ['open', 'high', 'low', 'close', 'volume']
    for col in required_columns:
        if col not in df_copy.columns:
            # If column doesn't exist, try to find it with different case
            col_found = False
            for existing_col in df_copy.columns:
                if existing_col.lower() == col:
                    df_copy[col] = df_copy[existing_col]
                    col_found = True
                    break
            if not col_found:
                raise ValueError(f"Required column '{col}' not found in dataframe")
    
    # Rename columns to match backtrader expectations (lowercase)
    column_mapping = {}
    for col in df_copy.columns:
        if col.lower() in required_columns:
            column_mapping[col] = col.lower()
    
    if column_mapping:
        df_copy = df_copy.rename(columns=column_mapping)
    
    # Create Cerebro engine
    cerebro = bt.Cerebro()
    
    # Add data feed
    data = bt.feeds.PandasData(dataname=df_copy)
    cerebro.adddata(data)
    
    # Add strategy
    cerebro.addstrategy(RLStrategy, model=model)
    
    # Set initial cash
    cerebro.broker.setcash(100000.0)
    
    # Run backtest
    cerebro.run()
    
    # Get final portfolio value
    final_value = cerebro.broker.getvalue()
    
    return final_value