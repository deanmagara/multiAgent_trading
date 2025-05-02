import { DatePicker } from '@mui/x-date-pickers'
import { TextField, TextFieldProps } from '@mui/material'
import { runBacktest } from '../services/api'

interface BacktestParams {
  strategy: string
  symbol: string
  startDate: Date
  endDate: Date
  initialCapital: number
}

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
    // Handle results
  }

  eturn (
    <DatePicker
      label="Start Date"
      value={params.startDate}
      onChange={(newValue) => {
        if (newValue) setParams({...params, startDate: newValue});
      }}
      renderInput={(params) => <TextField {...params} />}
    />
  )
}