import { useState, useEffect, useRef } from 'react';

interface RealTimeSignal {
  pair: string;
  timestamp: string;
  ml_signal: {
    signal: string;
    confidence: number;
  };
  tech_signal: {
    direction: string;
    confidence: number;
  };
  combined_signal: {
    signal: string;
    confidence: number;
  };
}

export const useWebSocket = (url: string) => {
  const [signals, setSignals] = useState<RealTimeSignal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        console.log('🔌 Connecting to WebSocket:', url);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📡 WebSocket message received:', data);
            
            // Add the new signal to the list
            setSignals(prevSignals => {
              const newSignals = [...prevSignals, data];
              // Keep only the last 50 signals to prevent memory issues
              return newSignals.slice(-50);
            });
          } catch (err) {
            console.error('❌ Error parsing WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          setIsConnected(false);
          setError('Connection closed');
        };

        ws.onerror = (event) => {
          console.error('❌ WebSocket error:', event);
          setError('WebSocket error');
          setIsConnected(false);
        };

      } catch (err) {
        console.error('❌ Error creating WebSocket:', err);
        setError('Failed to connect');
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  return { signals, isConnected, error };
};