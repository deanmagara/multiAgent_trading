from stable_baselines3 import PPO, DQN, A2C
from .backtest import run_backtest
from .capital_allocator import DynamicCapitalAllocator

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
            obs = df.iloc[-1].values.astype("float32")
            last_signal, _ = model.predict(obs, deterministic=True)
        
        performances[agent_type] = final_value
        results[agent_type] = {
            "final_portfolio_value": final_value,
            "last_signal": int(last_signal) if last_signal is not None else None
        }
        signals[agent_type] = int(last_signal) if last_signal is not None else None
        
    allocator = DynamicCapitalAllocator(df=df)
    last_step = len(df) - 1
    
    allocations = allocator.get_allocation(
        current_step=last_step, 
        agent_performances=performances
    )
    
    results["allocations"] = allocations
    results["signals"] = signals
    return results