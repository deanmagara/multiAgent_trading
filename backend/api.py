from fastapi import FastAPI, Request
from pydantic import BaseModel
from .agents import run_agent
from .env import make_env
from .backtest import run_backtest
import yfinance as yf
import ollama

app = FastAPI()

class AgentRequest(BaseModel):
    agent_type: str

@app.post("/run-agent")
async def run_rl_agent(req: AgentRequest):
    env = make_env()
    rewards = run_agent(req.agent_type, env)
    return {"rewards": rewards}

@app.get("/")
def index():
    return {"message": "RL Agent API is running!"}

@app.post("/run-agent")
async def run_rl_agent(req: AgentRequest):
    env = make_env()
    rewards = run_agent(req.agent_type, env, timesteps=5000)
    return {"rewards": rewards}

class MultiAgentRequest(BaseModel):
    agent_types: list[str]

@app.post("/multi-agent")
async def run_multi_agent(req: MultiAgentRequest):
    from .agents import multi_agent_coordination
    results = multi_agent_coordination(req.agent_types, make_env, timesteps=5000)
    return results


'''for API integration with backtesting and RL agents''' 
class BacktestRequest(BaseModel):
    symbol: str = "AAPL"
    period: str = "1y"
    interval: str = "1d"

@app.post("/backtest")
async def backtest(req: BacktestRequest):
    df = yf.download(req.symbol, period=req.period, interval=req.interval)
    final_value = run_backtest(df)
    return {"final_portfolio_value": final_value}

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_with_ollama(req: ChatRequest):
    # You can specify a model, e.g., "llama2", "mistral", etc.
    response = ollama.chat(model="llama2", messages=[{"role": "user", "content": req.message}])
    # The response is a dict with a 'message' key containing the reply
    return {"response": response['message']['content']}