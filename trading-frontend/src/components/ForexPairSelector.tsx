import React from 'react';
import { MenuItem, Select, InputLabel, FormControl } from '@mui/material';

const FOREX_PAIRS = [
  { label: "EUR/USD", value: "EURUSD=X" },
  { label: "GBP/USD", value: "GBPUSD=X" },
  { label: "USD/JPY", value: "USDJPY=X" },
  { label: "USD/CHF", value: "USDCHF=X" },
  { label: "AUD/USD", value: "AUDUSD=X" },
  { label: "USD/CAD", value: "USDCAD=X" },
  { label: "NZD/USD", value: "NZDUSD=X" },
];

interface ForexPairSelectorProps {
  value: string;
  onChange: (pair: string) => void;
}

const ForexPairSelector: React.FC<ForexPairSelectorProps> = ({ value, onChange }) => (
  <FormControl fullWidth>
    <InputLabel id="forex-pair-label">Forex Pair</InputLabel>
    <Select
      labelId="forex-pair-label"
      value={value}
      label="Forex Pair"
      onChange={e => onChange(e.target.value as string)}
    >
      {FOREX_PAIRS.map(pair => (
        <MenuItem key={pair.value} value={pair.value}>{pair.label}</MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default ForexPairSelector;