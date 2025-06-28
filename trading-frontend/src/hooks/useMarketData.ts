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
        console.log('Fetching market data and signals...');
        
        // Fetch real market data from API
        const marketResponse = await fetch('http://localhost:8000/api/market-data');
        const marketDataResult = await marketResponse.json();
        
        if (marketDataResult.success) {
          setMarketData(marketDataResult.data || []);
        }

        // Fetch real forex signals from API
        const signalsResponse = await fetch('http://localhost:8000/api/forex-signals');
        const signalsResult = await signalsResponse.json();
        
        console.log('Signals API response:', signalsResult);
        
        if (signalsResult.success && signalsResult.signals) {
          // Don't filter here - return all signals and let the component handle filtering
          setSignals(signalsResult.signals);
        } else {
          console.log('No signals from API, using fallback');
          // Fallback to mock data if API fails
          const mockSignals: Signal[] = [
            {
              pair: "EUR/USD",
              direction: "buy",
              strength: 0.75,
              confidence: 0.82,
              confidence_breakdown: {
                technical: 0.85,
                fundamental: 0.70,
                sentiment: 0.80,
                volatility: 0.75
              },
              recommendation: "strong",
              timestamp: new Date().toISOString(),
              entry_price: 1.0850,
              stop_loss: 1.0800,
              take_profit: 1.0950,
              risk_amount: 200.0,
              position_size: 10000.0
            },
            {
              pair: "GBP/USD",
              direction: "sell",
              strength: 0.65,
              confidence: 0.71,
              confidence_breakdown: {
                technical: 0.70,
                fundamental: 0.65,
                sentiment: 0.75,
                volatility: 0.60
              },
              recommendation: "weak",
              timestamp: new Date().toISOString(),
              entry_price: 1.2650,
              stop_loss: 1.2700,
              take_profit: 1.2550,
              risk_amount: 150.0,
              position_size: 7500.0
            }
          ];
          setSignals(mockSignals);
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        // Fallback to mock data if API fails
        const mockMarketData: MarketData[] = [
          { symbol: 'EUR/USD', price: 1.0850, timestamp: new Date().toISOString() },
          { symbol: 'GBP/USD', price: 1.2650, timestamp: new Date().toISOString() },
          { symbol: 'USD/JPY', price: 150.25, timestamp: new Date().toISOString() },
          { symbol: 'USD/CHF', price: 0.8750, timestamp: new Date().toISOString() },
          { symbol: 'AUD/USD', price: 0.6650, timestamp: new Date().toISOString() },
          { symbol: 'USD/CAD', price: 1.3450, timestamp: new Date().toISOString() },
          { symbol: 'NZD/USD', price: 0.6150, timestamp: new Date().toISOString() },
        ];

        const mockSignals: Signal[] = [
          {
            pair: "EUR/USD",
            direction: "buy",
            strength: 0.75,
            confidence: 0.82,
            confidence_breakdown: {
              technical: 0.85,
              fundamental: 0.70,
              sentiment: 0.80,
              volatility: 0.75
            },
            recommendation: "strong",
            timestamp: new Date().toISOString(),
            entry_price: 1.0850,
            stop_loss: 1.0800,
            take_profit: 1.0950,
            risk_amount: 200.0,
            position_size: 10000.0
          },
          {
            pair: "GBP/USD",
            direction: "sell",
            strength: 0.65,
            confidence: 0.71,
            confidence_breakdown: {
              technical: 0.70,
              fundamental: 0.65,
              sentiment: 0.75,
              volatility: 0.60
            },
            recommendation: "weak",
            timestamp: new Date().toISOString(),
            entry_price: 1.2650,
            stop_loss: 1.2700,
            take_profit: 1.2550,
            risk_amount: 150.0,
            position_size: 7500.0
          }
        ];

        setMarketData(mockMarketData);
        setSignals(mockSignals);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []); // Remove selectedPair dependency - we'll handle filtering in the component

  return { marketData, signals, loading };
};