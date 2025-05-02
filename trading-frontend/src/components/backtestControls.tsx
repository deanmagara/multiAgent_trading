import { useState } from 'react'
import { 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  Paper,
  Typography
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { runBacktest } from '../services/api'

export function BacktestControls() {
  const [params, setParams] = useState({
    strategy: 'mean-reversion',
    symbol: 'AAPL',
    startDate: new Date('2020-01-01'),
    endDate: new Date(),
    initialCapital: 10000
  })

  const handleRun = async () => {
    const results = await runBacktest(params)
    // Handle results (update state/context)
  }

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Backtest Parameters</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Strategy</InputLabel>
            <Select
              value={params.strategy}
              onChange={(e) => setParams({...params, strategy: e.target.value})}
            >
              <MenuItem value="mean-reversion">Mean Reversion</MenuItem>
              <MenuItem value="trend-following">Trend Following</MenuItem>
              <MenuItem value="ml-strategy">ML Strategy</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Symbol"
            value={params.symbol}
            onChange={(e) => setParams({...params, symbol: e.target.value})}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Start Date"
            value={params.startDate}
            onChange={(date) => setParams({...params, startDate: date})}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="End Date"
            value={params.endDate}
            onChange={(date) => setParams({...params, endDate: date})}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={handleRun}
          >
            Run Backtest
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )
}