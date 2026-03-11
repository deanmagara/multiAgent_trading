import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Collapse,
  Badge,
  Button,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Notifications,
  TrendingUp,
  Warning,
  ExpandMore,
  ExpandLess,
  Clear,
  Refresh,
  PlayArrow,
  Stop
} from '@mui/icons-material';

interface AlertData {
  id: string;
  type: 'signal' | 'risk' | 'info';
  message: string;
  timestamp: string;
  data?: any;
  read: boolean;
}

const LiveAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const signalIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:8000/api/ws/alerts');
      
      ws.onopen = () => {
        setConnected(true);
        console.log('WebSocket connected for alerts');
        
        // Add a test alert when connected
        const testAlert: AlertData = {
          id: Date.now().toString(),
          type: 'info',
          message: 'Live alerts system connected successfully!',
          timestamp: new Date().toISOString(),
          read: false
        };
        setAlerts(prev => [testAlert, ...prev.slice(0, 9)]);
      };
      
      ws.onmessage = (event) => {
        try {
          const alertData = JSON.parse(event.data);
          const newAlert: AlertData = {
            id: Date.now().toString(),
            type: alertData.type || 'info',
            message: alertData.message || 'New alert received',
            timestamp: alertData.timestamp || new Date().toISOString(),
            data: alertData.data,
            read: false
          };
          
          setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep last 10 alerts
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        setConnected(false);
        console.log('WebSocket disconnected');
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (signalIntervalRef.current) {
        clearInterval(signalIntervalRef.current);
      }
    };
  }, [connectWebSocket]);

  // Auto-generate signals
  useEffect(() => {
    if (autoGenerate) {
      signalIntervalRef.current = setInterval(generateRealSignals, 300000); // Every 5 minutes
    } else {
      if (signalIntervalRef.current) {
        clearInterval(signalIntervalRef.current);
        signalIntervalRef.current = null;
      }
    }

    return () => {
      if (signalIntervalRef.current) {
        clearInterval(signalIntervalRef.current);
      }
    };
  }, [autoGenerate]);

  const generateRealSignals = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/real-time-signals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.signals.length > 0) {
          console.log('Generated real-time signals:', result.signals.length);
        }
      }
    } catch (error) {
      console.error('Failed to generate real signals:', error);
    }
  };

  const testAlert = async () => {
    setLoading(true);
    try {
      // Test the alert endpoint
      await fetch('http://localhost:8000/api/alerts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Add a manual test alert
      const testAlert: AlertData = {
        id: Date.now().toString(),
        type: 'signal',
        message: 'Test EUR/USD buy signal generated',
        timestamp: new Date().toISOString(),
        data: {
          pair: 'EUR/USD',
          direction: 'buy',
          strength: 0.85,
          confidence: 0.92
        },
        read: false
      };
      setAlerts(prev => [testAlert, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Failed to test alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const clearAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'signal':
        return <TrendingUp color="primary" />;
      case 'risk':
        return <Warning color="error" />;
      default:
        return <Notifications color="info" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'signal':
        return 'primary';
      case 'risk':
        return 'error';
      default:
        return 'default';
    }
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
            <Typography variant="h6" sx={{ ml: 1 }}>
              Live Alerts
            </Typography>
            <Chip 
              label={connected ? 'Connected' : 'Disconnected'} 
              color={connected ? 'success' : 'error'}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>
        }
        action={
          <Box display="flex" alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={autoGenerate}
                  onChange={(e) => setAutoGenerate(e.target.checked)}
                  color="primary"
                />
              }
              label={autoGenerate ? <Stop /> : <PlayArrow />}
              sx={{ mr: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={testAlert}
              disabled={loading}
              startIcon={<Refresh />}
              sx={{ mr: 1 }}
            >
              Test Alert
            </Button>
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        }
      />
      <Collapse in={expanded}>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Auto-generate signals: {autoGenerate ? 'ON' : 'OFF'}
            </Typography>
            {autoGenerate && (
              <Typography variant="caption" color="textSecondary">
                Generating signals every 5 minutes...
              </Typography>
            )}
          </Box>
          
          {alerts.length === 0 ? (
            <Typography variant="body2" color="textSecondary" align="center">
              No alerts yet. Click "Test Alert" to generate a sample alert.
            </Typography>
          ) : (
            <List>
              {alerts.map((alert) => (
                <ListItem
                  key={alert.id}
                  sx={{
                    backgroundColor: alert.read ? 'transparent' : 'action.hover',
                    borderLeft: `4px solid ${
                      alert.type === 'signal' ? 'primary.main' : 
                      alert.type === 'risk' ? 'error.main' : 'info.main'
                    }`,
                    mb: 1
                  }}
                >
                  <ListItemIcon>
                    {getIconForType(alert.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.message}
                    secondary={new Date(alert.timestamp).toLocaleString()}
                    onClick={() => markAsRead(alert.id)}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label={alert.type}
                    color={getColorForType(alert.type)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => clearAlert(alert.id)}
                  >
                    <Clear />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default LiveAlerts; 