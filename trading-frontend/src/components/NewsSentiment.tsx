import React from 'react';

interface NewsSentimentProps {
  pair?: string;
}

const NewsSentiment: React.FC<NewsSentimentProps> = ({ pair = 'EUR/USD' }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">News Sentiment - {pair}</h3>
      <div className="text-gray-600">
        <p>News sentiment analysis will be displayed here.</p>
      </div>
    </div>
  );
};

export default NewsSentiment;