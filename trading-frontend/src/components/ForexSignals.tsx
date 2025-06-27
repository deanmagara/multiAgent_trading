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
  Alert,
  AlertTitle,
  IconButton,
  Collapse
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ExpandMore,
  ExpandLess,
  BarChart,
  Timeline,
  Flag,
  Chat,
  FlashOn
} from '@mui/icons-material';

interface Signal {
  pair: string;
  direction: 'buy' | 'sell';
  strength: number;
  confidence: number;
  confidence_breakdown?: {
    technical: number;
    fundamental: number;
    sentiment: number;
    volatility: number;
  };
  recommendation: 'strong' | 'weak' | 'reject';
  timestamp: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_amount: number;
  position_size: number;
}

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

  if (!signals || signals.length === 0) {
    return (
      <Card>
        <CardHeader title="Forex Signals" />
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            No signals available for the selected pair
          </Typography>
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
                        {signal.position_size.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Collapse in={expandedSignals.has(index)}>
                    <Box sx={{ mt: 2 }}>
                      {/* Signal Confidence */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" fontWeight="medium">Signal Confidence</Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={getConfidenceColor(signal.confidence)}
                        >
                          {(signal.confidence * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      
                      {/* Confidence Breakdown */}
                      {signal.confidence_breakdown && (
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <Timeline fontSize="small" />
                              <Typography variant="caption">Technical</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={signal.confidence_breakdown.technical * 100} 
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption">
                              {(signal.confidence_breakdown.technical * 100).toFixed(0)}%
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <Flag fontSize="small" />
                              <Typography variant="caption">Fundamental</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={signal.confidence_breakdown.fundamental * 100} 
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption">
                              {(signal.confidence_breakdown.fundamental * 100).toFixed(0)}%
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <Chat fontSize="small" />
                              <Typography variant="caption">Sentiment</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={signal.confidence_breakdown.sentiment * 100} 
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption">
                              {(signal.confidence_breakdown.sentiment * 100).toFixed(0)}%
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <FlashOn fontSize="small" />
                              <Typography variant="caption">Volatility</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={signal.confidence_breakdown.volatility * 100} 
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption">
                              {(signal.confidence_breakdown.volatility * 100).toFixed(0)}%
                            </Typography>
                          </Grid>
                        </Grid>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          Risk Amount: ${signal.risk_amount.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Strength: {(signal.strength * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Collapse>

                  {signal.recommendation === 'reject' && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <AlertTitle>Signal Rejected</AlertTitle>
                      Signal rejected due to low confidence or risk management rules
                    </Alert>
                  )}
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
