import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../hooks/useChatbot';
import { Box, TextField, Button, Paper, Typography, List, ListItem, ListItemText, CircularProgress, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

interface ChatWindowProps {
  messages: Message[];
  onSend: (message: string) => void;
    isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSend, isLoading }) => {
  const [input, setInput] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

    const getAvatar = (msg: Message) => (
        <Avatar sx={{ bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main', mr: 2 }}>
            {msg.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
        </Avatar>
    );

  return (
        <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
                Performance Chatbot
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
      <List>
                    {messages.map((msg, index) => (
                        <ListItem key={index} sx={{ py: 1, alignItems: 'flex-start' }}>
                            {getAvatar(msg)}
            <ListItemText 
                                primary={msg.role === 'system' ? 'System' : msg.role === 'user' ? 'You' : 'Assistant'}
                                secondary={
                                    <Typography component="p" variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {msg.content}
                                    </Typography>
                                }
                                primaryTypographyProps={{ fontWeight: 'bold' }}
            />
          </ListItem>
        ))}
                    {isLoading && (
                         <ListItem sx={{ py: 1, alignItems: 'flex-start' }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}><SmartToyIcon /></Avatar>
                            <ListItemText primary="Assistant" primaryTypographyProps={{ fontWeight: 'bold' }} secondary={<CircularProgress size={20} />} />
                        </ListItem>
                    )}
                    <div ref={messagesEndRef} />
      </List>
            </Box>
            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', flexShrink: 0 }}>
        <TextField
          fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Ask about the analysis..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
        />
                <Button type="submit" variant="contained" color="primary" sx={{ ml: 1 }} disabled={isLoading || !input.trim()}>
                    <SendIcon />
        </Button>
    </Box>
        </Paper>
  );
};

export default ChatWindow;