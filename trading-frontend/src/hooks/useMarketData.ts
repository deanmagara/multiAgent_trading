import { useState, useEffect } from 'react';
import { Signal, MarketData } from '../types';

export const useMarketData = (selectedPair?: string) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching market data and signals...');
        
        // Fetch real market data from API
        const marketResponse = await fetch('http://localhost:8000/api/market-data');
        const marketDataResult = await marketResponse.json();
        
        console.log('📊 Market data response:', marketDataResult);
        
        if (marketDataResult.success) {
          setMarketData(marketDataResult.data || []);
        }

        // Fetch real forex signals from API
        console.log('📡 Fetching forex signals...');
        const signalsResponse = await fetch('http://localhost:8000/api/forex-signals');
        const signalsResult = await signalsResponse.json();
        
        console.log('📈 Signals API response:', signalsResult);
        
        if (signalsResult.success && signalsResult.signals) {
          console.log('✅ Raw signals from API:', signalsResult.signals);
          
          // Transform the signals to match frontend expectations
          const transformedSignals: Signal[] = signalsResult.signals.map((signal: any, index: number) => {
            console.log(`🔄 Transforming signal ${index}:`, signal);
            
            const transformed = {
              ...signal,
              // Ensure recommendation is one of the expected values
              recommendation: signal.recommendation === 'moderate' ? 'weak' : signal.recommendation,
              // Ensure all required fields are present
              confidence_breakdown: signal.confidence_breakdown || {
                technical: 0,
                fundamental: 0,
                sentiment: 0,
                volatility: 0
              },
              analysis: signal.analysis || {
                rsi: 0,
                macd: 'neutral',
                bollinger_position: 0,
                trend_strength: 0
              }
            };
            
            console.log(`✅ Transformed signal ${index}:`, transformed);
            return transformed;
          });
          
          console.log('🎯 Final transformed signals:', transformedSignals);
          setSignals(transformedSignals);
        } else {
          console.log('⚠️ No signals from API, using fallback');
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
              position_size: 10000.0,
              analysis: {
                rsi: 65.5,
                macd: "bullish",
                bollinger_position: 0.7,
                trend_strength: 0.8
              }
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
              position_size: 7500.0,
              analysis: {
                rsi: 35.2,
                macd: "bearish",
                bollinger_position: 0.3,
                trend_strength: 0.6
              }
            }
          ];
          console.log('🎯 Using mock signals:', mockSignals);
          setSignals(mockSignals);
        }
      } catch (error) {
        console.error('❌ Error fetching market data:', error);
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
            position_size: 10000.0,
            analysis: {
              rsi: 65.5,
              macd: "bullish",
              bollinger_position: 0.7,
              trend_strength: 0.8
            }
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
            position_size: 7500.0,
            analysis: {
              rsi: 35.2,
              macd: "bearish",
              bollinger_position: 0.3,
              trend_strength: 0.6
            }
          }
        ];

        setMarketData(mockMarketData);
        setSignals(mockSignals);
      } finally {
        setLoading(false);
        console.log('🏁 Finished fetching data, loading set to false');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []); // Remove selectedPair dependency - we'll handle filtering in the component

  console.log('🎯 useMarketData hook state:', { marketData, signals, loading });
  return { marketData, signals, loading };
};