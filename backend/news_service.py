import os
import google.generativeai as genai
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
import time
from functools import lru_cache
import pandas as pd
from typing import List, Dict, Optional
import json

load_dotenv()

class NewsSentimentService:
    def __init__(self):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-pro')
        self.news_api_key = os.getenv('NEWS_API_KEY')
        self.news_api_url = "https://newsapi.org/v2/everything"
        self.cache = {}
        self.cache_duration = 300  # 5 minutes

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

    @lru_cache(maxsize=10)
    def get_news_factor(self, currency_pair):
        # Check cache first
        cache_key = f"{currency_pair}_{int(time.time() // self.cache_duration)}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        news_articles = self.fetch_forex_news(currency_pair)
        sentiment_analysis = self.analyze_sentiment(news_articles)
        result = {
            "currency_pair": currency_pair,
            "timestamp": datetime.now().isoformat(),
            "news_count": len(news_articles),
            "sentiment_analysis": sentiment_analysis,
            "recent_articles": news_articles[:5]
        }
        
        # Cache the result
        self.cache[cache_key] = result
        return result

class EconomicCalendar:
    """Economic calendar service for trading events"""
    
    def __init__(self):
        self.base_url = "https://api.fxstreet.com/v1/economic-calendar"  # Example API
        self.api_key = None  # You would need to get an API key
        self.cache = {}
        self.cache_duration = timedelta(hours=1)
    
    def get_economic_events(self, start_date: str = None, end_date: str = None, 
                           currency: str = None, impact: str = None) -> List[Dict]:
        """
        Get economic calendar events
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            currency: Filter by currency (USD, EUR, GBP, etc.)
            impact: Filter by impact (High, Medium, Low)
        """
        # For now, return sample data since we don't have API access
        return self._get_sample_events(start_date, end_date, currency, impact)
    
    def _get_sample_events(self, start_date: str = None, end_date: str = None,
                          currency: str = None, impact: str = None) -> List[Dict]:
        """Get sample economic events for testing"""
        sample_events = [
            {
                "id": 1,
                "date": "2024-01-15T14:30:00Z",
                "currency": "USD",
                "event": "Federal Reserve Interest Rate Decision",
                "impact": "High",
                "previous": "5.50%",
                "forecast": "5.50%",
                "actual": None,
                "description": "Federal Reserve announces interest rate decision"
            },
            {
                "id": 2,
                "date": "2024-01-16T13:30:00Z",
                "currency": "EUR",
                "event": "ECB President Lagarde Speech",
                "impact": "Medium",
                "previous": None,
                "forecast": None,
                "actual": None,
                "description": "European Central Bank President Christine Lagarde speaks"
            },
            {
                "id": 3,
                "date": "2024-01-17T09:30:00Z",
                "currency": "GBP",
                "event": "UK CPI (YoY)",
                "impact": "High",
                "previous": "4.6%",
                "forecast": "4.4%",
                "actual": None,
                "description": "UK Consumer Price Index year-over-year"
            },
            {
                "id": 4,
                "date": "2024-01-18T13:30:00Z",
                "currency": "USD",
                "event": "US Initial Jobless Claims",
                "impact": "Medium",
                "previous": "218K",
                "forecast": "215K",
                "actual": None,
                "description": "US Initial Jobless Claims weekly report"
            },
            {
                "id": 5,
                "date": "2024-01-19T15:00:00Z",
                "currency": "CAD",
                "event": "Bank of Canada Interest Rate Decision",
                "impact": "High",
                "previous": "5.00%",
                "forecast": "5.00%",
                "actual": None,
                "description": "Bank of Canada announces interest rate decision"
            }
        ]
        
        # Filter by date range
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            sample_events = [e for e in sample_events 
                           if datetime.fromisoformat(e['date'].replace('Z', '+00:00')) >= start_dt]
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            sample_events = [e for e in sample_events 
                           if datetime.fromisoformat(e['date'].replace('Z', '+00:00')) <= end_dt]
        
        # Filter by currency
        if currency:
            sample_events = [e for e in sample_events if e['currency'] == currency]
        
        # Filter by impact
        if impact:
            sample_events = [e for e in sample_events if e['impact'] == impact]
        
        return sample_events
    
    def get_high_impact_events(self, days_ahead: int = 7) -> List[Dict]:
        """Get high impact events in the next N days"""
        end_date = (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
        return self.get_economic_events(
            start_date=datetime.now().strftime('%Y-%m-%d'),
            end_date=end_date,
            impact="High"
        )
    
    def should_avoid_trading(self, pair: str, hours_before: int = 2) -> bool:
        """
        Check if trading should be avoided due to upcoming high-impact events
        
        Args:
            pair: Currency pair (e.g., "EUR/USD")
            hours_before: Hours before event to avoid trading
        """
        # Extract currencies from pair
        currencies = pair.split('/')
        if len(currencies) != 2:
            return False
        
        base_currency, quote_currency = currencies
        
        # Get high impact events in the next few hours
        end_time = datetime.now() + timedelta(hours=hours_before)
        events = self.get_high_impact_events(days_ahead=1)
        
        for event in events:
            event_time = datetime.fromisoformat(event['date'].replace('Z', '+00:00'))
            if (event['currency'] in [base_currency, quote_currency] and 
                event_time <= end_time):
                return True
        
        return False

    def get_real_economic_events(self, start_date: str = None, end_date: str = None, 
                               currency: str = None, impact: str = None) -> List[Dict]:
        """Get real economic calendar events from a free API"""
        try:
            # Using a free economic calendar API
            url = "https://api.tradingeconomics.com/calendar"
            params = {
                'c': 'guest:guest',  # Free API key
                'd1': start_date or datetime.now().strftime('%Y-%m-%d'),
                'd2': end_date or (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
            }
            
            if currency:
                params['country'] = currency
                
            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                events = []
                for event in data:
                    events.append({
                        "id": event.get('Id', 0),
                        "date": event.get('Date', ''),
                        "currency": event.get('Country', ''),
                        "event": event.get('Event', ''),
                        "impact": event.get('Importance', 'Medium'),
                        "previous": event.get('Previous', None),
                        "forecast": event.get('Forecast', None),
                        "actual": event.get('Actual', None),
                        "description": event.get('Category', '')
                    })
                return events
        except Exception as e:
            print(f"Error fetching economic calendar: {e}")
        
        # Fallback to sample data
        return self._get_sample_events(start_date, end_date, currency, impact)

news_service = NewsSentimentService() 