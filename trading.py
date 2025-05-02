import gym
from gym import spaces
import numpy as np

class TradingEnv(gym.Env):
    def __init__(self, df, initialBalance=10000):
        self.df = df
        self.currentStep = 0
        self.initialBalance = initialBalance
        self.balance = initialBalance
        self.positions = []
        self.maxSteps = len(df) - 1
        
        # Action space: -1 (sell), 0 (hold), 1 (buy)
        self.actionSpace = spaces.Discrete(3)
        
        # Observation space: market data features
        self.observationSpace = spaces.Box(
            low=-np.inf, high=np.inf, 
            shape=(len(df.columns) + 2,),  # Market data + portfolio info
            dtype=np.float32
        )
    
    def reset(self):
        self.currentStep = 0
        self.balance = self.initialBalance
        self.positions = []
        return self.nextObservation()
    
    def nextObservation(self):
        obs = self.df.iloc[self.currentStep].values
        # Append portfolio info to observation
        obs = np.append(obs, [self.balance, len(self.positions)])
        return obs
    
    def step(self, action):
        currentPrice = self.df.iloc[self.current_step]['Close']
        
        # Execute trade
        if action == 1:  # Buy
            self.positions.append(currentPrice)
            self.balance -= currentPrice
        elif action == 0 and self.positions:  # Sell
            boughtPrice = self.positions.pop(0)
            self.balance += currentPrice
            reward = currentPrice - boughtPrice
        else:  # Hold
            reward = 0
        
        # Update step
        self.currentStep += 1
        done = self.currentStep >= self.maxSteps
        
        # Calculate portfolio value
        portfolioValue = self.balance + sum(self.positions) * currentPrice
        
        return self.nextObservation(), reward, done, {'portfolioValue': portfolioValue}