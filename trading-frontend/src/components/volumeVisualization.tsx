import React from 'react';
import { Paper, Typography } from '@mui/material';

export function VolumeVisualization({ data }: { data: { date: string; volume: number }[] }) {
  return (
    <Paper sx={{ p: 2, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h6" color="text.secondary">
        Volume Visualization (Coming Soon)
      </Typography>
    </Paper>
  );
}