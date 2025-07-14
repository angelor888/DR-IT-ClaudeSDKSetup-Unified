import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import {
  LightbulbOutlined as OpportunityIcon,
  Warning as RiskIcon,
  TrendingUp as TrendIcon,
  BugReport as AnomalyIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  CheckCircleOutline as ActionIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { AnalyticsDashboard } from '../../types/analytics';

interface InsightCardProps {
  insight: AnalyticsDashboard['insights'][0];
  onAction?: (insightId: string, action: string) => void;
  compact?: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({ 
  insight, 
  onAction,
  compact = false,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const getIcon = () => {
    switch (insight.type) {
      case 'opportunity':
        return <OpportunityIcon sx={{ color: 'success.main' }} />;
      case 'risk':
        return <RiskIcon sx={{ color: 'error.main' }} />;
      case 'trend':
        return <TrendIcon sx={{ color: 'info.main' }} />;
      case 'anomaly':
        return <AnomalyIcon sx={{ color: 'warning.main' }} />;
    }
  };

  const getImpactColor = () => {
    switch (insight.impact) {
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

  const getTypeColor = () => {
    switch (insight.type) {
      case 'opportunity':
        return 'success';
      case 'risk':
        return 'error';
      case 'trend':
        return 'info';
      case 'anomaly':
        return 'warning';
    }
  };

  if (compact) {
    return (
      <Card
        variant="outlined"
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 2,
            transform: 'translateY(-2px)',
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            {getIcon()}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="medium">
                {insight.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {insight.description}
              </Typography>
            </Box>
            <Chip
              label={insight.impact}
              size="small"
              color={getImpactColor() as any}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={insight.impact === 'high' ? 3 : 1}
      sx={{
        border: insight.impact === 'high' ? '2px solid' : '1px solid',
        borderColor: insight.impact === 'high' ? 'primary.main' : 'divider',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getIcon()}
            <Box>
              <Typography variant="h6" component="h3">
                {insight.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label={insight.type}
                  size="small"
                  color={getTypeColor() as any}
                  variant="outlined"
                />
                <Chip
                  label={`${insight.impact} impact`}
                  size="small"
                  color={getImpactColor() as any}
                />
                {insight.confidence && (
                  <Chip
                    label={`${(insight.confidence * 100).toFixed(0)}% confidence`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
          {insight.actionable && insight.suggestedActions && insight.suggestedActions.length > 0 && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          )}
        </Box>

        <Typography variant="body1" paragraph>
          {insight.description}
        </Typography>

        {insight.confidence && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Confidence Level
              </Typography>
              <Typography variant="caption" fontWeight="medium">
                {(insight.confidence * 100).toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={insight.confidence * 100} 
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        )}

        <Collapse in={expanded}>
          {insight.suggestedActions && insight.suggestedActions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Suggested Actions
              </Typography>
              <List dense>
                {insight.suggestedActions.map((action, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ActionIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={action} />
                    {onAction && (
                      <Button
                        size="small"
                        endIcon={<ArrowIcon />}
                        onClick={() => onAction(insight.id, action)}
                      >
                        Execute
                      </Button>
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Collapse>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Generated {new Date(insight.createdAt).toLocaleString()}
          </Typography>
          {insight.actionable && !expanded && insight.suggestedActions && insight.suggestedActions.length > 0 && (
            <Button
              size="small"
              endIcon={<ExpandIcon />}
              onClick={() => setExpanded(true)}
            >
              View {insight.suggestedActions.length} Actions
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default InsightCard;