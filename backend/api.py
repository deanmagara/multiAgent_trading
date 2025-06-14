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