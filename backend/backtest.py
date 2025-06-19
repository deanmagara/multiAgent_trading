import backtrader as bt
import pandas as pd

class RLStrategy(bt.Strategy):
    def __init__(self):
        self.rsi = bt.indicators.RSI(self.datas[0], period=14)

    def next(self):
        if self.rsi[0] < 30:
            self.buy()
        elif self.rsi[0] > 70:
            self.sell()

def run_backtest(df: pd.DataFrame):
    cerebro = bt.Cerebro()
    data = bt.feeds.PandasData(dataname=df)
    cerebro.adddata(data)
    cerebro.addstrategy(RLStrategy)
    cerebro.broker.set_cash(10000)
    result = cerebro.run()
    final_value = cerebro.broker.getvalue()
    return final_value