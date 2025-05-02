import { Box, CssBaseline, Toolbar } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { Sidebar } from '../components/Sidebar'

export function DashboardLayout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppHeader />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* For spacing below app bar */}
        <Outlet />
      </Box>
    </Box>
  )
}