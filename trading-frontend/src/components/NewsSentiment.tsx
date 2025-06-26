import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box, Chip, CircularProgress } from '@mui/material';

interface NewsSentimentProps {
  pair: string;
}

const NewsSentiment: React.FC<NewsSentimentProps> = ({ pair }) => {
  const [newsData, setNewsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pair) return;
    setLoading(true);
    fetch(`/api/news-sentiment/${pair}`)
      .then(res => res.json())
      .then(setNewsData)
      .finally(() => setLoading(false));
  }, [pair]);

  if (loading) return <CircularProgress />;
  if (!newsData) return null;

  const sentiment = newsData.sentiment_analysis || {};
  const getSentimentColor = (sentiment: string) => {
    switch ((sentiment || '').toLowerCase()) {
      case 'bullish': return 'success';
      case 'bearish': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>News Sentiment</Typography>
      <Box sx={{ mb: 2 }}>
        <Chip 
          label={sentiment.sentiment} 
          color={getSentimentColor(sentiment.sentiment)}
          sx={{ mr: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          Score: {sentiment.score?.toFixed(2)} | Confidence: {sentiment.confidence}%
        </Typography>
      </Box>
      <Typography variant="body2" gutterBottom>
        {sentiment.summary}
      </Typography>
    </Paper>
  );
};

export default NewsSentiment;