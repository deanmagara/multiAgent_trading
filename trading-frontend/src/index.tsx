import { createRoot } from 'react-dom/client'
import { TradingContextProvider } from './context/tradingContext'
import App from './App'

const root = createRoot(document.getElementById('root')!)

root.render(
  <TradingContextProvider>
    <App />
  </TradingContextProvider>
)