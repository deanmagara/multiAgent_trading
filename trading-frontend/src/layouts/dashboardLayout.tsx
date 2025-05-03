import { Box, CssBaseline, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { SxProps, Theme } from '@mui/material/styles';
import React from 'react';

// Use concrete style values
const styles: { container: SxProps<Theme>; main: SxProps<Theme> } = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
  },
  main: {
    flexGrow: 1,
    p: 3,
    display: 'flex',
    flexDirection: 'column',
  },
} as const;

export function DashboardLayout() {
  return (
    <Box sx={styles.container}>
      <CssBaseline />
      <Box component="main" sx={styles.main}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}