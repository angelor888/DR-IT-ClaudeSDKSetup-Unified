import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { format } from 'date-fns';
import { RevenueForecast, TimeSeriesData, Prediction } from '../../types/analytics';

interface RevenueForecastChartProps {
  forecast: RevenueForecast;
  historicalData?: TimeSeriesData[];
  height?: number;
  showConfidence?: boolean;
  onPeriodChange?: (period: RevenueForecast['period']) => void;
}

const RevenueForecastChart: React.FC<RevenueForecastChartProps> = ({
  forecast,
  historicalData = [],
  height = 400,
  showConfidence = true,
  onPeriodChange,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // Combine historical and forecast data
  const chartData = React.useMemo(() => {
    const historical = historicalData.map(d => ({
      date: format(d.date, 'MMM dd'),
      actual: d.value,
      forecast: null,
      upperBound: null,
      lowerBound: null,
    }));

    const predictions = forecast.predictions.map(p => ({
      date: format(p.date, 'MMM dd'),
      actual: null,
      forecast: p.value,
      upperBound: p.upperBound,
      lowerBound: p.lowerBound,
    }));

    return [...historical, ...predictions];
  }, [historicalData, forecast]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">{label}</Typography>
          {data.actual && (
            <Typography variant="body2" color="primary">
              Actual: {formatCurrency(data.actual)}
            </Typography>
          )}
          {data.forecast && (
            <Box>
              <Typography variant="body2" color="secondary">
                Forecast: {formatCurrency(data.forecast)}
              </Typography>
              {showConfidence && data.upperBound && data.lowerBound && (
                <Typography variant="caption" color="text.secondary">
                  Range: {formatCurrency(data.lowerBound)} - {formatCurrency(data.upperBound)}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      );
    }
    return null;
  };

  const trendIcon = forecast.trend.direction === 'increasing' 
    ? <TrendingUpIcon sx={{ color: 'success.main' }} />
    : forecast.trend.direction === 'decreasing'
    ? <TrendingDownIcon sx={{ color: 'error.main' }} />
    : null;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h6">Revenue Forecast</Typography>
            {trendIcon}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${forecast.trend.changeRate > 0 ? '+' : ''}${forecast.trend.changeRate.toFixed(1)}% trend`}
              size="small"
              color={forecast.trend.direction === 'increasing' ? 'success' : 'error'}
              variant="outlined"
            />
            {forecast.trend.seasonality && (
              <Chip
                label={`${forecast.trend.seasonality.pattern} pattern`}
                size="small"
                variant="outlined"
              />
            )}
            {forecast.accuracy && (
              <Chip
                label={`${(forecast.accuracy * 100).toFixed(0)}% accuracy`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        <Box>
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <MoreIcon />
          </IconButton>
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Confidence interval */}
          {showConfidence && (
            <Area
              type="monotone"
              dataKey="upperBound"
              stackId="1"
              stroke="none"
              fill="#82ca9d"
              fillOpacity={0.1}
            />
          )}
          
          {/* Historical data */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorActual)"
            strokeWidth={2}
            name="Actual Revenue"
          />
          
          {/* Forecast line */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#82ca9d"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            name="Forecast"
          />
          
          {/* Lower confidence bound */}
          {showConfidence && (
            <Line
              type="monotone"
              dataKey="lowerBound"
              stroke="#82ca9d"
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              opacity={0.5}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Key Factors */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Key Revenue Factors
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {forecast.factors.map((factor, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">{factor.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {factor.description}
                </Typography>
              </Box>
              <Chip
                label={`${factor.impact > 0 ? '+' : ''}${(factor.impact * 100).toFixed(0)}%`}
                size="small"
                color={factor.impact > 0 ? 'success' : 'error'}
                variant={Math.abs(factor.impact) > 0.5 ? 'filled' : 'outlined'}
              />
            </Box>
          ))}
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {onPeriodChange && (
          <>
            <MenuItem onClick={() => { onPeriodChange('daily'); setAnchorEl(null); }}>
              Daily Forecast
            </MenuItem>
            <MenuItem onClick={() => { onPeriodChange('weekly'); setAnchorEl(null); }}>
              Weekly Forecast
            </MenuItem>
            <MenuItem onClick={() => { onPeriodChange('monthly'); setAnchorEl(null); }}>
              Monthly Forecast
            </MenuItem>
            <MenuItem divider />
          </>
        )}
        <MenuItem onClick={() => setAnchorEl(null)}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export Data
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default RevenueForecastChart;