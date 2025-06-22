import pandas as pd
import numpy as np

class DynamicCapitalAllocator:
    def __init__(self, df: pd.DataFrame, window: int = 21):
        """
        Initializes the allocator with historical market data.

        :param df: The dataframe with market data, must include 'Close'.
        :param window: The rolling window for calculating indicators (e.g., 21 trading days).
        """
        self.df = df.copy()
        self.window = window
        self._prepare_indicators()

    def _prepare_indicators(self):
        """Pre-calculates market indicators like volatility and momentum."""
        returns = self.df['Close'].pct_change()
        self.df['volatility'] = returns.rolling(window=self.window).std()
        self.df['momentum'] = self.df['Close'].pct_change(periods=self.window)
        self.df = self.df.fillna(0)

    def get_allocation(self, current_step: int, agent_performances: dict) -> dict:
        """
        Determines capital allocation based on market conditions and agent performance.

        :param current_step: The current time step (index) in the dataframe.
        :param agent_performances: A dictionary mapping agent_type to its performance score 
                                   (e.g., final portfolio value from a backtest).
        :return: A dictionary of agent types to capital allocation ratios (0.0 to 1.0).
        """
        market_volatility = self.df['volatility'].iloc[current_step]
        
        base_allocations = self._get_performance_allocations(agent_performances)

        # Example modification logic:
        # Higher volatility pushes allocations towards a more equal, diversified split.
        # Lower volatility trusts the performance-based allocation more.
        # This volatility factor is a value between 0 (low vol) and 1 (high vol).
        volatility_factor = np.clip(market_volatility * 50, 0, 1)

        final_allocations = {}
        num_agents = len(agent_performances)
        for agent, base_alloc in base_allocations.items():
            equal_weight = 1 / num_agents
            # Blend performance-based allocation with an equal weight allocation.
            final_allocations[agent] = (volatility_factor * equal_weight) + ((1 - volatility_factor) * base_alloc)

        return self._normalize_allocations(final_allocations)

    def _get_performance_allocations(self, agent_performances: dict) -> dict:
        # Start by giving positive weights even to underperforming agents
        min_perf = min(agent_performances.values())
        # Shift all performances to be non-negative
        shifted_performances = {agent: perf - min_perf + 1 for agent, perf in agent_performances.items()}

        total_performance = sum(shifted_performances.values())
        if total_performance == 0:
            return {agent: 1 / len(agent_performances) for agent in agent_performances}
        
        return {agent: perf / total_performance for agent, perf in shifted_performances.items()}

    def _normalize_allocations(self, allocations: dict) -> dict:
        total_allocation = sum(allocations.values())
        if total_allocation > 0:
            return {agent: alloc / total_allocation for agent, alloc in allocations.items()}
        return allocations
