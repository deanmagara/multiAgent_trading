import { useState, useCallback } from 'react';
import { ollamaService, ChatResponse } from '../services/ollama';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const useOllama = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await ollamaService.sendMessage(message);
      
      if (response.success && response.reply) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: response.reply,
          timestamp: response.timestamp || new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        setError(response.error || 'Failed to get response');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const updateContext = useCallback(async (backtestResults: any) => {
    try {
      const response = await ollamaService.updateContext(backtestResults);
      if (!response.success) {
        setError('Failed to update context');
      }
    } catch (err) {
      setError('Failed to update context');
    }
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    updateContext
  };
}; 