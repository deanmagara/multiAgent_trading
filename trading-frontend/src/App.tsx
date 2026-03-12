import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Box, Button } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';

// Import original components
import MarketDataTicker from './components/MarketDataTicker';
import ForexPairSelector from './components/ForexPairSelector';
import NewsSentiment from './components/NewsSentiment';
import PortfolioChart from './components/PortfolioChart';
import PerformanceMetrics from './components/PerformanceMetrics';
import RiskManagement from './components/RiskManagement';

// Import Week 5-6 components
import WalkForwardAnalysis from './components/WalkForwardAnalysis';
import LiveAlerts from './components/LiveAlerts';
import EconomicCalendar from './components/EconomicCalendar';

// Import hooks and services
import { useMarketData } from './hooks/useMarketData';
import { useWebSocket } from './hooks/useWebSocket';
import { api } from './services/api';

// Import ChatWindow component
import ChatWindow from './components/ChatWindow';
import RealTimeSignals from './components/RealTimeSignals';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  const [selectedPair, setSelectedPair] = useState('EURUSD=X');
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'analysis', 'calendar'

  // Get market data with selected pair
  const { marketData, loading } = useMarketData();
  
  // Get real-time signals from WebSocket
  const { signals: realTimeSignals, isConnected, error } = useWebSocket('ws://localhost:8000/api/ws/signals');

  // Convert pair format for signals (EURUSD=X -> EUR/USD)
  const formatPairForSignals = (pair: string): string => {
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

  // Filter signals for selected pair - IMPROVED LOGIC
  const filteredSignals = realTimeSignals.filter(signal => {
    const formattedSelectedPair = formatPairForSignals(selectedPair);
    const signalPair = signal.pair;
    
    console.log(`🔍 Filtering: Comparing signal pair: "${signalPair}" with formatted selected pair: "${formattedSelectedPair}"`);
    console.log(`🔍 Signal object:`, signal);
    
    // More flexible matching
    const match = signalPair === formattedSelectedPair || 
                  signalPair === selectedPair ||
                  signalPair.replace('/', '') === selectedPair.replace('=X', '');
    
    console.log(`🔍 Match result: ${match}`);
    return match;
  });

  // Debug logging
  /*console.log('📊 App Debug Info:', {
    selectedPair,
    formattedSelectedPair: formatPairForSignals(selectedPair),
    allSignals: signals,
    filteredSignals,
    loading,
    signalPairs: signals.map(s => s.pair)
  });*/

  useEffect(() => {
    // Fetch performance metrics
    const fetchMetrics = async () => {
      try {
        const response = await api.getPerformanceMetrics();
        console.log('Performance metrics response:', response);
        
        if (response.success && response.metrics) {
          setPerformanceMetrics(response.metrics);
        } else {
          // Use fallback data if API fails
          setPerformanceMetrics({
            total_trades: 150,
            win_rate: 0.62,
            profit_factor: 1.85,
            sharpe_ratio: 1.72,
            max_drawdown: 0.12,
            total_return: 0.28,
            avg_trade_duration: 2.5,
            risk_adjusted_return: 1.45
          });
        }
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error);
        // Use fallback data
        setPerformanceMetrics({
          total_trades: 150,
          win_rate: 0.62,
          profit_factor: 1.85,
          sharpe_ratio: 1.72,
          max_drawdown: 0.12,
          total_return: 0.28,
          avg_trade_duration: 2.5,
          risk_adjusted_return: 1.45
        });
      }
    };

    fetchMetrics();
  }, []);

  const renderDashboard = () => (
    <Grid container spacing={3}>
      {/* Market Data Ticker */}
      <Grid item xs={12}>
        <MarketDataTicker marketData={marketData} loading={loading} />
      </Grid>

      {/* Forex Pair Selector */}
      <Grid item xs={12} md={3}>
        <ForexPairSelector 
          value={selectedPair} 
          onChange={setSelectedPair} 
        />
      </Grid>

      {/* Real-Time Signals */}
      <Grid item xs={12} md={9}>
        <RealTimeSignals 
          signals={realTimeSignals} 
          isConnected={isConnected} 
          error={error} 
        />
      </Grid>

      {/* Performance Metrics */}
      <Grid item xs={12} md={6}>
        <PerformanceMetrics metrics={performanceMetrics} />
      </Grid>

      {/* Risk Management */}
      <Grid item xs={12} md={6}>
        <RiskManagement />
      </Grid>

      {/* Portfolio Chart */}
      <Grid item xs={12} md={8}>
        <PortfolioChart />
      </Grid>

      {/* News Sentiment */}
      <Grid item xs={12} md={4}>
        <NewsSentiment />
      </Grid>

      {/* Live Alerts */}
      <Grid item xs={12}>
        <LiveAlerts />
      </Grid>

      {/* Add ChatWindow */}
      <Grid item xs={12} md={6}>
        <ChatWindow />
      </Grid>
    </Grid>
  );

  const renderAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <WalkForwardAnalysis />
      </Grid>
    </Grid>
  );

  const renderCalendar = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <EconomicCalendar />
      </Grid>
    </Grid>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            AI Trading Platform
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Multi-Agent Forex Trading with Real-time Signals
          </Typography>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ mb: 3 }}>
          <Button 
            variant={activeTab === 'dashboard' ? 'contained' : 'outlined'} 
            onClick={() => setActiveTab('dashboard')}
            sx={{ mr: 2 }}
          >
            Dashboard
          </Button>
          <Button 
            variant={activeTab === 'analysis' ? 'contained' : 'outlined'} 
            onClick={() => setActiveTab('analysis')}
            sx={{ mr: 2 }}
          >
            Analysis
          </Button>
          <Button 
            variant={activeTab === 'calendar' ? 'contained' : 'outlined'} 
            onClick={() => setActiveTab('calendar')}
          >
            Economic Calendar
          </Button>
        </Box>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'analysis' && renderAnalysis()}
        {activeTab === 'calendar' && renderCalendar()}
      </Container>
    </ThemeProvider>
  );
}

export default App;