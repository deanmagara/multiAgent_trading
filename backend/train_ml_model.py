import yfinance as yf
import pandas as pd
from ml_signal_generator import MLSignalGenerator

if __name__ == "__main__":
    # Download 1 year of 1-minute data for EURUSD
    df = yf.download("EURUSD=X", period="1y", interval="1m", progress=False)
    df = df.dropna()
    ml_gen = MLSignalGenerator()
    ml_gen.train(df)
    print("Model trained and saved.")