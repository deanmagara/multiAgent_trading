declare module '@nivo/line' {
    import { ComponentType } from 'react'
    interface ResponsiveLineProps {
      data: any
      margin?: { top: number; right: number; bottom: number; left: number }
      xScale?: any
      yScale?: any
      axisLeft?: any
      tooltip?: any
    }
    export const ResponsiveLine: ComponentType<ResponsiveLineProps>
  }