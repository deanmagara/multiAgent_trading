from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

from .agents import run_agent, multi_agent_coordination
from .env import make_env
from .backtest import run_backtest
import yfinance as yf
from .ollama_service import chatbot_service
from .data import data_handler

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

@router.post("/multi-agent")
async def run_multi_agent(req: MultiAgentRequest):
    results = multi_agent_coordination(req.agent_types, make_env, timesteps=5000)
    chatbot_service.update_context(results)
    await manager.broadcast(results)
    return results


'''for API integration with backtesting and RL agents''' 
class BacktestRequest(BaseModel):
    symbol: str = "AAPL"
    period: str = "1y"
    interval: str = "1d"

@router.post("/backtest")
async def backtest(req: BacktestRequest):
    from .agents import train_agent
    env = make_env(symbol=req.symbol, period=req.period, interval=req.interval)
    df = env.df
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

# 4. Include the router in the main FastAPI app
app.include_router(router)