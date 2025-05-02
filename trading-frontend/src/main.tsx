import { createRoot } from 'react-dom/client'
import { TradingProvider } from './context/tradingContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

const queryClient = new QueryClient()
const root = createRoot(document.getElementById('root')!)

root.render(
  <QueryClientProvider client={queryClient}>
    <TradingProvider>
      <App />
    </TradingProvider>
  </QueryClientProvider>
)