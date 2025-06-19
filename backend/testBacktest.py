import yfinance as yf
from backend.backtest import run_backtest

df = yf.download("AAPL", period="1y", interval="1d")
final_value = run_backtest(df)
print("Final Portfolio Value:", final_value)