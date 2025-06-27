import { Box, CssBaseline, Toolbar } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, sx }) => {
  return (
    <Box sx={{ display: 'flex', ...sx }}>
      <CssBaseline />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};