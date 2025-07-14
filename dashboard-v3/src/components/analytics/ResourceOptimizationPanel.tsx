import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Construction as ConstructionIcon,
  Engineering as EngineeringIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  ArrowForward as ArrowIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { ResourceOptimization } from '../../types/analytics';

interface ResourceOptimizationPanelProps {
  optimizations: ResourceOptimization[];
  onImplement?: (resource: string, action: string) => void;
}

const ResourceOptimizationPanel: React.FC<ResourceOptimizationPanelProps> = ({
  optimizations,
  onImplement,
}) => {
  const getResourceIcon = (resource: string) => {
    if (resource.includes('Crew')) return <ConstructionIcon />;
    if (resource.includes('Equipment')) return <EngineeringIcon />;
    if (resource.includes('Material')) return <InventoryIcon />;
    return <TrendingUpIcon />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const calculateTotalSavings = () => {
    return optimizations.reduce((total, opt) => {
      const savings = opt.recommendations.reduce((sum, rec) => sum + (rec.estimatedSavings || 0), 0);
      return total + savings;
    }, 0);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Resource Optimization
        </Typography>
        <Chip
          icon={<MoneyIcon />}
          label={`$${calculateTotalSavings().toLocaleString()} potential savings`}
          color="success"
          variant="outlined"
        />
      </Box>

      <List>
        {optimizations.map((optimization, index) => (
          <ListItem
            key={index}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 2,
              display: 'block',
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 1,
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                }}
              >
                {getResourceIcon(optimization.resource)}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {optimization.resource}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Current: {optimization.currentUtilization}%
                  </Typography>
                  <ArrowIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption" color="success.main" fontWeight="medium">
                    Target: {optimization.optimalUtilization}%
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Utilization Progress */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ position: 'relative', height: 12, bgcolor: 'grey.200', borderRadius: 1 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${optimization.currentUtilization}%`,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                    transition: 'width 0.3s ease',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${optimization.optimalUtilization}%`,
                    top: -2,
                    bottom: -2,
                    width: 2,
                    bgcolor: 'success.main',
                  }}
                />
              </Box>
            </Box>

            {/* Recommendations */}
            <Typography variant="subtitle2" gutterBottom>
              Recommendations
            </Typography>
            <List dense>
              {optimization.recommendations.map((rec, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    py: 1,
                  }}
                >
                  <ListItemText
                    primary={rec.action}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={rec.priority}
                          size="small"
                          color={getPriorityColor(rec.priority) as any}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {rec.impact}
                        </Typography>
                        {rec.estimatedSavings && (
                          <Chip
                            label={`$${rec.estimatedSavings.toLocaleString()}`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                  />
                  {onImplement && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onImplement(optimization.resource, rec.action)}
                    >
                      Implement
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          </ListItem>
        ))}
      </List>

      {/* Optimization Score */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Overall Optimization Score
            </Typography>
            <Typography variant="body2">
              Implementing all recommendations could improve efficiency by 15%
            </Typography>
          </Box>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={75}
              size={60}
              thickness={5}
              sx={{ color: 'success.main' }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" fontWeight="bold">
                75%
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ResourceOptimizationPanel;