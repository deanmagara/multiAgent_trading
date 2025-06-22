import { useState, useEffect } from 'react';

const WEBSOCKET_URL = 'ws://localhost:8000/ws'; // Or your backend URL

export const useWebSocket = () => {
    const [lastMessage, setLastMessage] = useState<any>(null);

    useEffect(() => {
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received data:', data);
            setLastMessage(data); // Update state with the new data
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        // Clean up the connection when the component unmounts
        return () => {
            ws.close();
        };
    }, []);

    return { lastMessage };
};

export function useMarketData() {
  const [marketData] = useState([
    { symbol: 'AAPL', price: 190.12 },
    { symbol: 'GOOG', price: 2850.55 }
  ]);
  const [loading] = useState(false);
  return { marketData, loading };
}