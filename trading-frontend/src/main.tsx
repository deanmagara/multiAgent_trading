import { TradingProvider } from './context/TradingContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <TradingProvider>
      <App />
    </TradingProvider>
  </QueryClientProvider>
)