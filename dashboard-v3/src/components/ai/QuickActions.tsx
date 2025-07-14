import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  Assignment as TaskIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutomationIcon,
  QuestionAnswer as QueryIcon,
} from '@mui/icons-material';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  command: string;
  category: 'insight' | 'action' | 'query' | 'automation';
  requiresParam?: boolean;
}

interface QuickActionsProps {
  onActionSelect: (command: string) => void;
  recentActions?: string[];
  suggestedActions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    id: 'revenue-summary',
    title: 'Revenue Summary',
    description: 'Get this month\'s revenue breakdown',
    icon: <TrendingIcon />,
    command: 'Show me revenue summary for this month',
    category: 'insight',
  },
  {
    id: 'schedule-job',
    title: 'Schedule Job',
    description: 'Create and schedule a new job',
    icon: <ScheduleIcon />,
    command: 'Schedule a new job for',
    category: 'action',
    requiresParam: true,
  },
  {
    id: 'pending-tasks',
    title: 'Pending Tasks',
    description: 'View all pending tasks and jobs',
    icon: <TaskIcon />,
    command: 'Show me all pending tasks',
    category: 'query',
  },
  {
    id: 'customer-insights',
    title: 'Customer Analysis',
    description: 'Analyze customer patterns and trends',
    icon: <AnalyticsIcon />,
    command: 'Analyze customer trends for the past month',
    category: 'insight',
  },
  {
    id: 'automate-followup',
    title: 'Automate Follow-ups',
    description: 'Set up automated customer follow-ups',
    icon: <AutomationIcon />,
    command: 'Create automation for customer follow-ups',
    category: 'automation',
  },
  {
    id: 'query-data',
    title: 'Query Business Data',
    description: 'Ask questions about your business data',
    icon: <QueryIcon />,
    command: 'Query:',
    category: 'query',
    requiresParam: true,
  },
];

const QuickActions: React.FC<QuickActionsProps> = ({
  onActionSelect,
  recentActions = [],
  suggestedActions = defaultActions,
}) => {
  const theme = useTheme();

  const getCategoryColor = (category: QuickAction['category']) => {
    switch (category) {
      case 'insight':
        return theme.palette.info.main;
      case 'action':
        return theme.palette.success.main;
      case 'query':
        return theme.palette.warning.main;
      case 'automation':
        return theme.palette.secondary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const handleActionClick = (action: QuickAction) => {
    if (action.requiresParam) {
      onActionSelect(action.command + ' ');
    } else {
      onActionSelect(action.command);
    }
  };

  return (
    <Box>
      {recentActions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Recent Commands
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {recentActions.slice(0, 5).map((command, index) => (
              <Chip
                key={index}
                label={command.length > 30 ? command.substring(0, 30) + '...' : command}
                onClick={() => onActionSelect(command)}
                size="small"
                variant="outlined"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        {suggestedActions.map((action) => (
          <Grid item xs={12} sm={6} md={4} key={action.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                  borderColor: getCategoryColor(action.category),
                },
              }}
              onClick={() => handleActionClick(action)}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1,
                    color: getCategoryColor(action.category),
                  }}
                >
                  {action.icon}
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    sx={{ ml: 1 }}
                  >
                    {action.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
                <Chip
                  label={action.category}
                  size="small"
                  sx={{
                    mt: 1,
                    backgroundColor: getCategoryColor(action.category) + '20',
                    color: getCategoryColor(action.category),
                    fontWeight: 'medium',
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuickActions;