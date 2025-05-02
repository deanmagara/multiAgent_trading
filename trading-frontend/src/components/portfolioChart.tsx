import { ResponsiveLine } from '@nivo/line'
import { useTheme } from '@mui/material'

export function PortfolioChart({ data }: { data: any[] }) {
  const theme = useTheme()

  return (
    <div style={{ height: 400 }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        colors={[theme.palette.primary.main]}
        enablePoints={false}
        useMesh={true}
        xScale={{ type: 'time', format: '%Y-%m-%d' }}
        xFormat="time:%Y-%m-%d"
        yScale={{ type: 'linear' }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          format: (value) => `$${value.toLocaleString()}`
        }}
        axisBottom={{
          format: '%b %d',
          tickValues: 'every 1 month'
        }}
        tooltip={({ point }) => (
          <div style={{ 
            background: theme.palette.background.paper,
            padding: '8px 12px',
            border: `1px solid ${theme.palette.divider}`
          }}>
            <strong>{point.data.xFormatted}</strong>
            <div>${point.data.yFormatted}</div>
          </div>
        )}
      />
    </div>
  )
}