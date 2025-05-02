from stable_baselines3 import PPO
from stable_baselines3.common.env_checker import check_env
from trading import TradingEnv
from dataFetcher import DataFetcher

def trainAgent():
    # Get data
    fetcher = DataFetcher()
    data = fetcher.fetchData("AAPL")
    
    # Create environment
    env = TradingEnv(data)
    check_env(env)  # Validate environment
    
    # Initialize agent
    model = PPO(
        "MlpPolicy",
        env,
        verbose=1,
        tensorboard_log="./tensorboard_logs/"
    )
    
    # Train agent
    model.learn(total_timesteps=100000)
    
    # Save model
    model.save("trading_agent")
    return model