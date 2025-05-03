# ollama_service.py
import ollama

class TradingChatbot:
    def __init__(self):
        self.system_prompt = """
        You are a trading assistant with access to:
        - Backtest results
        - Live market data
        - Agent performance metrics
        
        Respond with JSON containing:
        {
            "response": "human-readable answer",
            "actions": ["adjust_risk", "run_backtest", ...]
        }
        """
    
    def query(self, user_input):
        response = ollama.chat(
            model='mistral:7b-instruct',
            messages=[{
                'role': 'system',
                'content': self.system_prompt
            }, {
                'role': 'user',
                'content': user_input
            }]
        )
        return response['message']['content']
    
    # Add to TradingChatbot class
    def get_backtest_results(self):
        """Fetch latest backtest data from Backtrader"""
        return db.query("SELECT * FROM backtest_results ORDER BY date DESC LIMIT 1")

    def get_agent_performance(self):
        """Get RL agent metrics"""
        return {
            'sharpe': calculate_sharpe(),
            'drawdown': get_max_drawdown()
        }