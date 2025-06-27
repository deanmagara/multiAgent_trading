import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Flag,
  Warning
} from '@mui/icons-material';

interface PerformanceMetricsData {
  total_trades?: number;
  win_rate?: number;
  profit_factor?: number;
  sharpe_ratio?: number;
  max_drawdown?: {
    max_drawdown_pct?: number;
  };
  risk_adjusted_return?: number;
  total_return?: number;
  current_capital?: number;
  average_trade_duration?: string;
}

interface ProfitabilityTargets {
  sharpe_ratio_target: boolean;
  max_drawdown_target: boolean;
  win_rate_target: boolean;
  profit_factor_target: boolean;
}

const PerformanceMetrics: React.FC<{ 
  metrics?: PerformanceMetricsData; 
  isLoading?: boolean; 
}> = ({ metrics, isLoading = false }) => {
  const [targets, setTargets] = useState<ProfitabilityTargets | null>(null);

  useEffect(() => {
    if (metrics) {
      setTargets({
        sharpe_ratio_target: (metrics.sharpe_ratio || 0) > 1.5,
        max_drawdown_target: (metrics.max_drawdown?.max_drawdown_pct || 0) < 15.0,
        win_rate_target: (metrics.win_rate || 0) > 0.55,
        profit_factor_target: (metrics.profit_factor || 0) > 1.5
      });
    }
  }, [metrics]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Performance Metrics" />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[...Array(6)].map((_, i) => (
              <Box key={i} sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader title="Performance Metrics" />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No performance data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getMetricColor = (value: number, target: number, higherIsBetter: boolean = true) => {
    if (higherIsBetter) {
      return value >= target ? 'success.main' : 'error.main';
    } else {
      return value <= target ? 'success.main' : 'error.main';
    }
  };

  const getTargetIcon = (achieved: boolean) => {
    return achieved ? (
      <Flag color="success" fontSize="small" />
    ) : (
      <Warning color="error" fontSize="small" />
    );
  };

  // Helper function to safely format numbers
  const safeToFixed = (value: number | undefined, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00';
    }
    return value.toFixed(decimals);
  };

  // Helper function to safely get number values
  const safeNumber = (value: number | undefined): number => {
    return value || 0;
  };

  return (
    <Card>
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Performance Metrics</Typography>
            <Chip 
              label={targets && Object.values(targets).every(t => t) ? "All Targets Met" : "Targets Pending"}
              color={targets && Object.values(targets).every(t => t) ? "success" : "error"}
              size="small"
            />
          </Box>
        }
      />
      <CardContent>
        {/* Key Metrics Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {safeNumber(metrics.total_trades)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total Trades</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                color={getMetricColor(safeNumber(metrics.win_rate) * 100, 55)}
                fontWeight="bold"
              >
                {safeToFixed(safeNumber(metrics.win_rate) * 100, 1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Win Rate</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                color={getMetricColor(safeNumber(metrics.profit_factor), 1.5)}
                fontWeight="bold"
              >
                {safeToFixed(safeNumber(metrics.profit_factor), 2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Profit Factor</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                color={getMetricColor(safeNumber(metrics.total_return) * 100, 0)}
                fontWeight="bold"
              >
                {safeToFixed(safeNumber(metrics.total_return) * 100, 1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Total Return</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Risk Metrics */}
        <Typography variant="h6" sx={{ mb: 2 }}>Risk Metrics</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Sharpe Ratio</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={getMetricColor(safeNumber(metrics.sharpe_ratio), 1.5)}
                  >
                    {safeToFixed(safeNumber(metrics.sharpe_ratio), 2)}
                  </Typography>
                  {targets && getTargetIcon(targets.sharpe_ratio_target)}
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(safeNumber(metrics.sharpe_ratio) / 3) * 100} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">Target: &gt; 1.5</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Max Drawdown</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={getMetricColor(safeNumber(metrics.max_drawdown?.max_drawdown_pct), 15, false)}
                  >
                    {safeToFixed(safeNumber(metrics.max_drawdown?.max_drawdown_pct), 1)}%
                  </Typography>
                  {targets && getTargetIcon(targets.max_drawdown_target)}
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(safeNumber(metrics.max_drawdown?.max_drawdown_pct) / 20) * 100} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">Target: &lt; 15%</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Profitability Targets */}
        <Typography variant="h6" sx={{ mb: 2 }}>Profitability Targets</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Alert severity={targets?.sharpe_ratio_target ? "success" : "error"}>
              <AlertTitle>Sharpe Ratio &gt; 1.5</AlertTitle>
              {targets?.sharpe_ratio_target ? "✅ Achieved" : "❌ Pending"}
            </Alert>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Alert severity={targets?.max_drawdown_target ? "success" : "error"}>
              <AlertTitle>Max Drawdown &lt; 15%</AlertTitle>
              {targets?.max_drawdown_target ? "✅ Achieved" : "❌ Pending"}
            </Alert>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Alert severity={targets?.win_rate_target ? "success" : "error"}>
              <AlertTitle>Win Rate &gt; 55%</AlertTitle>
              {targets?.win_rate_target ? "✅ Achieved" : "❌ Pending"}
            </Alert>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Alert severity={targets?.profit_factor_target ? "success" : "error"}>
              <AlertTitle>Profit Factor &gt; 1.5</AlertTitle>
              {targets?.profit_factor_target ? "✅ Achieved" : "❌ Pending"}
            </Alert>
          </Grid>
        </Grid>

        {/* Additional Metrics */}
        <Grid container spacing={2} sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">Risk-Adjusted Return</Typography>
            <Typography variant="h6">{safeToFixed(safeNumber(metrics.risk_adjusted_return), 2)}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">Current Capital</Typography>
            <Typography variant="h6">${safeNumber(metrics.current_capital).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">Avg Trade Duration</Typography>
            <Typography variant="h6">{metrics.average_trade_duration || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;