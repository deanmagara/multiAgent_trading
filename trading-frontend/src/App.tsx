import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, Typography, Paper, Stack, styled } from '@mui/material';
import {
  BacktestControls,
  ChatWindow,
  MarketDataTicker,
  PerformanceMetrics,
  PortfolioChart,
  MultiAgentControls,
  ForexPairSelector,
  ForexSignals
} from './components';
import { useChatbot } from './hooks/useChatbot';
import { useMarketData } from './hooks/useMarketData';
import './App.css';
import { TradingContextProvider } from './context/tradingContext';
import { DashboardLayout } from './layouts/dashboardLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const AppContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  width: '100vw',
  background: '#f4f6fa'
});

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  overflow: 'auto'
}));

const queryClient = new QueryClient();

function App() {
  const { messages, sendMessage, isLoading } = useChatbot();
  const [selectedPair, setSelectedPair] = useState('EURUSD=X');

  return (
    <QueryClientProvider client={queryClient}>
      <TradingContextProvider>
    <AppContainer>
      <CssBaseline />
      <MainContent component="main">
        <Toolbar />
        <Paper elevation={3} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Market Overview
          </Typography>
          <ForexSignals />
          <MarketDataTicker />
        </Paper>
        <ForexPairSelector value={selectedPair} onChange={setSelectedPair} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} flex={1}>
          {/* Left Column */}
          <Stack spacing={3} flex={3}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Multi-Agent RL
              </Typography>
              <MultiAgentControls />
            </Paper>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Portfolio Performance
              </Typography>
              {/*<PortfolioChart
                data={[
                  { x: '2024-06-01', y: 10000 },
                  { x: '2024-06-02', y: 10100 },
                  { x: '2024-06-03', y: 9900 }
                ]}
              />
              <PerformanceMetrics
                metrics={{
                  sharpeRatio: 1.2,
                  maxDrawdown: 8.5,
                  totalReturn: 15.3,
                  winRate: 62.7
                }}
              />*/}
            </Paper>
          </Stack>
          {/* Right Column */}
          <Stack spacing={3} flex={2}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Backtest
              </Typography>
              <BacktestControls />
            </Paper>
            <Paper elevation={2} sx={{ p: 2, height: 350, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Chatbot
              </Typography>
              <Box flex={1} minHeight={0}>
                    <ChatWindow 
                      messages={messages} 
                      onSend={sendMessage} 
                      isLoading={isLoading} 
                    />
              </Box>
            </Paper>
          </Stack>
        </Stack>
      </MainContent>
    </AppContainer>
      </TradingContextProvider>
    </QueryClientProvider>
  );
}

export default App;