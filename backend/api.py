from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, APIRouter, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np

from .agents import run_agent, multi_agent_coordination
from .signal_analyzer import SignalAnalyzer, EnhancedTradingAgent
from .backtest import run_backtest, EnhancedBacktest, WalkForwardAnalyzer
import yfinance as yf
from .ollama_service import chatbot_service
from .data import data_handler
from .news_service import news_service
from .ensemble_voting import EnsembleVotingSystem
from .technical_indicators import TechnicalIndicators
from .multi_timeframe_analyzer import MultiTimeframeAnalyzer
from .capital_allocator import RiskManager
from .signal_generator import signal_generator
from .websocket_broadcast import active_connections, broadcast_signal
import threading

# Use active_connections in your WebSocket endpoint  # Import the broadcast function

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
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                self.active_connections.remove(connection)

manager = ConnectionManager()


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
    await manager.broadcast(json.dumps(results))
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
            df = data_handler.fetch_data(symbol, period="1d", interval="1d")
            if df is not None and not df.empty:
                # FIXED: Use lowercase column names
                latest_price = df['close'].iloc[-1]
                
                # Calculate change from previous close
                if len(df) > 1:
                    prev_close = df['close'].iloc[-2]
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
async def get_forex_signals(pair: str = Query(None, description="Specific pair to get signals for")):
    """Get real forex trading signals based on technical analysis"""
    try:
        if pair:
            # Generate signal for specific pair
            signals = signal_generator.generate_signals_for_pair(pair)
        else:
            # Generate signals for all pairs
            signals = signal_generator.generate_all_signals()
        
        return {
            'success': True,
            'signals': signals,
            'timestamp': datetime.now().isoformat(),
            'total_signals': len(signals)
        }
        
    except Exception as e:
        print(f"Error generating signals: {e}")
        return {
            'success': False,
            'error': str(e),
            'signals': []
        }

