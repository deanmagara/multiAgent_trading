import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { runMultiAgent } from '../services/api';
import { Button, Checkbox, FormControlLabel, FormGroup, CircularProgress, Box, Typography, Paper } from '@mui/material';

const AGENT_OPTIONS = ['PPO', 'DQN', 'A2C'];

const MultiAgentControls: React.FC = () => {
    const [selectedAgents, setSelectedAgents] = useState<string[]>(['PPO', 'A2C']);

    const mutation = useMutation({
        mutationFn: ({ agent_types, pair }: { agent_types: string[], pair: string }) => 
            runMultiAgent({agent_types, pair}),
        onSuccess: (data) => {
            console.log('Multi-agent analysis successfully triggered. Results will be broadcast via WebSocket.', data);
            // We don't need to handle the results here.
            // The WebSocket connection will receive the data and update other components.
        },
        onError: (error) => {
            console.error('Error running multi-agent analysis:', error);
            // TODO: Add user-facing error notification (e.g., a snackbar)
        },
    });

    const handleAgentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setSelectedAgents(prev =>
            checked ? [...prev, name] : prev.filter(agent => agent !== name)
        );
  };

    const handleRunAnalysis = () => {
        if (selectedAgents.length > 0) {
            mutation.mutate({ agent_types: selectedAgents, pair: 'BTC-USD' });
        }
    };

  return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Agent Analysis
            </Typography>
            <FormGroup>
                {AGENT_OPTIONS.map(agent => (
                    <FormControlLabel
                        key={agent}
                        control={
                            <Checkbox
                                checked={selectedAgents.includes(agent)}
                                onChange={handleAgentChange}
                                name={agent}
                                disabled={mutation.isPending}
                            />
                        }
                        label={agent}
                    />
        ))}
            </FormGroup>
            <Button
                variant="contained"
                color="primary"
                onClick={handleRunAnalysis}
                disabled={mutation.isPending || selectedAgents.length === 0}
                sx={{ mt: 2, width: '100%' }}
            >
                {mutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Run Analysis'}
            </Button>
        </Paper>
    );
};

export default MultiAgentControls;