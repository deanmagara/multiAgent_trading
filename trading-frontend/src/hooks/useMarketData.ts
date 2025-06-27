import { useState, useEffect } from 'react';

interface MarketData {
  symbol: string;
  price: number;
  timestamp: string;
}

interface Signal {
  pair: string;
  direction: 'buy' | 'sell';
  strength: number;
  confidence: number;
  confidence_breakdown?: {
    technical: number;
    fundamental: number;
    sentiment: number;
    volatility: number;
  };
  recommendation: 'strong' | 'weak' | 'reject';
  timestamp: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_amount: number;
  position_size: number;
}

export const useMarketData = (selectedPair?: string) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulate API calls
        const mockMarketData: MarketData[] = [
          { symbol: 'EUR/USD', price: 1.0850, timestamp: new Date().toISOString() },
          { symbol: 'GBP/USD', price: 1.2650, timestamp: new Date().toISOString() },
          { symbol: 'USD/JPY', price: 150.25, timestamp: new Date().toISOString() },
          { symbol: 'USD/CHF', price: 0.8750, timestamp: new Date().toISOString() },
          { symbol: 'AUD/USD', price: 0.6650, timestamp: new Date().toISOString() },
          { symbol: 'USD/CAD', price: 1.3450, timestamp: new Date().toISOString() },
          { symbol: 'NZD/USD', price: 0.6150, timestamp: new Date().toISOString() },
        ];

        // Generate dynamic signals based on selected pair
        const generateSignalsForPair = (pair: string): Signal[] => {
          const pairData = {
            'EUR/USD': { basePrice: 1.0850, volatility: 0.0015 },
            'GBP/USD': { basePrice: 1.2650, volatility: 0.0020 },
            'USD/JPY': { basePrice: 150.25, volatility: 0.25 },
            'USD/CHF': { basePrice: 0.8750, volatility: 0.0012 },
            'AUD/USD': { basePrice: 0.6650, volatility: 0.0018 },
            'USD/CAD': { basePrice: 1.3450, volatility: 0.0016 },
            'NZD/USD': { basePrice: 0.6150, volatility: 0.0022 },
          };

          const pairInfo = pairData[pair as keyof typeof pairData] || pairData['EUR/USD'];
          
          // Generate random signal for the selected pair
          const direction = Math.random() > 0.5 ? 'buy' : 'sell';
          const strength = 0.5 + Math.random() * 0.4; // 0.5 to 0.9
          const confidence = 0.6 + Math.random() * 0.3; // 0.6 to 0.9
          
          const entryPrice = pairInfo.basePrice;
          const stopLoss = direction === 'buy' 
            ? entryPrice - (pairInfo.volatility * 50)
            : entryPrice + (pairInfo.volatility * 50);
          const takeProfit = direction === 'buy'
            ? entryPrice + (pairInfo.volatility * 100)
            : entryPrice - (pairInfo.volatility * 100);

          return [{
            pair: pair,
            direction: direction,
            strength: strength,
            confidence: confidence,
            confidence_breakdown: {
              technical: 0.7 + Math.random() * 0.2,
              fundamental: 0.6 + Math.random() * 0.3,
              sentiment: 0.5 + Math.random() * 0.4,
              volatility: 0.6 + Math.random() * 0.3
            },
            recommendation: confidence > 0.8 ? 'strong' : confidence > 0.6 ? 'weak' : 'reject',
            timestamp: new Date().toISOString(),
            entry_price: entryPrice,
            stop_loss: stopLoss,
            take_profit: takeProfit,
            risk_amount: 200.0,
            position_size: 10000.0
          }];
        };

        // Filter market data for selected pair if specified
        const filteredMarketData = selectedPair 
          ? mockMarketData.filter(data => data.symbol === selectedPair)
          : mockMarketData;

        // Generate signals for selected pair
        const pairSignals = selectedPair 
          ? generateSignalsForPair(selectedPair)
          : generateSignalsForPair('EUR/USD'); // Default

        setMarketData(filteredMarketData);
        setSignals(pairSignals);
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [selectedPair]); // Add selectedPair as dependency

  return { marketData, signals, loading };
};