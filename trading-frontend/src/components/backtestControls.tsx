import React, { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import { TextField, TextFieldProps } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';

interface BacktestParams {
  strategy: string;
  symbol: string;
  startDate: Dayjs;
  endDate: Dayjs;
  initialCapital: number;
}

export function BacktestControls() {
  const [params, setParams] = useState<BacktestParams>({
    strategy: 'mean-reversion',
    symbol: 'AAPL',
    startDate: dayjs('2020-01-01'),
    endDate: dayjs(),
    initialCapital: 10000
  });

  return (
    <DatePicker
      label="Start Date"
      value={params.startDate}
      onChange={(newValue) => {
        if (newValue) setParams({ ...params, startDate: newValue });
      }}
      slots={{
        textField: (props: TextFieldProps) => <TextField {...props} />
      }}
    />
  );
}