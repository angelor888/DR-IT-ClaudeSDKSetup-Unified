import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { SparkLineChart } from '@mui/x-charts';
import { AnalyticsMetric } from '../../types/analytics';

interface MetricCardProps {
  metric: AnalyticsMetric;
  loading?: boolean;
  sparklineData?: number[];
  onInfoClick?: () => void;
  onMenuClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  loading = false,
  sparklineData,
  onInfoClick,
  onMenuClick,
}) => {
  const getTrendIcon = () => {
    if (metric.trend === 'up') {
      return <TrendingUpIcon sx={{ color: 'success.main' }} />;
    } else if (metric.trend === 'down') {
      return <TrendingDownIcon sx={{ color: 'error.main' }} />;
    }
    return <TrendingFlatIcon sx={{ color: 'text.secondary' }} />;
  };

  const getChangeColor = () => {
    if (metric.category === 'revenue' || metric.category === 'customers') {
      // For revenue and customers, up is good
      return metric.change > 0 ? 'success' : metric.change < 0 ? 'error' : 'default';
    } else if (metric.category === 'resources') {
      // For resources (like costs), down might be good
      return metric.change < 0 ? 'success' : metric.change > 0 ? 'error' : 'default';
    }
    return 'default';
  };

  const formatValue = (value: number) => {
    if (metric.category === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } else if (metric.name.includes('Rate') || metric.name.includes('Utilization')) {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'box-shadow 0.3s',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ pb: 2, flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {metric.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                {formatValue(metric.currentValue)}
              </Typography>
              {getTrendIcon()}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onInfoClick && (
              <Tooltip title="More info">
                <IconButton size="small" onClick={onInfoClick}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onMenuClick && (
              <IconButton size="small" onClick={onMenuClick}>
                <MoreIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip
            label={`${metric.change > 0 ? '+' : ''}${formatValue(metric.change)}`}
            size="small"
            color={getChangeColor() as any}
            variant="outlined"
          />
          <Chip
            label={`${metric.changePercent > 0 ? '+' : ''}${metric.changePercent.toFixed(1)}%`}
            size="small"
            color={getChangeColor() as any}
          />
          <Typography variant="caption" color="text.secondary">
            vs previous period
          </Typography>
        </Box>

        {/* Sparkline Chart */}
        {sparklineData && sparklineData.length > 0 && (
          <Box sx={{ mt: 2, height: 60 }}>
            <SparkLineChart
              data={sparklineData}
              height={60}
              showHighlight
              showTooltip
              sx={{ 
                '& .MuiLineElement-root': { 
                  stroke: metric.trend === 'up' ? '#4caf50' : metric.trend === 'down' ? '#f44336' : '#757575' 
                } 
              }}
              margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
            />
          </Box>
        )}

        {/* Insights */}
        {metric.insights && metric.insights.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" component="div">
              {metric.insights[0]}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Category indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: 
            metric.category === 'revenue' ? 'success.main' :
            metric.category === 'operations' ? 'info.main' :
            metric.category === 'customers' ? 'warning.main' :
            'secondary.main',
        }}
      />
    </Card>
  );
};

export default MetricCard;