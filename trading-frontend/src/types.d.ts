export interface BacktestResult {
    portfolioHistory: Array<{
      date: string
      value: number
    }>
    metrics: {
      sharpeRatio: number
      maxDrawdown: number
      totalReturn: number
      winRate: number
    }
  }