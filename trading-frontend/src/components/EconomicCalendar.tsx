import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  AlertTitle,
  LinearProgress,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Event,
  Warning,
  Refresh,
  FilterList
} from '@mui/icons-material';

interface EconomicEvent {
  id: number;
  date: string;
  currency: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  previous: string | null;
  forecast: string | null;
  actual: string | null;
  description: string;
}

const EconomicCalendar: React.FC = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    currency: '',
    impact: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.currency) params.append('currency', filters.currency);
      if (filters.impact) params.append('impact', filters.impact);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await fetch(`http://localhost:8000/api/economic-calendar?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Failed to fetch economic calendar');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCurrencyFlag = (currency: string) => {
    const flags: { [key: string]: string } = {
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'GBP': '��🇧',
      'JPY': '🇯🇵',
      'CHF': '🇭🇾',
      'CAD': '🇨🇦',
      'AUD': '🇦🇺',
      'NZD': '🇳🇿'
    };
    return flags[currency] || currency;
  };

  const clearFilters = () => {
    setFilters({
      currency: '',
      impact: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const getHighImpactEvents = () => {
    return events.filter(event => event.impact === 'High');
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => new Date(event.date) > now);
  };

  const getPastEvents = () => {
    const now = new Date();
    return events.filter(event => new Date(event.date) <= now);
  };

  return (
    <Card>
      <CardHeader
        title="Economic Calendar"
        subheader="Upcoming economic events that may impact currency markets"
        avatar={<Event />}
        action={
          <Box>
            <Tooltip title="Toggle Filters">
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterList />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchEvents} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent>
        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">
                  {events.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="error">
                  {getHighImpactEvents().length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  High Impact
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="info">
                  {getUpcomingEvents().length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Upcoming
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  {getPastEvents().length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Past Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Collapse in={showFilters}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={filters.currency}
                      onChange={(e) => setFilters({...filters, currency: e.target.value})}
                      label="Currency"
                    >
                      <MenuItem value="">All Currencies</MenuItem>
                      <MenuItem value="USD">USD 🇺🇸</MenuItem>
                      <MenuItem value="EUR">EUR 🇪🇺</MenuItem>
                      <MenuItem value="GBP">GBP 🇬🇧</MenuItem>
                      <MenuItem value="JPY">JPY 🇯🇵</MenuItem>
                      <MenuItem value="CHF">CHF 🇭🇾</MenuItem>
                      <MenuItem value="CAD">CAD 🇨🇦</MenuItem>
                      <MenuItem value="AUD">AUD 🇦🇺</MenuItem>
                      <MenuItem value="NZD">NZD 🇳🇿</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Impact</InputLabel>
                    <Select
                      value={filters.impact}
                      onChange={(e) => setFilters({...filters, impact: e.target.value})}
                      label="Impact"
                    >
                      <MenuItem value="">All Impact Levels</MenuItem>
                      <MenuItem value="High">High Impact</MenuItem>
                      <MenuItem value="Medium">Medium Impact</MenuItem>
                      <MenuItem value="Low">Low Impact</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      onClick={clearFilters}
                      size="small"
                    >
                      Clear Filters
                    </Button>
                    <Button
                      variant="contained"
                      onClick={fetchEvents}
                      disabled={loading}
                      size="small"
                    >
                      Apply Filters
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {events.length === 0 && !loading ? (
          <Typography variant="body2" color="textSecondary" align="center">
            No economic events found for the selected criteria.
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Impact</TableCell>
                  <TableCell>Previous</TableCell>
                  <TableCell>Forecast</TableCell>
                  <TableCell>Actual</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => {
                  const eventDate = new Date(event.date);
                  const isPast = eventDate <= new Date();
                  const isUpcoming = eventDate > new Date();
                  
                  return (
                    <TableRow 
                      key={event.id}
                      sx={{
                        backgroundColor: isPast ? 'action.hover' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'action.selected'
                        }
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={isUpcoming ? 'bold' : 'normal'}>
                            {formatDate(event.date)}
                          </Typography>
                          {isUpcoming && (
                            <Chip 
                              label="Upcoming" 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {getCurrencyFlag(event.currency)}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {event.currency}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ maxWidth: 250 }}>
                            {event.event}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {event.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.impact}
                          color={getImpactColor(event.impact)}
                          size="small"
                          icon={event.impact === 'High' ? <Warning /> : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {event.previous || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {event.forecast || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={event.actual ? 'primary' : 'textSecondary'}
                          fontWeight={event.actual ? 'bold' : 'normal'}
                        >
                          {event.actual || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* High Impact Events Alert */}
        {getHighImpactEvents().length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>High Impact Events</AlertTitle>
            There are {getHighImpactEvents().length} high-impact economic events in the selected period. 
            Consider avoiding trading during these events to minimize risk.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default EconomicCalendar; 