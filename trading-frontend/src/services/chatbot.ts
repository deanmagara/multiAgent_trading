import { useState } from 'react';

// Export Message interface
export interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export const useChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const askChatbot = async (query: string): Promise<string> => {
    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Chatbot error:', error);
      return "Sorry, I encountered an error.";
    }
  };

  const handleSend = async (message: string) => {
    const userMessage: Message = { text: message, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    const botResponse = await askChatbot(message);
    const botMessage: Message = { text: botResponse, sender: 'bot' };
    setMessages(prev => [...prev, botMessage]);
  };

  return { messages, handleSend };
};

// Create a separate component file for ChatWindow