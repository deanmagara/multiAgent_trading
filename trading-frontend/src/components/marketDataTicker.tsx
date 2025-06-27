import React from 'react';

interface MarketData {
  symbol: string;
  price: number;
  timestamp: string;
}

interface MarketDataTickerProps {
  data: MarketData[];
}

const MarketDataTicker: React.FC<MarketDataTickerProps> = ({ data }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Market Data</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="font-medium">{item.symbol}</span>
            <span className="text-green-600">${item.price.toFixed(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketDataTicker;