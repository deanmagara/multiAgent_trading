import { Box, CssBaseline, Toolbar, SxProps, Theme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useMemo } from 'react';

export function DashboardLayout() {
  const containerStyles = useMemo<SxProps<Theme>>(
    () => ({
      display: 'flex',
      height: '100vh',
      width: '100vw',
    }),
    []
  );

  const mainStyles = useMemo<SxProps<Theme>>(
    () => ({
      flexGrow: 1,
      p: 3,
      display: 'flex',
      flexDirection: 'column',
    }),
    []
  );

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