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

export interface Signal {
  pair: string;
  direction: 'buy' | 'sell' | 'hold';
  strength: number;
  confidence: number;
  confidence_breakdown?: {
    technical: number;
    fundamental: number;
    sentiment: number;
    volatility: number;
  };
  recommendation: 'strong' | 'moderate' | 'weak' | 'reject';
  timestamp: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_amount: number;
  position_size: number;
  analysis?: {
    rsi: number;
    macd: string;
    bollinger_position: number;
    trend_strength: number;
  };
}

export interface MarketData {
  symbol: string;
  price: number;
  timestamp: string;
}