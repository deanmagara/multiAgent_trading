import { Grid, Paper, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '100%'
}))

export function PerformanceMetrics({ metrics }: {
  metrics: {
    sharpeRatio: number
    maxDrawdown: number
    totalReturn: number
    winRate: number
  }
}) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard>
          <Typography variant="subtitle2">Sharpe Ratio</Typography>
          <Typography variant="h4" color={metrics.sharpeRatio >= 1 ? 'success.main' : 'error.main'}>
            {metrics.sharpeRatio.toFixed(2)}
          </Typography>
        </MetricCard>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard>
          <Typography variant="subtitle2">Max Drawdown</Typography>
          <Typography variant="h4" color="error.main">
            {metrics.maxDrawdown.toFixed(2)}%
          </Typography>
        </MetricCard>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard>
          <Typography variant="subtitle2">Total Return</Typography>
          <Typography variant="h4" color={metrics.totalReturn >= 0 ? 'success.main' : 'error.main'}>
            {metrics.totalReturn.toFixed(2)}%
          </Typography>
        </MetricCard>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard>
          <Typography variant="subtitle2">Win Rate</Typography>
          <Typography variant="h4">
            {metrics.winRate.toFixed(2)}%
          </Typography>
        </MetricCard>
      </Grid>
    </Grid>
  )
}