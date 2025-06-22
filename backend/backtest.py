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

def run_backtest(df: pd.DataFrame, model):
    cerebro = bt.Cerebro()
    data = bt.feeds.PandasData(dataname=df)
    cerebro.adddata(data)
    cerebro.addstrategy(RLStrategy, model=model)
    cerebro.broker.set_cash(10000)
    # cerebro.run() returns a list of strategies. We are interested in the final value.
    cerebro.run()
    final_value = cerebro.broker.getvalue()
    return final_value