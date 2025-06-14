import backtrader as bt
import pandas as pd

class RLStrategy(bt.Strategy):
    def __init__(self):
        pass  # Add indicators if needed

    def next(self):
        # Example: Buy if RSI < 30, Sell if RSI > 70
        if self.datas[0].rsi[0] < 30:
            self.buy()
        elif self.datas[0].rsi[0] > 70:
            self.sell()

def run_backtest(df: pd.DataFrame):
    cerebro = bt.Cerebro()
    data = bt.feeds.PandasData(dataname=df)
    cerebro.adddata(data)
    cerebro.addstrategy(RLStrategy)
    cerebro.broker.set_cash(10000)
    result = cerebro.run()
    return cerebro.broker.getvalue()