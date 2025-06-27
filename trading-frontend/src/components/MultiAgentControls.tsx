import React, { useState } from 'react';
import { Button, Checkbox, FormControlLabel, FormGroup, CircularProgress, Box, Typography, Paper } from '@mui/material';

const MultiAgentControls: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState({
    technical: true,
    sentiment: true,
    fundamental: false
  });

  const handleRunMultiAgent = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Multi-Agent Controls
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedAgents.technical}
              onChange={(e) => setSelectedAgents(prev => ({ ...prev, technical: e.target.checked }))}
            />
          }
          label="Technical Agent"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedAgents.sentiment}
              onChange={(e) => setSelectedAgents(prev => ({ ...prev, sentiment: e.target.checked }))}
            />
          }
          label="Sentiment Agent"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedAgents.fundamental}
              onChange={(e) => setSelectedAgents(prev => ({ ...prev, fundamental: e.target.checked }))}
            />
          }
          label="Fundamental Agent"
        />
      </FormGroup>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRunMultiAgent}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Running...' : 'Run Multi-Agent Analysis'}
        </Button>
      </Box>
    </Paper>
  );
};

export default MultiAgentControls;