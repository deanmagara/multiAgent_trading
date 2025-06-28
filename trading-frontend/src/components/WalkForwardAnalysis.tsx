import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  LinearProgress,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Assessment, Timeline } from '@mui/icons-material';

interface WalkForwardResult {
  window_id: number;
  train_start: string;
  train_end: string;
  test_start: string;
  test_end: string;
  results: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    profit_factor: number;
    total_trades: number;
  };
}

interface AggregatedResults {
  total_return: { mean: number; std: number; min: number; max: number; median: number };
  sharpe_ratio: { mean: number; std: number; min: number; max: number; median: number };
  max_drawdown: { mean: number; std: number; min: number; max: number; median: number };
  win_rate: { mean: number; std: number; min: number; max: number; median: number };
  profit_factor: { mean: number; std: number; min: number; max: number; median: number };
}

interface WalkForwardData {
  windows: WalkForwardResult[];
  aggregated: AggregatedResults;
  summary: {
    total_windows: number;
    consistency_score: number;
    robustness_rating: string;
    recommendation: string;
  };
}

const WalkForwardAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WalkForwardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [params, setParams] = useState({
    symbol: 'EURUSD',
    start_date: '2020-01-01',
    end_date: '2024-01-01',
    train_period_days: 252,
    test_period_days: 63,
    step_days: 21
  });

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/walk-forward-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to run analysis');
    } finally {
      setLoading(false);
    }
  };

  const getColorForRating = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'success';
      case 'Good': return 'info';
      case 'Fair': return 'warning';
      case 'Poor': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader
        title="Walk-Forward Analysis"
        subheader="Test strategy robustness across multiple time periods"
        avatar={<Assessment />}
      />
      <CardContent>
        {/* Parameters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Symbol"
              value={params.symbol}
              onChange={(e) => setParams({...params, symbol: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={params.start_date}
              onChange={(e) => setParams({...params, start_date: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={params.end_date}
              onChange={(e) => setParams({...params, end_date: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Train Period (days)"
              type="number"
              value={params.train_period_days}
              onChange={(e) => setParams({...params, train_period_days: parseInt(e.target.value)})}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Test Period (days)"
              type="number"
              value={params.test_period_days}
              onChange={(e) => setParams({...params, test_period_days: parseInt(e.target.value)})}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Step Size (days)"
              type="number"
              value={params.step_days}
              onChange={(e) => setParams({...params, step_days: parseInt(e.target.value)})}
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          onClick={runAnalysis}
          disabled={loading}
          startIcon={<Timeline />}
          sx={{ mb: 3 }}
        >
          {loading ? 'Running Analysis...' : 'Run Walk-Forward Analysis'}
        </Button>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {results && (
          <Box>
            {/* Summary */}
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Analysis Summary" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="h6">{results.summary.total_windows}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Windows</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="h6">{(results.summary.consistency_score * 100).toFixed(1)}%</Typography>
                    <Typography variant="body2" color="textSecondary">Consistency Score</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="h6" color={getColorForRating(results.summary.robustness_rating)}>
                      {results.summary.robustness_rating}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Robustness Rating</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      {results.summary.recommendation}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Aggregated Results */}
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Aggregated Results" />
              <CardContent>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell>Mean</TableCell>
                        <TableCell>Std Dev</TableCell>
                        <TableCell>Min</TableCell>
                        <TableCell>Max</TableCell>
                        <TableCell>Median</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(results.aggregated).map(([metric, stats]) => (
                        <TableRow key={metric}>
                          <TableCell>{metric.replace('_', ' ').toUpperCase()}</TableCell>
                          <TableCell>{(stats.mean * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(stats.std * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(stats.min * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(stats.max * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(stats.median * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Individual Windows */}
            <Card>
              <CardHeader title="Individual Window Results" />
              <CardContent>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Window</TableCell>
                        <TableCell>Test Period</TableCell>
                        <TableCell>Return</TableCell>
                        <TableCell>Sharpe</TableCell>
                        <TableCell>Max DD</TableCell>
                        <TableCell>Win Rate</TableCell>
                        <TableCell>Trades</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.windows.map((window) => (
                        <TableRow key={window.window_id}>
                          <TableCell>{window.window_id}</TableCell>
                          <TableCell>{window.test_start} to {window.test_end}</TableCell>
                          <TableCell>{(window.results.total_return * 100).toFixed(2)}%</TableCell>
                          <TableCell>{window.results.sharpe_ratio.toFixed(2)}</TableCell>
                          <TableCell>{(window.results.max_drawdown * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(window.results.win_rate * 100).toFixed(1)}%</TableCell>
                          <TableCell>{window.results.total_trades}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WalkForwardAnalysis; 