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
  Collapse,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ExpandMore,
  ExpandLess,
  SignalCellular4Bar,
  SignalCellular3Bar,
  SignalCellular2Bar,
  SignalCellular1Bar,
  AccessTime,
  Psychology,
  Analytics
} from '@mui/icons-material';

interface RealTimeSignal {
  pair: string;
  timestamp: string;
  ml_signal: {
    signal: string;
    confidence: number;
  };
  tech_signal: {
    direction: string;
    confidence: number;
  };
  combined_signal: {
    signal: string;
    confidence: number;
  };
}

interface RealTimeSignalsProps {
  signals: RealTimeSignal[];
  isConnected: boolean;
  error?: string;
}

const RealTimeSignals: React.FC<RealTimeSignalsProps> = ({ 
  signals, 
  isConnected, 
  error 
}) => {
  const [expandedSignals, setExpandedSignals] = useState<Set<number>>(new Set());

  const getSignalIcon = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'buy':
        return <TrendingUp color="success" />;
      case 'sell':
        return <TrendingDown color="error" />;
      default:
        return <TrendingDown color="disabled" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'buy':
        return 'success';
      case 'sell':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success.main';
    if (confidence >= 0.6) return 'warning.main';
    return 'error.main';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <SignalCellular4Bar />;
    if (confidence >= 0.6) return <SignalCellular3Bar />;
    if (confidence >= 0.4) return <SignalCellular2Bar />;
    return <SignalCellular1Bar />;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const handleSignalClick = (index: number) => {
    const newExpanded = new Set(expandedSignals);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSignals(newExpanded);
  };

  // Group signals by pair and get the latest for each
  const latestSignals = signals.reduce((acc, signal) => {
    acc[signal.pair] = signal;
    return acc;
  }, {} as Record<string, RealTimeSignal>);

  const signalList = Object.values(latestSignals);

  if (error) {
    return (
      <Card>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SignalCellular4Bar color="error" />
              <Typography variant="h6">Real-Time Signals</Typography>
            </Box>
          }
        />
        <CardContent>
          <Typography variant="body2" color="error" align="center">
            WebSocket error: {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SignalCellular4Bar color={isConnected ? "success" : "error"} />
            <Typography variant="h6">Real-Time Signals</Typography>
            <Chip 
              label={isConnected ? "Connected" : "Disconnected"} 
              color={isConnected ? "success" : "error"} 
              size="small" 
            />
          </Box>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime fontSize="small" />
            <Typography variant="caption">
              Last updated: {signalList.length > 0 ? formatTime(signalList[0].timestamp) : 'Never'}
            </Typography>
          </Box>
        }
      />
      <CardContent>
        {signalList.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SignalCellular1Bar sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {isConnected ? 'Waiting for signals...' : 'Disconnected'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {signalList.map((signal, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 2,
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handleSignalClick(index)}
                >
                  <CardContent>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {signal.pair}
                        </Typography>
                        {getSignalIcon(signal.combined_signal.signal)}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(signal.timestamp)}
                        </Typography>
                        <IconButton size="small">
                          {expandedSignals.has(index) ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Combined Signal */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {signal.combined_signal.signal.toUpperCase()}
                        </Typography>
                        <Chip 
                          label={`${Math.round(signal.combined_signal.confidence * 100)}%`}
                          color={getSignalColor(signal.combined_signal.signal) as any}
                          size="small"
                          icon={getConfidenceIcon(signal.combined_signal.confidence)}
                        />
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={signal.combined_signal.confidence * 100}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getConfidenceColor(signal.combined_signal.confidence)
                          }
                        }}
                      />
                    </Box>

                    {/* Signal Breakdown */}
                    <Collapse in={expandedSignals.has(index)}>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        
                        {/* ML Signal */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Psychology fontSize="small" color="primary" />
                            <Typography variant="caption" fontWeight="bold">ML Signal</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip 
                              label={signal.ml_signal.signal.toUpperCase()} 
                              color={getSignalColor(signal.ml_signal.signal) as any}
                              size="small"
                            />
                            <Typography variant="caption">
                              {Math.round(signal.ml_signal.confidence * 100)}%
                            </Typography>
                          </Box>
                        </Box>

                        {/* Technical Signal */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Analytics fontSize="small" color="secondary" />
                            <Typography variant="caption" fontWeight="bold">Technical Signal</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip 
                              label={signal.tech_signal.direction.toUpperCase()} 
                              color={getSignalColor(signal.tech_signal.direction) as any}
                              size="small"
                            />
                            <Typography variant="caption">
                              {Math.round(signal.tech_signal.confidence * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeSignals;