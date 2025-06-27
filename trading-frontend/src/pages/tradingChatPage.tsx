import React from 'react';
import { ChatWindow } from '../components';
import { useChatbot } from '../hooks/useChatbot';

const TradingChatPage: React.FC = () => {
  const { messages, sendMessage, isLoading } = useChatbot();

  return (
    <div className="trading-chat-page">
      {/* <h2>Trading Assistant</h2> */}
      <ChatWindow
        messages={messages}
        onSend={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};

export default TradingChatPage;