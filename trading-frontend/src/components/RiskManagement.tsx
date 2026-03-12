import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle,
  TextField,
  Button,
  IconButton
} from '@mui/material';
import {
  Shield,
  Warning,
  Flag,
  TrendingUp,
  Edit,
  Save
} from '@mui/icons-material';

interface RiskParameters {
  max_risk_per_trade: number;
  max_portfolio_risk: number;
  stop_loss_pips: number;
  take_profit_pips: number;
  max_correlation: number;
  max_positions: number;
}

interface Position {
  pair: string;
  position_size: number;
  risk_amount: number;
  entry_price: number;
  stop_loss: number;
  direction: string;
}

const RiskManagement: React.FC<{
  accountBalance?: number;
  activePositions?: Position[];
  riskParams?: RiskParameters;
  onRiskParamsChange?: (params: RiskParameters) => void;
}> = ({
  accountBalance = 10000,
  activePositions = [],
  riskParams,
  onRiskParamsChange
}) => {
  const [localRiskParams, setLocalRiskParams] = useState<RiskParameters>(
    riskParams || {
      max_risk_per_trade: 0.02,
      max_portfolio_risk: 0.06,
      stop_loss_pips: 50,
      take_profit_pips: 100,
      max_correlation: 0.7,
      max_positions: 5
    }
  );

  const [isEditing, setIsEditing] = useState(false);

  const totalPortfolioRisk = activePositions.reduce((sum, pos) => sum + pos.risk_amount, 0);
  const portfolioRiskPercentage = (totalPortfolioRisk / accountBalance) * 100;
  const maxRiskPerTrade = accountBalance * localRiskParams.max_risk_per_trade;

  const riskWarnings = [
    {
      condition: portfolioRiskPercentage > localRiskParams.max_portfolio_risk * 100,
      message: "Portfolio risk exceeds maximum allowed",
      severity: "error" as const
    },
    {
      condition: activePositions.length >= localRiskParams.max_positions,
      message: "Maximum number of positions reached",
      severity: "warning" as const
    },
    {
      condition: portfolioRiskPercentage > localRiskParams.max_portfolio_risk * 80,
      message: "Portfolio risk approaching limit",
      severity: "info" as const
    }
  ];

  const activeWarnings = riskWarnings.filter(warning => warning.condition);

  const handleParamChange = (key: keyof RiskParameters, value: number) => {
    const newParams = { ...localRiskParams, [key]: value };
    setLocalRiskParams(newParams);
    onRiskParamsChange?.(newParams);
  };

  return (
    <Card>
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield />
            <Typography variant="h6">Risk Management</Typography>
            <IconButton
              size="small"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <Save /> : <Edit />}
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        {/* Risk Parameters */}
        {isEditing && (
          <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Risk per Trade (%)"
                  type="number"
                  value={localRiskParams.max_risk_per_trade * 100}
                  onChange={(e) => handleParamChange('max_risk_per_trade', parseFloat(e.target.value) / 100)}
                  inputProps={{ step: 0.1 }}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Portfolio Risk (%)"
                  type="number"
                  value={localRiskParams.max_portfolio_risk * 100}
                  onChange={(e) => handleParamChange('max_portfolio_risk', parseFloat(e.target.value) / 100)}
                  inputProps={{ step: 0.1 }}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Stop Loss (Pips)"
                  type="number"
                  value={localRiskParams.stop_loss_pips}
                  onChange={(e) => handleParamChange('stop_loss_pips', parseFloat(e.target.value))}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Take Profit (Pips)"
                  type="number"
                  value={localRiskParams.take_profit_pips}
                  onChange={(e) => handleParamChange('take_profit_pips', parseFloat(e.target.value))}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Positions"
                  type="number"
                  value={localRiskParams.max_positions}
                  onChange={(e) => handleParamChange('max_positions', parseInt(e.target.value))}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Correlation"
                  type="number"
                  value={localRiskParams.max_correlation}
                  onChange={(e) => handleParamChange('max_correlation', parseFloat(e.target.value))}
                  inputProps={{ step: 0.1 }}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Current Risk Status */}
        <Typography variant="h6" sx={{ mb: 2 }}>Current Risk Status</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                ${accountBalance.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">Account Balance</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                ${maxRiskPerTrade.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Max Risk per Trade</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {activePositions.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">Active Positions</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h4" color="secondary.main" fontWeight="bold">
                ${totalPortfolioRisk.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total Risk</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Portfolio Risk Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2">Portfolio Risk</Typography>
            <Typography variant="body2" fontWeight="bold">{portfolioRiskPercentage.toFixed(2)}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(portfolioRiskPercentage / (localRiskParams.max_portfolio_risk * 100)) * 100} 
            sx={{ height: 12, borderRadius: 6 }}
          />
          <Typography variant="caption" color="text.secondary">
            Target: &lt; {(localRiskParams.max_portfolio_risk * 100).toFixed(1)}%
          </Typography>
        </Box>

        {/* Risk Warnings */}
        {activeWarnings.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="error" />
              Risk Warnings
            </Typography>
            {activeWarnings.map((warning, index) => (
              <Alert key={index} severity={warning.severity} sx={{ mb: 1 }}>
                {warning.message}
              </Alert>
            ))}
          </Box>
        )}

        {/* Active Positions */}
        {activePositions.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Active Positions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {activePositions.map((position, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip 
                      label={position.direction.toUpperCase()} 
                      color={position.direction === 'buy' ? 'success' : 'error'}
                      size="small"
                    />
                    <Typography variant="body2" fontWeight="medium">{position.pair}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold">${position.risk_amount.toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(position.risk_amount / accountBalance * 100).toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskManagement; 