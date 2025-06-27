from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, APIRouter, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
from typing import Dict, List, Optional

from .agents import run_agent, multi_agent_coordination
from .signal_analyzer import SignalAnalyzer, EnhancedTradingAgent
from .env import make_env
from .backtest import run_backtest, EnhancedBacktest
import yfinance as yf
from .ollama_service import chatbot_service
from .data import data_handler
from .news_service import news_service
from .ensemble_voting import EnsembleVotingSystem
from .technical_indicators import TechnicalIndicators
from .multi_timeframe_analyzer import MultiTimeframeAnalyzer
from .capital_allocator import RiskManager

app = FastAPI()

# 1. Add CORS middleware to allow requests from your frontend
origins = [
    "http://localhost:3000",  # The default address for React apps
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# 2. Create a router to prefix all routes with /api
router = APIRouter(prefix="/api")

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        # Use default=str to handle non-serializable types like numpy floats
        message = json.dumps(data, default=str) 
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # This loop keeps the connection alive for server-to-client broadcasts.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

class AgentRequest(BaseModel):
    agent_type: str

class MultiAgentRequest(BaseModel):
    agent_types: list[str]
    pair: str

class BacktestRequest(BaseModel):
    symbol: str = None
    pair: str = None
    period: str = "1y"
    interval: str = "1d"

class ChatRequest(BaseModel):
    message: str

class EnhancedBacktestRequest(BaseModel):
    initial_capital: float
    risk_params: Dict
    market_data: List[Dict]
    signals: List[Dict]

class PositionSizeRequest(BaseModel):
    account_balance: float
    entry_price: float
    stop_loss_price: float
    pair: str
    confidence: float = 0.5

class SignalConfidenceRequest(BaseModel):
    signal: Dict

class EnsembleSignalRequest(BaseModel):
    market_data: Dict
    news_data: Optional[Dict] = None

class TechnicalIndicatorsRequest(BaseModel):
    market_data: Dict

class MultiTimeframeRequest(BaseModel):
    market_data: Dict

@router.get("/")
def index():
    return {"message": "RL Agent API is running!"}

@router.post("/run-agent")
async def run_rl_agent(req: AgentRequest):
    env = make_env()
    rewards = run_agent(req.agent_type, env, timesteps=5000)
    return {"rewards": rewards}

@router.post("/multi-agent")
async def run_multi_agent(req: MultiAgentRequest):
    def env_fn():
        return make_env(pair=req.pair) if req.pair else make_env()
    
    # Run in thread pool to avoid blocking
    with ThreadPoolExecutor() as executor:
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            executor, 
            multi_agent_coordination, 
            req.agent_types, 
            env_fn
        )
    
    # Add news sentiment asynchronously
    if req.pair:
        try:
            news_data = await loop.run_in_executor(
                executor, 
                news_service.get_news_factor, 
                req.pair
            )
            results["news_sentiment"] = news_data
        except Exception as e:
            results["news_sentiment"] = {"error": str(e)}
    
    chatbot_service.update_context(results)
    await manager.broadcast(results)
    return results

@router.post("/backtest")
async def backtest(req: BacktestRequest):
    env = make_env(
        symbol=req.symbol,
        pair=req.pair,
        period=req.period,
        interval=req.interval
    )
    df = env.df
    from .agents import train_agent
    model = train_agent("PPO", env, timesteps=10000)
    final_value = run_backtest(df, model)
    return {"final_portfolio_value": final_value}

@router.post("/chat")
async def chat_with_ollama(req: ChatRequest):
    response = chatbot_service.ask(req.message)
    return {"response": response}

@router.get("/market-data")
async def get_market_data():
    # Return multiple popular stocks/forex pairs with price and change data
    symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "EURUSD=X", "GBPUSD=X", "USDJPY=X"]
    market_data = []
    
    for symbol in symbols:
        try:
            df = data_handler.fetch_data(symbol=symbol, period="1d", interval="1m")
            if df is not None and not df.empty:
                # Get the latest price
                latest_price = df['Close'].iloc[-1]
                
                # Calculate change from previous close
                if len(df) > 1:
                    prev_close = df['Close'].iloc[-2]
                    change = ((latest_price - prev_close) / prev_close) * 100
                else:
                    change = 0.0
                
                market_data.append({
                    "symbol": symbol,
                    "price": round(latest_price, 2),
                    "change": round(change, 2)
                })
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            # Add placeholder data
            market_data.append({
                "symbol": symbol,
                "price": 0.0,
                "change": 0.0
            })
    
    return market_data

@router.get("/forex-data")
async def get_forex_data(
    pair: str = Query("EURUSD=X", description="Forex pair symbol, e.g., EURUSD=X"),
    period: str = Query("1y"),
    interval: str = Query("1d")
):
    df = data_handler.fetch_forex_data(pair, period, interval)
    if df is not None and not df.empty:
        return df.reset_index().to_dict(orient="records")
    return []

@router.get("/news-sentiment/{pair}")
async def get_news_sentiment(pair: str):
    try:
        news_data = news_service.get_news_factor(pair)
        return news_data
    except Exception as e:
        return {"error": str(e)}

