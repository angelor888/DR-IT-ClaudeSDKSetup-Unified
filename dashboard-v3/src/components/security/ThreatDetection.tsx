import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ThreatDetection as ThreatType } from '../../types/security';

interface ThreatDetectionProps {
  threats: ThreatType[];
  onMitigate?: (threatId: string) => void;
  onViewDetails?: (threat: ThreatType) => void;
}

const ThreatDetection: React.FC<ThreatDetectionProps> = ({
  threats,
  onMitigate,
  onViewDetails,
}) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'high':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'medium':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'low':
        return <InfoIcon sx={{ color: 'info.main' }} />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected':
        return 'error';
      case 'investigating':
        return 'warning';
      case 'mitigated':
        return 'success';
      case 'false_positive':
        return 'default';
      default:
        return 'default';
    }
  };

  const activethreats = threats.filter(t => 
    t.status === 'detected' || t.status === 'investigating'
  );

  const getThreatTypeDescription = (type: string): string => {
    switch (type) {
      case 'brute_force':
        return 'Multiple failed login attempts detected';
      case 'sql_injection':
        return 'SQL injection attempt detected in request';
      case 'xss':
        return 'Cross-site scripting attempt detected';
      case 'unauthorized_access':
        return 'Unauthorized access to restricted resource';
      case 'data_exfiltration':
        return 'Unusual data transfer pattern detected';
      case 'anomalous_behavior':
        return 'User behavior deviates from normal pattern';
      default:
        return 'Unknown threat type';
    }
  };

  if (threats.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="success" icon={<CheckIcon />}>
          <Typography variant="subtitle1" fontWeight="medium">
            No Active Threats Detected
          </Typography>
          <Typography variant="body2">
            Your system is currently secure with no detected threats.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {activethreats.filter(t => t.severity === 'critical' || t.severity === 'high').length}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                High/Critical Threats
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {activethreats.length}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Active Threats
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {threats.filter(t => t.status === 'mitigated').length}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Mitigated Threats
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Threats */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon />
          Active Threats
        </Typography>

        {activethreats.length === 0 ? (
          <Alert severity="info">
            No active threats at this time.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {activethreats.map((threat) => (
              <Grid item xs={12} md={6} key={threat.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: getSeverityColor(threat.severity) + '.main',
                    borderWidth: 2,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getSeverityIcon(threat.severity)}
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {threat.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(threat.timestamp, 'MMM dd, HH:mm:ss')}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                          label={threat.severity}
                          size="small"
                          color={getSeverityColor(threat.severity) as any}
                        />
                        <Chip
                          label={threat.status}
                          size="small"
                          color={getStatusColor(threat.status) as any}
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" paragraph>
                      {getThreatTypeDescription(threat.type)}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Details
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Source: {threat.source}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Target: {threat.target}
                      </Typography>
                    </Box>

                    {threat.indicators.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Indicators
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {threat.indicators.map((indicator, idx) => (
                            <Chip
                              key={idx}
                              label={indicator}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {threat.mitigationApplied && threat.mitigationDetails && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="caption">
                          Mitigation: {threat.mitigationDetails}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                  <CardActions>
                    {!threat.mitigationApplied && (
                      <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        startIcon={<BlockIcon />}
                        onClick={() => onMitigate?.(threat.id)}
                      >
                        Mitigate
                      </Button>
                    )}
                    <Button
                      size="small"
                      onClick={() => onViewDetails?.(threat)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Threat Timeline */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon />
          Threat Timeline (Last 24 Hours)
        </Typography>

        <List>
          {threats.slice(0, 10).map((threat, index) => (
            <ListItem key={threat.id} divider={index < threats.length - 1}>
              <ListItemIcon>
                {getSeverityIcon(threat.severity)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {threat.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    <Chip
                      label={threat.status}
                      size="small"
                      color={getStatusColor(threat.status) as any}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {format(threat.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      Source: {threat.source}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default ThreatDetection;