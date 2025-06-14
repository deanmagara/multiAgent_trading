from fastapi import FastAPI, Request
from pydantic import BaseModel
from .agents import run_agent
from .env import make_env

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