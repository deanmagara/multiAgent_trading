import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';

// Import original components
import MarketDataTicker from './components/MarketDataTicker';
import ForexPairSelector from './components/ForexPairSelector';
import ForexSignals from './components/ForexSignals';
import NewsSentiment from './components/NewsSentiment';
import PortfolioChart from './components/PortfolioChart';
import ChatWindow from './components/ChatWindow';

// Import new enhanced components
import PerformanceMetrics from './components/PerformanceMetrics';
import RiskManagement from './components/RiskManagement';

// Import hooks and services
import { useMarketData } from './hooks/useMarketData';
import { Message } from './hooks/useChatbot';
import { api } from './services/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [selectedPair, setSelectedPair] = useState('EURUSD=X');
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [riskParams, setRiskParams] = useState({
    max_risk_per_trade: 0.02,
    max_portfolio_risk: 0.06,
    stop_loss_pips: 50,
    take_profit_pips: 100,
    max_correlation: 0.7,
    max_positions: 5
  });

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Update the conversion logic to handle all pairs correctly
  const formatPairForSignals = (pair: string): string => {
    // Convert EURUSD=X -> EUR/USD, GBPUSD=X -> GBP/USD, etc.
    const pairMap: { [key: string]: string } = {
      'EURUSD=X': 'EUR/USD',
      'GBPUSD=X': 'GBP/USD',
      'USDJPY=X': 'USD/JPY',
      'USDCHF=X': 'USD/CHF',
      'AUDUSD=X': 'AUD/USD',
      'USDCAD=X': 'USD/CAD',
      'NZDUSD=X': 'NZD/USD',
    };
    
    return pairMap[pair] || pair.replace('=X', '').replace('USD', '/USD');
  };

  // Update the useMarketData call
  const formattedPair = formatPairForSignals(selectedPair);
  const { marketData, signals } = useMarketData(formattedPair);

  useEffect(() => {
    // Fetch performance metrics
    const fetchMetrics = async () => {
      try {
        const response = await api.getPerformanceMetrics();
        console.log('Performance metrics response:', response); // Debug log
        
        if (response.success && response.metrics) {
          setPerformanceMetrics(response.metrics);
        } else {
          // Fallback data if API fails
          console.log('Using fallback performance metrics');
          setPerformanceMetrics({
            total_trades: 150,
            win_rate: 0.62,
            profit_factor: 1.7,
            sharpe_ratio: 1.8,
            max_drawdown: {
              max_drawdown_pct: 12.5
            },
            risk_adjusted_return: 0.15,
            total_return: 0.25,
            current_capital: 12500,
            average_trade_duration: '2.5 hours'
          });
        }
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
        // Fallback data on error
        setPerformanceMetrics({
          total_trades: 150,
          win_rate: 0.62,
          profit_factor: 1.7,
          sharpe_ratio: 1.8,
          max_drawdown: {
            max_drawdown_pct: 12.5
          },
          risk_adjusted_return: 0.15,
          total_return: 0.25,
          current_capital: 12500,
          average_trade_duration: '2.5 hours'
        });
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleChatSend = (message: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Simulate bot response
    setIsChatLoading(true);
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I received your message: "${message}". This is a simulated response.`,
        sender: 'bot',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botMessage]);
      setIsChatLoading(false);
    }, 1000);
  };

  const handlePairChange = (pair: string) => {
    setSelectedPair(pair);
    console.log('Selected pair:', pair);
    console.log('Formatted pair for signals:', formatPairForSignals(pair));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2, mb: 3 }}>
          <Container>
            <Typography variant="h4" component="h1" align="center">
              Multi-Agent Trading System
            </Typography>
          </Container>
        </Box>
        
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {/* Forex Pair Selector */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Select Forex Pair
                </Typography>
                <ForexPairSelector 
                  value={selectedPair} 
                  onChange={handlePairChange} 
                />
              </Paper>
            </Grid>

            {/* Market Data Ticker */}
            <Grid item xs={12} md={9}>
              <Paper sx={{ p: 2 }}>
                <MarketDataTicker data={marketData} />
              </Paper>
            </Grid>

            {/* Forex Signals */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 2 }}>
                <ForexSignals 
                  signals={signals} 
                  onSignalSelect={(signal) => console.log('Selected signal:', signal)}
                />
              </Paper>
            </Grid>

            {/* Performance Metrics */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2 }}>
                <PerformanceMetrics metrics={performanceMetrics} />
              </Paper>
            </Grid>

            {/* Risk Management */}
            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 2 }}>
                <RiskManagement 
                  accountBalance={10000}
                  activePositions={[]}
                  riskParams={riskParams}
                  onRiskParamsChange={setRiskParams}
                />
              </Paper>
            </Grid>

            {/* News Sentiment */}
            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 2 }}>
                <NewsSentiment pair={formattedPair} />
              </Paper>
            </Grid>

            {/* Portfolio Chart */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 2 }}>
                <PortfolioChart />
              </Paper>
            </Grid>

            {/* Chat Window */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2 }}>
                <ChatWindow 
                  messages={chatMessages}
                  onSend={handleChatSend}
                  isLoading={isChatLoading}
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;