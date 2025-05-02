import { Box, CssBaseline, Toolbar } from '@mui/material'
import { Outlet } from 'react-router-dom'

export function DashboardLayout() {
    return (
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
    );
  }