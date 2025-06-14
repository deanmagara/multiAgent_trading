import gymnasium as gym
import numpy as np
import pandas as pd

class TradingEnv(gym.Env):
    def __init__(self, df: pd.DataFrame):
        super().__init__()
        self.df = df.reset_index(drop=True)
        self.current_step = 0
        self.action_space = gym.spaces.Discrete(3)  # 0: hold, 1: buy, 2: sell
        self.observation_space = gym.spaces.Box(
            low=-np.inf, high=np.inf, shape=(self.df.shape[1],), dtype=np.float32
        )
        self.position = 0  # 1: long, -1: short, 0: flat
        self.cash = 10000
        self.shares = 0

    def reset(self, seed=None, options=None):
        self.current_step = 0
        self.position = 0
        self.cash = 10000
        self.shares = 0
        obs = self.df.iloc[self.current_step].values.astype(np.float32)
        return obs, {}

    def step(self, action):
        self.current_step += 1
        done = self.current_step >= len(self.df) - 1
        reward = 0

        price = self.df.iloc[self.current_step]['Close']

        # Simple reward logic: profit/loss from action
        if action == 1:  # buy
            if self.position == 0:
                self.position = 1
                self.entry_price = price
        elif action == 2:  # sell
            if self.position == 1:
                reward = price - self.entry_price
                self.position = 0

        obs = self.df.iloc[self.current_step].values.astype(np.float32)
        return obs, reward, done, False, {}

    def render(self):
        pass  # Optional: implement visualization