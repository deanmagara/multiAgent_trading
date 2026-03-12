import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  LinearProgress,
  Button
} from '@mui/material';
import {
  SentimentSatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  Article,
  Refresh
} from '@mui/icons-material';

interface NewsSentimentProps {
  pair?: string;
}

interface SentimentData {
  score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  articles: Array<{
    title: string;
    sentiment: string;
    impact: 'high' | 'medium' | 'low';
    timestamp: string;
  }>;
}

// New interface for the actual API response
interface NewsApiResponse {
  currency_pair: string;
  timestamp: string;
  news_count: number;
  sentiment_analysis: {
    sentiment: string;
    score: number;
    summary: string;
    confidence: number;
  };
  recent_articles: Array<{
    title: string;
    description: string;
    publishedAt: string;
    url: string;
  }>;
}

const NewsSentiment: React.FC<NewsSentimentProps> = ({ pair = 'EUR/USD' }) => {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock');

  const fetchSentiment = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(' Fetching sentiment data for:', pair);
      
      // Try real API first
      const response = await fetch(`http://localhost:8000/api/news-sentiment/${pair.replace('/', '')}`);
      console.log('📡 Sentiment API Response status:', response.status);
      
      if (response.ok) {
        const apiData: NewsApiResponse = await response.json();
        console.log('📊 Sentiment API Response data:', apiData);
        
        if (apiData && apiData.sentiment_analysis) {
          // Convert API response to frontend format
          const convertedData: SentimentData = {
            score: apiData.sentiment_analysis.score,
            sentiment: apiData.sentiment_analysis.sentiment === 'bullish' ? 'positive' : 
                      apiData.sentiment_analysis.sentiment === 'bearish' ? 'negative' : 'neutral',
            articles: apiData.recent_articles.map(article => ({
              title: article.title,
              sentiment: apiData.sentiment_analysis.sentiment === 'bullish' ? 'positive' : 
                        apiData.sentiment_analysis.sentiment === 'bearish' ? 'negative' : 'neutral',
              impact: 'medium' as const, // Default impact since API doesn't provide it
              timestamp: article.publishedAt
            }))
          };
          
          setSentimentData(convertedData);
          setLastUpdated(new Date());
          setDataSource('api');
          console.log('✅ Using real sentiment data');
          setLoading(false);
          return;
        } else {
          console.log('❌ Sentiment API missing sentiment_analysis, using mock data');
        }
      } else {
        console.log('❌ Sentiment API request failed, using mock data');
      }
      
      // Fallback to mock data
      const mockData: SentimentData = {
        score: 0.65,
        sentiment: 'positive',
        articles: [
          {
            title: 'ECB signals potential rate cuts in 2024',
            sentiment: 'positive',
            impact: 'high',
            timestamp: new Date().toISOString()
          },
          {
            title: 'US inflation data shows cooling trend',
            sentiment: 'positive',
            impact: 'medium',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            title: 'Fed officials maintain hawkish stance',
            sentiment: 'negative',
            impact: 'medium',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          },
          {
            title: 'Eurozone economic indicators improve',
            sentiment: 'positive',
            impact: 'low',
            timestamp: new Date(Date.now() - 10800000).toISOString()
          }
        ]
      };
      
      setSentimentData(mockData);
      setLastUpdated(new Date());
      setDataSource('mock');
      console.log('🎲 Using mock sentiment data');
      
    } catch (error) {
      console.error('💥 Error fetching sentiment data:', error);
      setError(`Failed to load sentiment data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchSentiment, 600000);
    return () => clearInterval(interval);
  }, [pair]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <SentimentSatisfied color="success" />;
      case 'negative':
        return <SentimentDissatisfied color="error" />;
      default:
        return <SentimentNeutral color="warning" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error && !sentimentData) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!sentimentData) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="textSecondary" align="center">
            Loading sentiment data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const sentiment = sentimentData.sentiment || 'neutral';
  const score = sentimentData.score || 0;

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <Article sx={{ mr: 1 }} />
            <Typography variant="h6">News Sentiment - {pair}</Typography>
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
              onClick={fetchSentiment}
              startIcon={<Refresh />}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Chip
              label={`${(score * 100).toFixed(0)}%`}
              color={getSentimentColor(sentiment)}
              icon={getSentimentIcon(sentiment)}
            />
          </Box>
        }
      />
      <CardContent>
        {lastUpdated && (
          <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Overall Sentiment Score
          </Typography>
          <Box display="flex" alignItems="center">
            <Box sx={{ flexGrow: 1, mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.abs(score) * 100}
                color={getSentimentColor(sentiment)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="body2">
              {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
            </Typography>
          </Box>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Recent News Articles
        </Typography>
        <List dense>
          {sentimentData.articles && sentimentData.articles.length > 0 ? (
            sentimentData.articles.map((article, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon>
                  {getSentimentIcon(article.sentiment || 'neutral')}
                </ListItemIcon>
                <ListItemText
                  primary={article.title}
                  secondary={new Date(article.timestamp).toLocaleString()}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <Chip
                  label={article.impact || 'medium'}
                  color={getImpactColor(article.impact || 'medium')}
                  size="small"
                />
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary" align="center">
              No news articles available
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default NewsSentiment;