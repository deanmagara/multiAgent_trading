import { useState } from 'react';
import { Box, TextField, Button, List, ListItem, ListItemText } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

// Define Message interface locally
interface Message {
  text: string;
  sender: 'user' | 'bot';
}

interface ChatWindowProps {
  messages: Message[];
  onSend: (message: string) => void;
}

export function ChatWindow({ messages, onSend }: ChatWindowProps) {
  const [input, setInput] = useState('');

  const boxStyles: SxProps<Theme> = {
    display: 'flex',
    flexDirection: 'column',
    padding: 2,
    border: '1px solid #ccc',
    borderRadius: 1,
    maxHeight: '400px',
    overflowY: 'auto',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  // Simplify sx props with concrete values
  return (
    <Box sx={{boxStyles}}>
      <List>
        {messages.map((msg, i) => (
          <ListItem key={i}>
            <ListItemText 
              primary={msg.text} 
              secondary={msg.sender} 
            />
          </ListItem>
        ))}
      </List>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about trades..."
        />
        <Button type="submit" variant="contained">
          Send
        </Button>
      </form>
    </Box>
  );
}