@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.websocket("/ws/signals")
async def websocket_signals(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

async def broadcast_alert(alert_type: str, message: str, data: dict = None):
    """Broadcast alert to all connected clients"""
    alert = {
        "type": alert_type,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "data": data or {}
    }
    await manager.broadcast(json.dumps(alert))

@router.post("/alerts/test")
async def test_alert():
    """Test alert broadcasting"""
    await broadcast_alert(
        "signal", 
        "New EUR/USD buy signal generated",
        {
            "pair": "EUR/USD",
            "direction": "buy",
            "strength": 0.85,
            "confidence": 0.92
        }
    )
    return {"message": "Test alert sent"}

@router.post("/alerts/risk")
async def send_risk_alert(alert_data: dict):
    """Send risk management alert"""
    await broadcast_alert(
        "risk",
        alert_data.get("message", "Risk management alert"),
        alert_data
    )
    return {"message": "Risk alert sent"}

@router.post("/generate-signal")
async def generate_signal(signal_request: dict):
    """Generate trading signal and broadcast alert"""
    try:
        # Your existing signal generation logic here
        signal = {
            "pair": signal_request.get("pair", "EUR/USD"),
            "direction": "buy",  # This would come from your analysis
            "strength": 0.85,
            "confidence": 0.92,
            "timestamp": datetime.now().isoformat()
        }
        
        # Broadcast alert
        await broadcast_alert(
            "signal",
            f"New {signal['pair']} {signal['direction']} signal",
            signal
        )
        
        return {"success": True, "signal": signal}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/walk-forward-analysis")
async def run_walk_forward_analysis(request: dict):
    """Run walk-forward analysis on historical data"""
    try:
        # Extract parameters
        symbol = request.get("symbol", "EURUSD")
        start_date = request.get("start_date", "2020-01-01")
        end_date = request.get("end_date", "2024-01-01")
        train_period_days = request.get("train_period_days", 252)
        test_period_days = request.get("test_period_days", 63)
        step_days = request.get("step_days", 21)
        
        # Get historical data (you'll need to implement this)
        # data = get_historical_data(symbol, start_date, end_date)
        
        # For now, create sample data
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        data = pd.DataFrame({
            'open': np.random.uniform(1.0, 1.2, len(dates)),
            'high': np.random.uniform(1.1, 1.3, len(dates)),
            'low': np.random.uniform(0.9, 1.1, len(dates)),
            'close': np.random.uniform(1.0, 1.2, len(dates)),
            'volume': np.random.randint(1000, 10000, len(dates))
        }, index=dates)
        
        # Run walk-forward analysis
        analyzer = WalkForwardAnalyzer(
            data, 
            train_period_days=train_period_days,
            test_period_days=test_period_days,
            step_days=step_days
        )
        
        # Define a sample strategy function
        def sample_strategy(train_data, **params):
            return {"strategy_type": "sample", "params": params}
        
        results = analyzer.run_walk_forward(sample_strategy)
        
        return {"success": True, "results": results}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/ollama-chat")
async def ollama_chat(request: dict):
    """Chat with Ollama LLM"""
    try:
        message = request.get("message", "")
        if not message:
            return {"success": False, "error": "No message provided"}
        
        # Use your existing chatbot service
        response = chatbot_service.ask(message)
        
        return {
            "success": True, 
            "reply": response,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/ollama-update-context")
async def update_ollama_context(backtest_results: dict):
    """Update Ollama context with latest backtest results"""
    try:
        chatbot_service.update_context(backtest_results)
        return {"success": True, "message": "Context updated successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/economic-calendar")
async def get_economic_calendar(
    start_date: str = Query(None),
    end_date: str = Query(None),
    currency: str = Query(None),
    impact: str = Query(None)
):
    return {"success": True, "events": []}

@router.get("/portfolio-history")
async def get_portfolio_history():
    """Get real-time portfolio performance history"""
    try:
        # Get current forex signals to calculate portfolio performance
        signals = signal_generator.generate_all_signals()
        
        # Calculate portfolio performance based on signals
        initial_capital = 10000
        current_value = initial_capital
        trades = []
        
        # Simulate portfolio performance based on signals
        for signal in signals:
            if signal and signal.get('direction') in ['buy', 'sell']:
                # Calculate trade performance
                entry_price = signal.get('entry_price', 0)
                current_price = entry_price * (1 + (signal.get('strength', 0.5) - 0.5) * 0.02)
                pnl = (current_price - entry_price) / entry_price * signal.get('position_size', 100)
                
                current_value += pnl
                trades.append({
                    'pair': signal.get('pair'),
                    'direction': signal.get('direction'),
                    'entry_price': entry_price,
                    'current_price': current_price,
                    'pnl': pnl,
                    'timestamp': signal.get('timestamp')
                })
        
        # Generate historical data points
        history = []
        base_value = initial_capital
        for i in range(30, -1, -1):
            date = datetime.now() - timedelta(days=i)
            # Add some volatility based on recent signals
            daily_return = 0.001  # Base daily return
            if trades:
                recent_trades = [t for t in trades if (datetime.now() - datetime.fromisoformat(t['timestamp'])).days <= i]
                if recent_trades:
                    daily_return += sum(t['pnl'] for t in recent_trades) / len(recent_trades) / base_value
            
            base_value *= (1 + daily_return)
            history.append({
                'date': date.strftime('%Y-%m-%d'),
                'value': round(base_value, 2),
                'change': daily_return * 100
            })
        
        total_return = (current_value - initial_capital) / initial_capital
        
        return {
            'success': True,
            'data': {
                'current_value': round(current_value, 2),
                'initial_capital': initial_capital,
                'total_return': round(total_return, 4),
                'total_pnl': round(current_value - initial_capital, 2),
                'history': history,
                'recent_trades': trades[-5:] if trades else [],  # Last 5 trades
                'total_trades': len(trades)
            }
        }
        
    except Exception as e:
        print(f"Error getting portfolio history: {e}")
        return {
            'success': False,
            'error': str(e),
            'data': None
        }

@router.get("/real-time-signals")
async def get_real_time_signals():
    """Get real-time trading signals and trigger alerts"""
    try:
        # Generate signals for all pairs
        signals = signal_generator.generate_all_signals()
        
        # Filter for actionable signals (not 'hold')
        actionable_signals = [s for s in signals if s and s.get('direction') != 'hold']
        
        # Broadcast alerts for new signals
        for signal in actionable_signals:
            await broadcast_alert(
                'signal',
                f"New {signal.get('pair')} {signal.get('direction')} signal",
                signal
            )
        
        return {
            'success': True,
            'signals': actionable_signals,
            'timestamp': datetime.now().isoformat(),
            'total_signals': len(actionable_signals)
        }
        
    except Exception as e:
        print(f"Error generating real-time signals: {e}")
        return {
            'success': False,
            'error': str(e),
            'signals': []
        }

@router.get("/historical-signals")
async def get_historical_signals(limit: int = 100):
    """Get historical signals for frontend display"""
    try:
        signals = []
        with open("signal_log.jsonl", "r") as f:
            for line in f:
                signals.append(json.loads(line))
        
        # Return most recent signals
        return {
            'success': True,
            'signals': signals[-limit:],
            'total_count': len(signals)
        }
    except FileNotFoundError:
        return {
            'success': False,
            'error': 'No signal log found',
            'signals': []
        }

@router.get("/performance-metrics")
async def get_performance_metrics():
    """Get calculated performance metrics"""
    try:
        # Import and run performance analysis
        from .performance_analysis import load_signals, simulate_trades, calculate_performance_metrics
        
        signals = load_signals()
        trades, final_capital = simulate_trades(signals)
        metrics = calculate_performance_metrics(trades)
        
        return {
            'success': True,
            'metrics': metrics,
            'final_capital': final_capital
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def combine_signals(ml_signal, tech_signal):
    # Example: If both agree, boost confidence; if not, lower it
    if ml_signal['signal'] == tech_signal['direction']:
        final_signal = ml_signal['signal']
        confidence = (ml_signal['confidence'] + tech_signal['confidence']) / 2 + 0.1
    else:
        final_signal = 'hold'
        confidence = min(ml_signal['confidence'], tech_signal['confidence']) / 2
    return {"signal": final_signal, "confidence": confidence}

# Include the router in the main FastAPI app
app.include_router(router, prefix="/api")

def start_realtime_monitor():
    """Start the real-time monitor in a separate thread"""
    def run_monitor():
        try:
            print(" Starting real-time monitor thread...")
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            from .realtime_monitor import real_time_monitor
            print("✅ Real-time monitor imported successfully")
            loop.run_until_complete(real_time_monitor())
        except Exception as e:
            print(f"❌ Error in real-time monitor: {e}")
            import traceback
            traceback.print_exc()
    
    print(" Creating real-time monitor thread...")
    monitor_thread = threading.Thread(target=run_monitor, daemon=True)
    monitor_thread.start()
    print("✅ Real-time monitor thread started")

# Add this line to actually start the monitor
start_realtime_monitor()

@router.get("/test-intraday")
async def test_intraday_data():
    """Test intraday data fetching"""
    try:
        df = data_handler.fetch_intraday_data("EURUSD=X", interval="1m", period="1d")
        if df is not None and not df.empty:
            return {
                "success": True,
                "data_shape": df.shape,
                "columns": list(df.columns),
                "last_row": df.iloc[-1].to_dict()
            }
        else:
            return {"success": False, "error": "No data returned"}
    except Exception as e:
        return {"success": False, "error": str(e)}