import backtrader as bt
from backtrader.feeds import PandasData

class RLStrategy(bt.Strategy):
    params = (('model_path', None),)
    
    def __init__(self):
        self.model = load_model(self.p.model_path)
        self.data_features = self._extract_features()
        
    def _extract_features(self):
        # Convert OHLC data to features matching training format
        pass
    
    def next(self):
        features = self._extract_features()
        action, _ = self.model.predict(features)
        
        if action == 1:  # Buy
            self.buy()
        elif action == 0:  # Sell
            self.sell()

def run_backtest(data, model_path):
    cerebro = bt.Cerebro()
    
    # Add data
    data = PandasData(dataname=data)
    cerebro.adddata(data)
    
    # Add strategy
    cerebro.addstrategy(RLStrategy, model_path=model_path)
    
    # Set initial capital
    cerebro.broker.setcash(10000.0)
    
    # Run backtest
    results = cerebro.run()
    return results