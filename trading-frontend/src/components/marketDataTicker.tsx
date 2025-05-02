import { useEffect, useState } from 'react'
import { Typography, Paper } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { fetchMarketData } from '../services/api'

export function MarketDataTicker() {
  const { data, isSuccess } = useQuery({
    queryKey: ['market-data'],
    queryFn: fetchMarketData,
    refetchInterval: 10000 // 10 seconds
  })

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Market Overview</Typography>
      {isSuccess && (
        <div style={{ display: 'flex', overflowX: 'auto', gap: 20 }}>
          {data.map((stock: any) => (
            <div key={stock.symbol}>
              <Typography>{stock.symbol}</Typography>
              <Typography color={stock.change >= 0 ? 'success.main' : 'error.main'}>
                ${stock.price} ({stock.change >= 0 ? '+' : ''}{stock.change}%)
              </Typography>
            </div>
          ))}
        </div>
      )}
    </Paper>
  )
}