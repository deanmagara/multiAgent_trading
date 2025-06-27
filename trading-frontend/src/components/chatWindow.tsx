import React, { useState } from 'react';
import { Message } from '../hooks/useChatbot';

interface ChatWindowProps {
  messages?: Message[];
  onSend?: (message: string) => void;
  isLoading?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages = [], 
  onSend = () => {}, 
  isLoading = false 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Trading Assistant</h3>
      <div className="h-64 overflow-y-auto mb-4 border rounded p-2">
        {messages.map((message) => (
          <div key={message.id} className={`mb-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded ${
              message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left">
            <div className="inline-block p-2 rounded bg-gray-200">
              Thinking...
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about trading..."
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;