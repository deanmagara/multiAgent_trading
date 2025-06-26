import React from 'react';
import { useTradingContext } from '../context/tradingContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';

const PortfolioChart: React.FC = () => {
    const { latestResults, isConnecting } = useTradingContext();

    const chartData = latestResults
        ? Object.entries(latestResults)
            .filter(([key]) => key !== 'allocations')
            .map(([agentName, performance]) => ({
                name: agentName,
                'Final Value': (performance as any).final_portfolio_value,
            }))
        : [];

    const renderContent = () => {
        if (isConnecting) {
            return <Box display="flex" justifyContent="center" alignItems="center" height="100%"><CircularProgress /></Box>;
        }
        if (!latestResults) {
            return <Box display="flex" justifyContent="center" alignItems="center" height="100%"><Typography>Run an analysis to see agent performance.</Typography></Box>;
        }
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                        tickFormatter={(value) =>
                            new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                notation: 'compact',
                            }).format(value)
                        }
                    />
                    <Tooltip
                        formatter={(value: number) => [
                            new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                            }).format(value),
                            'Final Value'
                        ]}
                    />
                    <Legend />
                    <Bar dataKey="Final Value" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
                Agent Performance
            </Typography>
            <Box sx={{ height: 'calc(100% - 48px)' }}>
                {renderContent()}
            </Box>
        </Paper>
    );
  };

export default PortfolioChart;