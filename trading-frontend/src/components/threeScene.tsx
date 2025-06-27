import React from 'react';
import { Paper, Typography } from '@mui/material';

export function ThreeScene() {
  return (
    <Paper sx={{ p: 2, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h6" color="text.secondary">
        3D Visualization (Coming Soon)
      </Typography>
    </Paper>
  );
}