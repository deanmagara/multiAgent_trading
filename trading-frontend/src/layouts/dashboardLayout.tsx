import { Box, CssBaseline, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { SxProps, Theme } from '@mui/material/styles';
import React from 'react';

// Split into individually typed constants
const containerStyles: SxProps<Theme> = {
  display: 'flex',
  height: '100vh',
  width: '100vw',
};

const mainStyles: SxProps<Theme> = {
  flexGrow: 1,
  p: 3,
  display: 'flex',
  flexDirection: 'column',
};

export function DashboardLayout() {
  return (
    <Box sx={containerStyles}>
      <CssBaseline />
      <Box component="main" sx={mainStyles}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}