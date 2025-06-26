import os
import google.generativeai as genai
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

class NewsSentimentService:
    def __init__(self):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-pro')
        self.news_api_key = os.getenv('NEWS_API_KEY')
        self.news_api_url = "https://newsapi.org/v2/everything"

    def fetch_forex_news(self, currency_pair, hours_back=24):
        search_terms = self._get_search_terms(currency_pair)
        news_articles = []
        for term in search_terms:
            params = {
                'q': f'"{term}" AND (forex OR currency OR economy)',
                'from': (datetime.now() - timedelta(hours=hours_back)).isoformat(),
                'sortBy': 'publishedAt',
                'language': 'en',
                'apiKey': self.news_api_key
            }
            try:
                response = requests.get(self.news_api_url, params=params)
                if response.status_code == 200:
                    articles = response.json().get('articles', [])
                    news_articles.extend(articles[:5])
            except Exception as e:
                print(f"Error fetching news for {term}: {e}")
        return news_articles

    def _get_search_terms(self, currency_pair):
        currency_map = {
            'EURUSD=X': ['EUR', 'Euro', 'USD', 'US Dollar', 'ECB', 'Federal Reserve'],
            'GBPUSD=X': ['GBP', 'British Pound', 'USD', 'US Dollar', 'Bank of England'],
            'USDJPY=X': ['USD', 'US Dollar', 'JPY', 'Japanese Yen', 'Federal Reserve', 'Bank of Japan'],
            'USDCHF=X': ['USD', 'US Dollar', 'CHF', 'Swiss Franc', 'SNB'],
            'AUDUSD=X': ['AUD', 'Australian Dollar', 'USD', 'US Dollar', 'RBA'],
            'USDCAD=X': ['USD', 'US Dollar', 'CAD', 'Canadian Dollar', 'Bank of Canada'],
            'NZDUSD=X': ['NZD', 'New Zealand Dollar', 'USD', 'US Dollar', 'RBNZ']
        }
        return currency_map.get(currency_pair, [currency_pair.split('=')[0]])

    def analyze_sentiment(self, news_articles):
        if not news_articles:
            return {"sentiment": "neutral", "score": 0.0, "summary": "No recent news found", "confidence": 0}
        news_content = []
        for article in news_articles[:10]:
            content = f"Title: {article.get('title', '')}\n"
            content += f"Description: {article.get('description', '')}\n"
            content += f"Published: {article.get('publishedAt', '')}\n\n"
            news_content.append(content)
        news_text = "\n".join(news_content)
        prompt = f"""
        Analyze the following forex news articles and provide:
        1. Overall sentiment (bullish/bearish/neutral) for the currency pair
        2. Sentiment score (-1.0 to 1.0, where -1 is very bearish, 1 is very bullish)
        3. Brief summary of key factors affecting the currency pair
        4. Confidence level (0-100%) in your analysis

        News Articles:
        {news_text}

        Respond in JSON format:
        {{
            "sentiment": "bullish/bearish/neutral",
            "score": -1.0 to 1.0,
            "summary": "brief summary",
            "confidence": 0-100
        }}
        """
        try:
            response = self.model.generate_content(prompt)
            import json
            result = json.loads(response.text)
            return result
        except Exception as e:
            print(f"Error analyzing sentiment: {e}")
            return {"sentiment": "neutral", "score": 0.0, "summary": "Analysis failed", "confidence": 0}

    def get_news_factor(self, currency_pair):
        news_articles = self.fetch_forex_news(currency_pair)
        sentiment_analysis = self.analyze_sentiment(news_articles)
        return {
            "currency_pair": currency_pair,
            "timestamp": datetime.now().isoformat(),
            "news_count": len(news_articles),
            "sentiment_analysis": sentiment_analysis,
            "recent_articles": news_articles[:5]
        }

news_service = NewsSentimentService() 