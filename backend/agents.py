from stable_baselines3 import PPO, DQN, A2C
from .backtest import run_backtest
from .capital_allocator import CapitalAllocator
from .signal_analyzer import SignalAnalyzer, EnhancedTradingAgent, TechnicalAgent
import numpy as np
from typing import Dict, List, Optional
import logging

def train_agent(agent_type, env, **kwargs):
    # Separate the 'timesteps' argument from other model-specific hyperparameters.
    # The 'timesteps' argument is for model.learn(), not the constructor.
    timesteps_to_learn = kwargs.pop('timesteps', 10000)

    if agent_type == "PPO":
        model = PPO("MlpPolicy", env, **kwargs)
    elif agent_type == "DQN":
        model = DQN("MlpPolicy", env, **kwargs)
    elif agent_type == "A2C":
        model = A2C("MlpPolicy", env, **kwargs)
    else:
        raise ValueError("Unknown agent type")
    model.learn(total_timesteps=timesteps_to_learn)
    return model

def run_agent(agent_type, env, **kwargs):
    model = train_agent(agent_type, env, **kwargs)
    obs, _ = env.reset()
    done = False
    rewards = []
    while not done:
        action, _ = model.predict(obs)
        obs, reward, terminated, truncated, info = env.step(action)
        done = terminated or truncated
        rewards.append(reward)
    return rewards

def multi_agent_coordination(agent_types, env_fn, **kwargs):
    results = {}
    performances = {}
    signals = {}
    
    base_env = env_fn()
    df = base_env.df.copy()

    for agent_type in agent_types:
        train_env = env_fn()
        model = train_agent(agent_type, train_env, **kwargs)
        
        final_value = run_backtest(df, model)
        
        # Get the last action as the latest signal
        last_signal = None
        if hasattr(model, "predict"):
            # Create observation in the same format as the training environment
            last_row = df.iloc[-1]
            obs = np.array([
                last_row['Open'],
                last_row['High'], 
                last_row['Low'],
                last_row['Close'],
                last_row['Volume']
            ], dtype=np.float32)
            
            # Add news sentiment features (default to 0.0)
            news_features = np.array([0.0, 0.0], dtype=np.float32)
            full_obs = np.concatenate([obs, news_features])
            
            last_signal, _ = model.predict(full_obs, deterministic=True)
        
        performances[agent_type] = final_value
        results[agent_type] = {
            "final_portfolio_value": final_value,
            "last_signal": int(last_signal) if last_signal is not None else None
        }
        signals[agent_type] = int(last_signal) if last_signal is not None else None
    
    # Create a simple allocation based on performance
    total_performance = sum(performances.values())
    allocations = {}
    
    if total_performance > 0:
        for agent_type, performance in performances.items():
            allocations[agent_type] = performance / total_performance
    else:
        # Equal allocation if no performance data
        equal_share = 1.0 / len(agent_types)
        for agent_type in agent_types:
            allocations[agent_type] = equal_share
    
    results["allocations"] = allocations
    results["signals"] = signals
    return results