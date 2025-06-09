import { useState } from 'react';

export function useMarketData() {
  const [marketData] = useState([
    { symbol: 'AAPL', price: 190.12 },
    { symbol: 'GOOG', price: 2850.55 }
  ]);
  const [loading] = useState(false);
  return { marketData, loading };
}