@router.post("/backtest/enhanced")
async def run_enhanced_backtest(req: EnhancedBacktestRequest):
    """Run enhanced backtest with risk management"""
    try:
        # Convert to DataFrame
        df = pd.DataFrame(req.market_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Run backtest
        backtest = EnhancedBacktest(req.initial_capital, req.risk_params)
        results = backtest.run_backtest(df, req.signals)
        
        return {
            'success': True,
            'results': results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/performance/metrics")
async def get_performance_metrics():
    """Get current performance metrics"""
    try:
        # This would typically get data from your database
        # For now, returning sample metrics
        metrics = {
            'sharpe_ratio': 1.8,
            'max_drawdown': 12.5,
            'win_rate': 0.62,
            'profit_factor': 1.7,
            'total_trades': 150,
            'total_return': 0.25
        }
        
        return {
            'success': True,
            'metrics': metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/risk/calculate-position-size")
async def calculate_position_size(req: PositionSizeRequest):
    """Calculate position size based on risk management rules"""
    try:
        risk_manager = RiskManager()
        position_size, risk_info = risk_manager.calculate_position_size(
            req.account_balance, req.entry_price, req.stop_loss_price, req.pair, req.confidence
        )
        
        return {
            'success': True,
            'position_size': position_size,
            'risk_info': risk_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/signals/analyze-confidence")
async def analyze_signal_confidence(req: SignalConfidenceRequest):
    """Analyze signal confidence"""
    try:
        analyzer = SignalAnalyzer()
        confidence = analyzer.calculate_overall_confidence(req.signal)
        
        return {
            'success': True,
            'confidence': {
                'overall': confidence.overall_confidence,
                'technical': confidence.technical_score,
                'fundamental': confidence.fundamental_score,
                'sentiment': confidence.sentiment_score,
                'volatility': confidence.volatility_score
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ensemble/signal")
async def get_ensemble_signal(req: EnsembleSignalRequest):
    """Get ensemble trading signal from multiple agents"""
    try:
        ensemble = EnsembleVotingSystem()
        result = ensemble.get_ensemble_signal(req.market_data, req.news_data)
        
        return {
            'success': True,
            'signal': {
                'final_signal': result.final_signal,
                'confidence': result.confidence,
                'agreement_level': result.agreement_level,
                'votes': [
                    {
                        'agent_name': vote.agent_name,
                        'signal': vote.signal,
                        'confidence': vote.confidence,
                        'weight': vote.weight,
                        'reasoning': vote.reasoning
                    }
                    for vote in result.votes
                ],
                'consensus_breakdown': result.consensus_breakdown
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/technical/indicators")
async def get_technical_indicators(req: TechnicalIndicatorsRequest):
    """Get technical indicators analysis"""
    try:
        indicators = TechnicalIndicators()
        df = pd.DataFrame(req.market_data)
        results = indicators.analyze_all_indicators(df)
        
        return {
            'success': True,
            'indicators': {
                name: {
                    'value': result.value,
                    'signal': result.signal,
                    'strength': result.strength,
                    'description': result.description
                }
                for name, result in results.items()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/multi-timeframe/analysis")
async def get_multi_timeframe_analysis(req: MultiTimeframeRequest):
    """Get multi-timeframe analysis"""
    try:
        analyzer = MultiTimeframeAnalyzer()
        df = pd.DataFrame(req.market_data)
        results = analyzer.analyze_all_timeframes(df)
        
        return {
            'success': True,
            'analysis': {
                'short_term': {
                    'timeframe': results.short_term.timeframe,
                    'trend': results.short_term.trend,
                    'strength': results.short_term.strength,
                    'support': results.short_term.support,
                    'resistance': results.short_term.resistance,
                    'key_levels': results.short_term.key_levels,
                    'momentum': results.short_term.momentum,
                    'volatility': results.short_term.volatility
                },
                'medium_term': {
                    'timeframe': results.medium_term.timeframe,
                    'trend': results.medium_term.trend,
                    'strength': results.medium_term.strength,
                    'support': results.medium_term.support,
                    'resistance': results.medium_term.resistance,
                    'key_levels': results.medium_term.key_levels,
                    'momentum': results.medium_term.momentum,
                    'volatility': results.medium_term.volatility
                },
                'long_term': {
                    'timeframe': results.long_term.timeframe,
                    'trend': results.long_term.trend,
                    'strength': results.long_term.strength,
                    'support': results.long_term.support,
                    'resistance': results.long_term.resistance,
                    'key_levels': results.long_term.key_levels,
                    'momentum': results.long_term.momentum,
                    'volatility': results.long_term.volatility
                },
                'combined_analysis': results.combined_analysis,
                'consensus_signal': results.consensus_signal,
                'overall_confidence': results.overall_confidence
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forex-signals")
async def get_forex_signals():
    """Get current forex trading signals"""
    try:
        # This would typically get signals from your signal generation system
        # For now, returning sample signals
        signals = [
            {
                "pair": "EUR/USD",
                "direction": "buy",
                "strength": 0.75,
                "confidence": 0.82,
                "confidence_breakdown": {
                    "technical": 0.85,
                    "fundamental": 0.70,
                    "sentiment": 0.80,
                    "volatility": 0.75
                },
                "recommendation": "strong",
                "timestamp": "2024-01-15T10:30:00Z",
                "entry_price": 1.0850,
                "stop_loss": 1.0800,
                "take_profit": 1.0950,
                "risk_amount": 200.0,
                "position_size": 10000.0
            },
            {
                "pair": "GBP/USD",
                "direction": "sell",
                "strength": 0.65,
                "confidence": 0.71,
                "confidence_breakdown": {
                    "technical": 0.70,
                    "fundamental": 0.65,
                    "sentiment": 0.75,
                    "volatility": 0.60
                },
                "recommendation": "moderate",
                "timestamp": "2024-01-15T10:30:00Z",
                "entry_price": 1.2650,
                "stop_loss": 1.2700,
                "take_profit": 1.2550,
                "risk_amount": 150.0,
                "position_size": 7500.0
            }
        ]
        
        return {
            'success': True,
            'signals': signals
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main FastAPI app
app.include_router(router)