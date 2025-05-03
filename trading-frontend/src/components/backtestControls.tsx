import React, { useState } from 'react'; // Add React import
import { DatePicker } from '@mui/x-date-pickers';
import { TextField, TextFieldProps } from '@mui/material';

interface BacktestParams {
  strategy: string;
  symbol: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
}

export function BacktestControls() {
  const [params, setParams] = useState<BacktestParams>({ // Fix useState usage
    strategy: 'mean-reversion',
    symbol: 'AAPL',
    startDate: new Date('2020-01-01'),
    endDate: new Date(),
    initialCapital: 10000
  });

  return ( // Fixed typo in 'return'
    <DatePicker
      label="Start Date"
      value={params.startDate}
      onChange={(newValue: Date | null) => {
        if (newValue) setParams({...params, startDate: newValue});
      }}
      slots={{
        textField: (params: TextFieldProps) => <TextField {...params} /> // Updated render prop
      }}
    />
  );
}