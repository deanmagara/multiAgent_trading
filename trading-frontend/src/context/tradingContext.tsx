import { createContext, useContext, ReactNode, useState } from 'react'
import { BacktestResult } from '../types'

type TradingContextType = {
  backtestResults: BacktestResult | null
  setBacktestResults: (results: BacktestResult) => void
  marketData: any[]
  setMarketData: (data: any[]) => void
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

export function TradingProvider({ children }: { children: ReactNode }) {
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null)
  const [marketData, setMarketData] = useState<any[]>([])

  return (
    <TradingContext.Provider value={{
      backtestResults,
      setBacktestResults,
      marketData,
      setMarketData
    }}>
      {children}
    </TradingContext.Provider>
  )
}

export function useTrading() {
  const context = useContext(TradingContext)
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider')
  }
  return context
}