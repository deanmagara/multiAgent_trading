from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, APIRouter, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

from .agents import run_agent, multi_agent_coordination
from .env import make_env
from .backtest import run_backtest
import yfinance as yf
from .ollama_service import chatbot_service
from .data import data_handler
from .news_service import news_service

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

@router.get("/")
def index():
    return {"message": "RL Agent API is running!"}

@router.post("/run-agent")
async def run_rl_agent(req: AgentRequest):
    env = make_env()
    rewards = run_agent(req.agent_type, env, timesteps=5000)
    return {"rewards": rewards}

class MultiAgentRequest(BaseModel):
    agent_types: list[str]
    pair: str

@router.post("/multi-agent")
async def run_multi_agent(req: MultiAgentRequest):
    def env_fn():
        return make_env(pair=req.pair) if req.pair else make_env()
    results = multi_agent_coordination(req.agent_types, env_fn, timesteps=5000)
    # Add news sentiment
    if req.pair:
        try:
            news_data = news_service.get_news_factor(req.pair)
            results["news_sentiment"] = news_data
        except Exception as e:
            results["news_sentiment"] = {"error": str(e)}
    chatbot_service.update_context(results)
    await manager.broadcast(results)
    return results


'''for API integration with backtesting and RL agents''' 
class BacktestRequest(BaseModel):
    symbol: str = None
    pair: str = None
    period: str = "1y"
    interval: str = "1d"

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

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_ollama(req: ChatRequest):
    response = chatbot_service.ask(req.message)
    return {"response": response}

# 3. Add a placeholder for the market-data endpoint
@router.get("/market-data")
async def get_market_data(symbol: str = "AAPL"):
    df = data_handler.fetch_data(symbol=symbol, period="1d", interval="1m")
    if df is not None and not df.empty:
        return df.to_dict(orient="records")
    return []

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

# 4. Include the router in the main FastAPI app
app.include_router(router)