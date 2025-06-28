import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { Clear, Send } from '@mui/icons-material';
import { useOllama } from '../hooks/useOllama';

const ChatWindow: React.FC = () => {
  const [input, setInput] = useState('');
  const { messages, loading, error, sendMessage, clearMessages } = useOllama();

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
      <CardHeader 
        title="Ollama LLM Chat" 
        action={
          <IconButton onClick={clearMessages} size="small">
            <Clear />
          </IconButton>
        }
      />
      
      <CardContent sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <List>
          {messages.map((msg) => (
            <ListItem key={msg.id} sx={{ 
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 1
            }}>
              <Box sx={{
                maxWidth: '70%',
                backgroundColor: msg.sender === 'user' ? 'primary.main' : 'grey.100',
                color: msg.sender === 'user' ? 'white' : 'text.primary',
                borderRadius: 2,
                p: 1.5,
                wordBreak: 'break-word'
              }}>
                <Typography variant="body2">
                  {msg.text}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
        
        {loading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress size={24} />
          </Box>
        )}
      </CardContent>
      
      <Box sx={{ display: 'flex', p: 2, pt: 0 }}>
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about trading strategies, backtest results, or market analysis..."
          disabled={loading}
          multiline
          maxRows={3}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          sx={{ ml: 2 }}
          endIcon={<Send />}
        >
          Send
        </Button>
      </Box>
    </Card>
  );
};

export default ChatWindow; 