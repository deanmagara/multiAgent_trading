const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function for API calls with error handling
const apiCall = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    throw error;
  }
};

export const fetchMarketData = async () => {
  return apiCall(`${API_BASE_URL}/api/market-data`);
}

export const runBacktest = async (params: any) => {
  return apiCall(`${API_BASE_URL}/api/backtest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...params,
      startDate: params.startDate.toISOString().split('T')[0],
      endDate: params.endDate.toISOString().split('T')[0]
    })
  });
}

export const getPortfolioHistory = async () => {
  return apiCall(`${API_BASE_URL}/api/portfolio-history`);
}

export const runRLAgent = async (agentType: string) => {
  return apiCall(`${API_BASE_URL}/api/run-agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ agent_type: agentType })
  });
}

export async function runMultiAgent({ agent_types, pair }: { agent_types: string[], pair: string }) {
  return apiCall(`${API_BASE_URL}/api/multi-agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ agent_types, pair })
  });
}

export const askChatbot = async (message: string) => {
  return apiCall(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message })
  });
};

// Add new API endpoints for the enhanced features
export const api = {
  // Market data
  getMarketData: async () => {
    return apiCall(`${API_BASE_URL}/api/market-data`);
  },

  // Forex signals
  getForexSignals: async () => {
    return apiCall(`${API_BASE_URL}/api/forex-signals`);
  },

  // Performance metrics
  getPerformanceMetrics: async () => {
    return apiCall(`${API_BASE_URL}/api/performance/metrics`);
  },

  // Enhanced backtest with risk management
  runEnhancedBacktest: async (params: {
    initial_capital: number;
    risk_params: any;
    market_data: any[];
    signals: any[];
  }) => {
    return apiCall(`${API_BASE_URL}/api/backtest/enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  },

  // Calculate position size
  calculatePositionSize: async (params: {
    account_balance: number;
    entry_price: number;
    stop_loss_price: number;
    pair: string;
    confidence: number;
  }) => {
    return apiCall(`${API_BASE_URL}/api/risk/calculate-position-size`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  },

  // Analyze signal confidence
  analyzeSignalConfidence: async (signal: any) => {
    return apiCall(`${API_BASE_URL}/api/signals/analyze-confidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ signal }),
    });
  },

  // Ensemble signal
  getEnsembleSignal: async (marketData: any, newsData?: any) => {
    return apiCall(`${API_BASE_URL}/api/ensemble/signal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ market_data: marketData, news_data: newsData }),
    });
  },

  // Technical indicators
  getTechnicalIndicators: async (marketData: any) => {
    return apiCall(`${API_BASE_URL}/api/technical/indicators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ market_data: marketData }),
    });
  },

  // Multi-timeframe analysis
  getMultiTimeframeAnalysis: async (marketData: any) => {
    return apiCall(`${API_BASE_URL}/api/multi-timeframe/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ market_data: marketData }),
    });
  },
};