import React from 'react';
import { useChatbot } from '../hooks/useChatbot';
import { ChatWindow } from '../components';
import { Box } from '@mui/material';

export function TradingChatPage() {
  const { messages, sendMessage, isLoading } = useChatbot();

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)' /* Adjust height as needed */ }}>
      {/* <h2>Trading Assistant</h2> */}
      <ChatWindow
        messages={messages}
        onSend={sendMessage}
        isLoading={isLoading}
      />
    </Box>
  );
}