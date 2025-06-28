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
  Alert,
  AlertTitle,
  Badge
} from '@mui/material';
import {
  Notifications,
  TrendingUp,
  Warning,
  ExpandMore,
  ExpandLess,
  Clear
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
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket('ws://localhost:8000/api/ws/alerts');
    
    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const alertData = JSON.parse(event.data);
      const newAlert: AlertData = {
        id: Date.now().toString(),
        type: alertData.type,
        message: alertData.message,
        timestamp: alertData.timestamp,
        data: alertData.data,
        read: false
      };
      
      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep last 10 alerts
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
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

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

  const clearAllAlerts = () => {
    setAlerts([]);
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
          <Box>
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        }
      />
      <Collapse in={expanded}>
        <CardContent>
          {alerts.length === 0 ? (
            <Typography variant="body2" color="textSecondary" align="center">
              No alerts yet. Alerts will appear here when signals are generated or risk events occur.
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
          
          {alerts.length > 0 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Chip
                label="Clear All"
                onClick={clearAllAlerts}
                color="default"
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default LiveAlerts; 