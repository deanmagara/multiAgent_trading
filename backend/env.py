import pandas as pd
from .tradingEnv import TradingEnv
from .data import data_handler
from .news_service import news_service

def make_env(
    df=None,
    symbol: str = None,
    pair: str = None,
    period: str = "1y",
    interval: str = "1d"
):
    """
    Utility function to create a TradingEnv.
    If df is not provided, fetches data using DataHandler.
    If 'pair' is provided, fetches forex data.
    """
    if df is not None:
        return TradingEnv(df)
    if pair:
        df = data_handler.fetch_forex_data(pair, period, interval)
        if df is None:
            raise ValueError(f"Could not fetch data for {pair}. Environment cannot be created.")
        def news_sentiment_provider():
            sentiment = news_service.get_news_factor(pair).get("sentiment_analysis", {})
            return {
                "score": sentiment.get("score", 0.0),
                "confidence": sentiment.get("confidence", 0.0)
            }
        return TradingEnv(df, news_sentiment_provider=news_sentiment_provider)
    if symbol:
        df = data_handler.fetch_data(symbol, period, interval)
        if df is None:
            raise ValueError(f"Could not fetch data for {symbol}. Environment cannot be created.")
        return TradingEnv(df)
    raise ValueError("No data source provided for environment.")