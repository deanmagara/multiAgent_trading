import ollama

class ChatbotService:
    def __init__(self):
        self.context_data = {}
        self.system_prompt = """
You are a helpful financial assistant for a multi-agent trading system. 
Your role is to answer user questions based *only* on the provided context. 
If the information to answer the question is not in the context, state that you do not have that information.
Do not make up numbers or performance metrics.
"""

    def update_context(self, backtest_results: dict):
        """
        Updates the chatbot's context with the latest backtest results.
        
        :param backtest_results: The results dictionary from multi_agent_coordination.
        """
        self.context_data = backtest_results

    def _format_context(self) -> str:
        """Formats the results dictionary into a readable string for the LLM."""
        if not self.context_data:
            return "No backtest has been run yet."

        results_copy = self.context_data.copy()
        allocations = results_copy.pop("allocations", {})
        
        context_str = "Here is the summary of the latest multi-agent backtest:\n\n"
        
        context_str += "Agent Performance (Final Portfolio Value):\n"
        for agent, data in results_copy.items():
            value = data.get("final_portfolio_value", "N/A")
            context_str += f"- {agent}: ${value:,.2f}\n"
        
        context_str += "\nRecommended Capital Allocations (based on performance and market conditions):\n"
        if allocations:
            for agent, alloc in allocations.items():
                context_str += f"- {agent}: {alloc:.2%}\n"
        else:
            context_str += "No allocation data available.\n"
            
        return context_str

    def ask(self, question: str) -> str:
        """
        Asks a question to the LLM with the stored context.
        """
        if not self.context_data:
            return "Please run a multi-agent analysis first to provide context for the chatbot."

        formatted_context = self._format_context()
        full_user_prompt = f"--- CONTEXT ---\n{formatted_context}\n--- END CONTEXT ---\n\nUser Question: {question}"

        try:
            response = ollama.chat(
                model="llama2",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": full_user_prompt}
                ]
            )
            return response['message']['content']
        except Exception as e:
            return f"An error occurred while communicating with the chatbot service: {e}"

chatbot_service = ChatbotService()
