import { useState } from 'react';

type Message = { text: string; sender: 'bot' | 'user' };

export function useChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { text: 'Welcome! How can I help?', sender: 'bot' }
  ]);
  const handleSend = (msg: string) => {
    setMessages((prev) => [...prev, { text: msg, sender: 'user' }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { text: "I'm a bot!", sender: 'bot' }]);
    }, 500);
  };
  return { messages, handleSend };
}