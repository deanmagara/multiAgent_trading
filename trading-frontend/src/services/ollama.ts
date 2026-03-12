const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  message: string;
}

export interface ChatResponse {
  success: boolean;
  reply?: string;
  error?: string;
  timestamp?: string;
}

export const ollamaService = {
  // Send a message to Ollama
  sendMessage: async (message: string): Promise<ChatResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ollama-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to connect to Ollama service'
      };
    }
  },

  // Update context with backtest results
  updateContext: async (backtestResults: any): Promise<ChatResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ollama-update-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backtestResults),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update context'
      };
    }
  }
}; 