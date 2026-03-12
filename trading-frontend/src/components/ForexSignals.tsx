import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Box,
  Grid,
  LinearProgress,
  IconButton,
  Collapse
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ExpandMore,
  ExpandLess,
  BarChart
} from '@mui/icons-material';
import { Signal } from '../types';

interface ForexSignalsProps {
  signals?: Signal[];
  isLoading?: boolean;
  onSignalSelect?: (signal: Signal) => void;
}

const ForexSignals: React.FC<ForexSignalsProps> = ({ 
  signals = [], 
  isLoading = false,
  onSignalSelect 
}) => {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [expandedSignals, setExpandedSignals] = useState<Set<number>>(new Set());

  const getDirectionIcon = (direction: string) => {
    return direction === 'buy' ? (
      <TrendingUp color="success" />
    ) : (
      <TrendingDown color="error" />
    );
  };

  const getRecommendationChip = (recommendation: string) => {
    switch (recommendation) {
      case 'strong':
        return <Chip label="Strong" color="success" size="small" />;
      case 'moderate':
        return <Chip label="Moderate" color="warning" size="small" />;
      case 'weak':
        return <Chip label="Weak" color="warning" size="small" />;
      case 'reject':
        return <Chip label="Reject" color="error" size="small" />;
      default:
        return <Chip label="Unknown" variant="outlined" size="small" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success.main';
    if (confidence >= 0.6) return 'warning.main';
    return 'error.main';
  };

  const handleSignalClick = (signal: Signal, index: number) => {
    setSelectedSignal(signal);
    onSignalSelect?.(signal);
    
    // Toggle expansion
    const newExpanded = new Set(expandedSignals);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSignals(newExpanded);
  };

  // Debug logging
  console.log('ForexSignals component:', {
    signals,
    signalsLength: signals.length,
    isLoading,
    selectedSignal
  });

  if (!signals || signals.length === 0) {
    return (
      <Card>
        <CardHeader title="Forex Signals" />
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            {isLoading ? 'Loading signals...' : 'No signals available for the selected pair'}
          </Typography>
          {!isLoading && (
            <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
              Try selecting a different currency pair or check back later.
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Forex Signals" />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[...Array(3)].map((_, i) => (
              <Box key={i} sx={{ height: 80, bgcolor: 'grey.200', borderRadius: 1 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart />
            <Typography variant="h6">Forex Signals ({signals.length})</Typography>
          </Box>
        }
      />
      <CardContent>
        {signals.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No signals available
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {signals.map((signal, index) => (
              <Card 
                key={index} 
                variant="outlined"
                sx={{ 
                  cursor: 'pointer',
                  borderColor: selectedSignal === signal ? 'primary.main' : 'grey.300',
                  bgcolor: selectedSignal === signal ? 'primary.50' : 'background.paper'
                }}
                onClick={() => handleSignalClick(signal, index)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6">{signal.pair}</Typography>
                      {getDirectionIcon(signal.direction)}
                      {getRecommendationChip(signal.recommendation)}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(signal.timestamp).toLocaleString()}
                      </Typography>
                      <IconButton size="small">
                        {expandedSignals.has(index) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Entry Price</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {signal.entry_price.toFixed(5)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Stop Loss</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        {signal.stop_loss.toFixed(5)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Take Profit</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {signal.take_profit.toFixed(5)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Position Size</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {signal.position_size.toFixed(0)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Confidence and Strength */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Confidence</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(signal.confidence * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={signal.confidence * 100}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: 'grey.300',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getConfidenceColor(signal.confidence)
                        }
                      }}
                    />
                  </Box>

                  {/* Expanded Details */}
                  <Collapse in={expandedSignals.has(index)}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'grey.300' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>Confidence Breakdown</Typography>
                          {signal.confidence_breakdown && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">Technical</Typography>
                                <Typography variant="caption">{Math.round(signal.confidence_breakdown.technical * 100)}%</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">Fundamental</Typography>
                                <Typography variant="caption">{Math.round(signal.confidence_breakdown.fundamental * 100)}%</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">Sentiment</Typography>
                                <Typography variant="caption">{Math.round(signal.confidence_breakdown.sentiment * 100)}%</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">Volatility</Typography>
                                <Typography variant="caption">{Math.round(signal.confidence_breakdown.volatility * 100)}%</Typography>
                              </Box>
                            </Box>
                          )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>Technical Analysis</Typography>
                          {signal.analysis && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">RSI</Typography>
                                <Typography variant="caption">{signal.analysis.rsi}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">MACD</Typography>
                                <Typography variant="caption">{signal.analysis.macd}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">BB Position</Typography>
                                <Typography variant="caption">{signal.analysis.bollinger_position}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">Trend Strength</Typography>
                                <Typography variant="caption">{signal.analysis.trend_strength}</Typography>
                              </Box>
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ForexSignals;
