import React from 'react';
import { useTradingContext } from '../context/tradingContext';
import { Paper, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';

const SIGNAL_MAP = {
  0: { label: "Hold", color: "default" },
  1: { label: "Buy", color: "success" },
  2: { label: "Sell", color: "error" }
};

const ForexSignals: React.FC = () => {
  const { latestResults } = useTradingContext();

  if (!latestResults || !latestResults.signals) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Forex Signals</Typography>
        <Typography>No signals available. Run an analysis.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Forex Signals</Typography>
      <List>
        {Object.entries(latestResults.signals).map(([agent, signal]) => (
          <ListItem key={agent}>
            <ListItemText primary={agent} />
            <Chip
              label={SIGNAL_MAP[signal as 0 | 1 | 2]?.label || "Unknown"}
              color={SIGNAL_MAP[signal as 0 | 1 | 2]?.color as any}
              variant="outlined"
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ForexSignals;
