import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { JobCompletionPrediction } from '../../types/analytics';

interface JobCompletionListProps {
  predictions: JobCompletionPrediction[];
}

const JobCompletionList: React.FC<JobCompletionListProps> = ({ predictions }) => {
  const getRiskColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (probability: number) => {
    if (probability >= 0.8) {
      return <CheckIcon sx={{ color: 'success.main' }} />;
    } else if (probability >= 0.5) {
      return <ScheduleIcon sx={{ color: 'warning.main' }} />;
    } else {
      return <WarningIcon sx={{ color: 'error.main' }} />;
    }
  };

  if (predictions.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Job Completion Predictions
        </Typography>
        <Alert severity="info">
          No active jobs to analyze
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Job Completion Predictions
        </Typography>
        <Tooltip title="AI analyzes project progress, team capacity, and external factors">
          <IconButton size="small">
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <List>
        {predictions.map((prediction, index) => {
          const daysUntilCompletion = differenceInDays(prediction.estimatedCompletion, new Date());
          const highRiskFactors = prediction.riskFactors.filter(rf => rf.impact === 'high');

          return (
            <ListItem
              key={prediction.jobId}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 2,
                display: 'block',
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(prediction.onTimeProbability)}
                  <Typography variant="subtitle1" fontWeight="medium">
                    Job #{prediction.jobId.split('_')[1]}
                  </Typography>
                </Box>
                <Chip
                  label={`${(prediction.confidence * 100).toFixed(0)}% confidence`}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Estimated Completion
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">
                    {format(prediction.estimatedCompletion, 'MMM dd, yyyy')}
                  </Typography>
                  <Chip
                    label={`${daysUntilCompletion} days`}
                    size="small"
                    color={daysUntilCompletion < 7 ? 'warning' : 'default'}
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    On-Time Probability
                  </Typography>
                  <Typography variant="caption" fontWeight="medium">
                    {(prediction.onTimeProbability * 100).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={prediction.onTimeProbability * 100}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor:
                        prediction.onTimeProbability >= 0.8 ? 'success.main' :
                        prediction.onTimeProbability >= 0.5 ? 'warning.main' : 'error.main',
                    },
                  }}
                />
              </Box>

              {highRiskFactors.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Risk Factors
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {prediction.riskFactors.map((risk, idx) => (
                      <Tooltip key={idx} title={risk.mitigation || 'No mitigation suggested'}>
                        <Chip
                          label={risk.factor}
                          size="small"
                          color={getRiskColor(risk.impact) as any}
                          variant="outlined"
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              )}
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

export default JobCompletionList;