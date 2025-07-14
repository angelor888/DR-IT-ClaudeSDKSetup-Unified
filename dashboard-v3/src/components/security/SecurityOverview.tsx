import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Shield as ShieldIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { SecurityDashboard } from '../../types/security';

interface SecurityOverviewProps {
  dashboard: SecurityDashboard;
  onViewDetails?: (section: string) => void;
}

const SecurityOverview: React.FC<SecurityOverviewProps> = ({
  dashboard,
  onViewDetails,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckIcon />;
    if (score >= 70) return <WarningIcon />;
    return <ErrorIcon />;
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'at_risk':
        return 'warning';
      case 'non_compliant':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSystemHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Security Score Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={dashboard.overview.securityScore}
                size={120}
                thickness={5}
                sx={{
                  color: theme => theme.palette[getScoreColor(dashboard.overview.securityScore)].main,
                }}
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
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h3" component="div" fontWeight="bold">
                  {dashboard.overview.securityScore}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Security Score
                </Typography>
              </Box>
            </Box>
            
            <Box>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldIcon />
                Security Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {getScoreIcon(dashboard.overview.securityScore)}
                <Typography variant="body1">
                  {dashboard.overview.securityScore >= 90 ? 'Excellent' :
                   dashboard.overview.securityScore >= 70 ? 'Good' : 'Needs Attention'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date().toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Tooltip title="View detailed security report">
            <IconButton onClick={() => onViewDetails?.('report')}>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderTop: '4px solid',
            borderColor: dashboard.overview.activeThreats > 0 ? 'error.main' : 'success.main',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboard.overview.activeThreats}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Active Threats
                  </Typography>
                </Box>
                <WarningIcon 
                  sx={{ 
                    fontSize: 40, 
                    color: dashboard.overview.activeThreats > 0 ? 'error.main' : 'text.disabled',
                    opacity: 0.3,
                  }} 
                />
              </Box>
              {dashboard.overview.activeThreats > 0 && (
                <Chip
                  label="Requires Attention"
                  size="small"
                  color="error"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderTop: '4px solid',
            borderColor: 'primary.main',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboard.overview.openFindings}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Open Findings
                  </Typography>
                </Box>
                <ErrorIcon 
                  sx={{ 
                    fontSize: 40, 
                    color: 'primary.main',
                    opacity: 0.3,
                  }} 
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={dashboard.overview.openFindings > 0 ? 60 : 100}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderTop: '4px solid',
            borderColor: getComplianceColor(dashboard.overview.complianceStatus) + '.main',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Compliance Status
                  </Typography>
                  <Chip
                    label={dashboard.overview.complianceStatus.toUpperCase()}
                    color={getComplianceColor(dashboard.overview.complianceStatus) as any}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                <SecurityIcon 
                  sx={{ 
                    fontSize: 40, 
                    color: getComplianceColor(dashboard.overview.complianceStatus) + '.main',
                    opacity: 0.3,
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderTop: '4px solid',
            borderColor: getSystemHealthColor(dashboard.systemHealth.status) + '.main',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    System Health
                  </Typography>
                  <Chip
                    label={dashboard.systemHealth.status.toUpperCase()}
                    color={getSystemHealthColor(dashboard.systemHealth.status) as any}
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {dashboard.systemHealth.uptime}% Uptime
                  </Typography>
                </Box>
                <CheckIcon 
                  sx={{ 
                    fontSize: 40, 
                    color: getSystemHealthColor(dashboard.systemHealth.status) + '.main',
                    opacity: 0.3,
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Metrics */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Real-time Performance Metrics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              API Performance
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Response Time</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {dashboard.metrics.performance.apiResponseTime.toFixed(0)}ms
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (dashboard.metrics.performance.apiResponseTime / 1000) * 100)}
                color={dashboard.metrics.performance.apiResponseTime < 500 ? 'success' : 'warning'}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Error Rate</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(dashboard.metrics.performance.errorRate * 100).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={dashboard.metrics.performance.errorRate * 100}
                color={dashboard.metrics.performance.errorRate < 0.05 ? 'success' : 'error'}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Resource Usage
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">CPU Usage</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(dashboard.metrics.resources.cpuUsage * 100).toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={dashboard.metrics.resources.cpuUsage * 100}
                color={dashboard.metrics.resources.cpuUsage < 0.8 ? 'success' : 'warning'}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Memory Usage</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(dashboard.metrics.resources.memoryUsage * 100).toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={dashboard.metrics.resources.memoryUsage * 100}
                color={dashboard.metrics.resources.memoryUsage < 0.8 ? 'success' : 'warning'}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SecurityOverview;