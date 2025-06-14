import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, styled } from '@mui/material';
import {
  BacktestControls,
  ChatWindow,
  MarketDataTicker,
  PerformanceMetrics,
  PortfolioChart,
  ThreeScene,
  VolumeVisualization,
  MultiAgentControls
} from './components';

import { runRLAgent } from './services/api';

import { useChatbot } from './hooks/useChatbot';
import { useMarketData } from './hooks/useMarketData';

const AppContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden'
});

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3)
}));

function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'backtest'>('dashboard');
  const { messages, handleSend } = useChatbot();
  const { marketData, loading } = useMarketData();

  return (
    <AppContainer>
      <CssBaseline />
      {/* Sidebar would go here */}
      <MainContent component="main">
        <Toolbar /> {/* For spacing below app bar */}
        <MarketDataTicker />
        <MultiAgentControls />
        <Box display="flex" gap={3} flex={1}>
          {/* Left Column */}
    
          <Box flex={3} display="flex" flexDirection="column" gap={3}>
            <PortfolioChart data={[
              { x: '2024-06-01', y: 10000 },
              { x: '2024-06-02', y: 10100 },
              { x: '2024-06-03', y: 9900 }
            ]} />
            <PerformanceMetrics
              metrics={{
                sharpeRatio: 1.2,
                maxDrawdown: 8.5,
                totalReturn: 15.3,
                winRate: 62.7
              }}
            />
          </Box>

          {/* Right Column */}
          <Box flex={2} display="flex" flexDirection="column" gap={3}>
            <BacktestControls />
            <ChatWindow messages={messages} onSend={handleSend} />
          </Box>
        </Box>
      </MainContent>
    </AppContainer>
  );
}

function RLAgentControls() {
  const [selectedAgent, setSelectedAgent] = useState('PPO');
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    const data = await runRLAgent(selectedAgent);
    setResult(data.rewards);
  };

  return (
    <div>
      <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
        <option value="PPO">PPO</option>
        <option value="DQN">DQN</option>
        <option value="A2C">A2C</option>
      </select>
      <button onClick={handleRun}>Run Agent</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

export default App;