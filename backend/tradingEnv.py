import gymnasium as gym
import numpy as np

class TradingEnv(gym.Env):
    def __init__(self, df):
        super().__init__()
        self.df = df.reset_index(drop=True)
        # Define the columns for the observation space
        self.obs_cols = ['Open', 'High', 'Low', 'Close', 'Volume']
        self.obs_df = self.df[self.obs_cols]
        
        self.current_step = 0
        self.action_space = gym.spaces.Discrete(3)  # hold, buy, sell
        self.observation_space = gym.spaces.Box(low=-np.inf, high=np.inf, shape=(len(self.obs_cols),), dtype=np.float32)
        self.initial_cash = 10000
        self.cash = self.initial_cash
        self.shares = 0
        self.position = 0
        self.last_portfolio_value = self.initial_cash
        self.max_portfolio_value = self.initial_cash
        self.transaction_cost = 0.001  # 0.1% per trade

    def reset(self, seed=None, options=None):
        self.current_step = 0
        self.cash = self.initial_cash
        self.shares = 0
        self.position = 0
        self.last_portfolio_value = self.initial_cash
        self.max_portfolio_value = self.initial_cash
        obs = self.obs_df.iloc[self.current_step].values.astype(np.float32)
        return obs, {}

    def step(self, action):
        self.current_step += 1
        done = self.current_step >= len(self.df) - 1
        price = self.df.iloc[self.current_step]['Close']

        # Transaction logic
        reward = 0
        cost = 0
        if action == 1 and self.position == 0:  # Buy
            self.shares = self.cash // price
            cost = self.shares * price * self.transaction_cost
            self.cash -= self.shares * price + cost
            self.position = 1
        elif action == 2 and self.position == 1:  # Sell
            self.cash += self.shares * price - (self.shares * price * self.transaction_cost)
            self.shares = 0
            self.position = 0

        portfolio_value = self.cash + self.shares * price
        profit = portfolio_value - self.last_portfolio_value
        self.max_portfolio_value = max(self.max_portfolio_value, portfolio_value)
        drawdown = (self.max_portfolio_value - portfolio_value) / self.max_portfolio_value

        # Reward: profit minus transaction cost minus drawdown penalty
        reward = profit - cost - (drawdown * 0.1)
        self.last_portfolio_value = portfolio_value

        obs = self.obs_df.iloc[self.current_step].values.astype(np.float32)
        return obs, reward, done, False, {}

    def render(self):
        pass