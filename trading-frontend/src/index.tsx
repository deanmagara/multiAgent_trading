import { createRoot } from 'react-dom/client'
import { TradingContextProvider } from './context/tradingContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

const queryClient = new QueryClient()
const root = createRoot(document.getElementById('root')!)

root.render(
  <QueryClientProvider client={queryClient}>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TradingContextProvider>
        <App />
      </TradingContextProvider>
    </LocalizationProvider>
  </QueryClientProvider>
)