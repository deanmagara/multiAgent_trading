import { ResponsiveLine } from '@nivo/line'
import { useTheme } from '@mui/material'

interface DataPoint {
  x: string
  y: number
}

export function PortfolioChart({ data }: { data: DataPoint[] }) {
  const theme = useTheme()
  
  return (
    <ResponsiveLine
      data={[{ id: 'portfolio', data }]}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: 'time', format: '%Y-%m-%d' }}
      xFormat="time:%Y-%m-%d"
      yScale={{ type: 'linear' }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        format: (value: number) => `$${value.toLocaleString()}`
      }}
      tooltip={({ point }: { point: { data: { xFormatted: string, yFormatted: string } }}) => (
        <div style={{ background: theme.palette.background.paper, padding: '8px 12px' }}>
          <strong>{point.data.xFormatted}</strong>
          <div>${point.data.yFormatted}</div>
        </div>
      )}
    />
  )
}