import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { askChatbot } from '../services/api';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const useChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
        { 
            role: 'system', 
            content: 'Hello! After running an agent analysis, you can ask me questions like "Which agent performed best?" or "What are the capital allocations?"' 
        }
  ]);

    const mutation = useMutation({
        mutationFn: askChatbot,
        onSuccess: (data) => {
            // Add the assistant's response to the chat
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        },
        onError: (error) => {
            console.error('Chatbot API error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I was unable to get a response. Please try again.' }]);
        },
    });

    const sendMessage = (messageContent: string) => {
        if (!messageContent.trim() || mutation.isPending) return;

        const newUserMessage: Message = { role: 'user', content: messageContent };
        setMessages(prev => [...prev, newUserMessage]);
        
        mutation.mutate(messageContent);
  };

    return {
        messages,
        sendMessage,
        isLoading: mutation.isPending,
    };
};