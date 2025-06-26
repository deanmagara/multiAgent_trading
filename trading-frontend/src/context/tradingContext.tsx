import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of the data we expect from the backend
interface AgentPerformance {
    final_portfolio_value: number;
}

interface Allocation {
    [agentName: string]: number;
}

interface Signals {
    [agentName: string]: number;
}

// Add this to your TradingData interface
export interface TradingData {
    allocations: Allocation;
    signals: Signals;
    news_sentiment?: {
        sentiment_analysis?: {
            sentiment?: string;
            score?: number;
            summary?: string;
            confidence?: number;
        }
        // ...other fields if needed
    };
    [agentName: string]: AgentPerformance | Allocation | Signals | any;
}

interface TradingContextState {
    latestResults: TradingData | null;
    isConnecting: boolean;
}

const TradingContext = createContext<TradingContextState | undefined>(undefined);

const WEBSOCKET_URL = 'ws://localhost:8000/ws';

export const TradingContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [latestResults, setLatestResults] = useState<TradingData | null>(null);
    const [isConnecting, setIsConnecting] = useState(true);

    useEffect(() => {
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnecting(false);
        };

        ws.onmessage = (event) => {
            try {
                const data: TradingData = JSON.parse(event.data);
                console.log('Received analysis results via WebSocket:', data);
                setLatestResults(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            setIsConnecting(false);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnecting(false);
        };

        return () => {
            ws.close();
        };
    }, []);

    const value = { latestResults, isConnecting };

  return (
        <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
    );
};

export const useTradingContext = () => {
    const context = useContext(TradingContext);
    if (context === undefined) {
        throw new Error('useTradingContext must be used within a TradingContextProvider');
  }
    return context;
};