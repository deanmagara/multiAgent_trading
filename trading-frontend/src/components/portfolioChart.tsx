import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Chip,
  Button,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Refresh
} from '@mui/icons-material';

interface PortfolioData {
  date: string;
  value: number;
  change: number;
}

interface PortfolioResponse {
  current_value: number;
  initial_capital: number;
  total_return: number;
  total_pnl: number;
  history: PortfolioData[];
  recent_trades: any[];
  total_trades: number;
}

const PortfolioChart: React.FC = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentValue, setCurrentValue] = useState(10000);
  const [totalReturn, setTotalReturn] = useState(0.15);
  const [totalPnl, setTotalPnl] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock');

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Fetching portfolio data from API...');
      
      const response = await fetch('http://localhost:8000/api/portfolio-history');
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 API Response data:', result);
        
        if (result.success && result.data) {
          const data = result.data;
          setPortfolioData(data.history);
          setCurrentValue(data.current_value);
          setTotalReturn(data.total_return);
          setTotalPnl(data.total_pnl);
          setTotalTrades(data.total_trades);
          setRecentTrades(data.recent_trades);
          setDataSource('api');
          console.log('✅ Using real API data');
        } else {
          console.log('❌ API returned success=false, using mock data');
          setDataSource('mock');
          generateMockData();
        }
      } else {
        console.log('❌ API request failed, using mock data');
        setDataSource('mock');
        generateMockData();
      }
    } catch (error) {
      console.error('💥 Error fetching portfolio data:', error);
      setError(`Failed to fetch data: ${error}`);
      setDataSource('mock');
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    console.log('🎲 Generating mock portfolio data...');
    const data: PortfolioData[] = [];
    let currentValue = 10000;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dailyReturn = (Math.random() - 0.5) * 0.02;
      currentValue *= (1 + dailyReturn);
      
      data.push({
        date: date.toLocaleDateString(),
        value: Math.round(currentValue),
        change: dailyReturn * 100
      });
    }
    
    setPortfolioData(data);
    setCurrentValue(Math.round(currentValue));
    setTotalReturn((currentValue - 10000) / 10000);
    setTotalPnl(Math.round(currentValue - 10000));
    setTotalTrades(0);
    setRecentTrades([]);
  };

  useEffect(() => {
    fetchPortfolioData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchPortfolioData, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading real-time portfolio data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <ShowChart sx={{ mr: 1 }} />
            <Typography variant="h6">Portfolio Performance</Typography>
            <Chip 
              label={dataSource === 'api' ? 'Real Data' : 'Mock Data'} 
              color={dataSource === 'api' ? 'success' : 'warning'}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>
        }
        action={
          <Box display="flex" alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={fetchPortfolioData}
              startIcon={<Refresh />}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Chip
              label={formatPercentage(totalReturn)}
              color={totalReturn >= 0 ? 'success' : 'error'}
              icon={totalReturn >= 0 ? <TrendingUp /> : <TrendingDown />}
            />
          </Box>
        }
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {formatCurrency(currentValue)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Current Value
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" color={totalPnl >= 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(totalPnl)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total P&L
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="textSecondary">
                {totalTrades}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Trades
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="textSecondary">
                31 Days
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Time Period
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Portfolio Chart */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Portfolio Value Trend (Last 30 Days)
          </Typography>
          <Box sx={{ 
            height: 200, 
            bgcolor: 'background.paper', 
            border: 1, 
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            position: 'relative'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              height: '100%', 
              gap: 0.5 
            }}>
              {portfolioData.slice(-10).map((data, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: 1,
                    bgcolor: data.change >= 0 ? 'success.main' : 'error.main',
                    height: `${Math.max(10, (data.value / 12000) * 100)}%`,
                    minHeight: 10,
                    borderRadius: 0.5,
                    opacity: 0.7
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Latest: {formatCurrency(portfolioData[portfolioData.length - 1]?.value || 0)}
            </Typography>
          </Box>
        </Box>

        {/* Recent Trades */}
        {recentTrades.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Recent Trades
            </Typography>
            <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
              {recentTrades.map((trade, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2">
                    {trade.pair} {trade.direction}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={trade.pnl >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(trade.pnl)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioChart;