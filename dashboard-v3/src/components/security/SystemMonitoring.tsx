import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { SystemMetrics } from '../../types/security';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime?: number;
  errorMessage?: string;
}

interface Alert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface SystemMonitoringProps {
  metrics: SystemMetrics;
  healthChecks: Map<string, HealthCheck>;
  alerts: Alert[];
  onAcknowledgeAlert?: (alertId: string) => void;
}

const SystemMonitoring: React.FC<SystemMonitoringProps> = ({
  metrics,
  healthChecks,
  alerts,
  onAcknowledgeAlert,
}) => {
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckIcon sx={{ color: 'success.main' }} />;
      case 'degraded':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'down':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProgressColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'error';
    if (value >= thresholds.warning) return 'warning';
    return 'success';
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const healthyServices = Array.from(healthChecks.values()).filter(h => h.status === 'healthy').length;
  const totalServices = healthChecks.size;

  return (
    <Box>
      {/* System Health Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {healthyServices}/{totalServices}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Services Healthy
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(healthyServices / totalServices) * 100}
                sx={{ mt: 1 }}
                color={healthyServices === totalServices ? 'success' : 'warning'}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderTop: '4px solid', borderColor: activeAlerts.length > 0 ? 'error.main' : 'success.main' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color={activeAlerts.length > 0 ? 'error.main' : 'text.primary'}>
                {activeAlerts.length}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Active Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'info.main' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {metrics.performance.requestsPerMinute.toFixed(0)}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Requests/Min
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {metrics.performance.apiResponseTime.toFixed(0)}ms
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Avg Response Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Resource Usage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ComputerIcon />
              Resource Usage
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SpeedIcon fontSize="small" />
                  CPU Usage
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(metrics.resources.cpuUsage * 100).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.resources.cpuUsage * 100}
                color={getProgressColor(metrics.resources.cpuUsage, { warning: 0.8, critical: 0.9 })}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MemoryIcon fontSize="small" />
                  Memory Usage
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(metrics.resources.memoryUsage * 100).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.resources.memoryUsage * 100}
                color={getProgressColor(metrics.resources.memoryUsage, { warning: 0.8, critical: 0.9 })}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StorageIcon fontSize="small" />
                  Disk Usage
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(metrics.resources.diskUsage * 100).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.resources.diskUsage * 100}
                color={getProgressColor(metrics.resources.diskUsage, { warning: 0.8, critical: 0.9 })}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <NetworkIcon fontSize="small" />
                  Network Usage
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(metrics.resources.bandwidthUsage * 100).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.resources.bandwidthUsage * 100}
                color={getProgressColor(metrics.resources.bandwidthUsage, { warning: 0.8, critical: 0.9 })}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Service Health */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Service Health Checks
            </Typography>

            <List>
              {Array.from(healthChecks.entries()).map(([serviceName, health]) => (
                <ListItem key={serviceName} sx={{ px: 0 }}>
                  <ListItemIcon>
                    {getHealthIcon(health.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}
                        </Typography>
                        <Chip
                          label={health.status}
                          size="small"
                          color={getHealthColor(health.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Last check: {health.lastCheck.toLocaleTimeString()}
                        </Typography>
                        {health.responseTime && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                            Response: {health.responseTime}ms
                          </Typography>
                        )}
                        {health.errorMessage && (
                          <Typography variant="caption" color="error.main" display="block">
                            {health.errorMessage}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">API Response Time</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {metrics.performance.apiResponseTime.toFixed(0)}ms
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Database Query Time</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {metrics.performance.databaseQueryTime.toFixed(0)}ms
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Cache Hit Rate</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(metrics.performance.cacheHitRate * 100).toFixed(1)}%
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Error Rate</Typography>
                <Typography variant="body2" fontWeight="bold" color={metrics.performance.errorRate > 0.05 ? 'error.main' : 'text.primary'}>
                  {(metrics.performance.errorRate * 100).toFixed(2)}%
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Active Users</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {metrics.users.activeUsers}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Active Alerts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Alerts
            </Typography>

            {activeAlerts.length === 0 ? (
              <Alert severity="success">
                No active alerts. System is running smoothly.
              </Alert>
            ) : (
              <List>
                {activeAlerts.map((alert) => (
                  <ListItem key={alert.id} sx={{ px: 0, display: 'block' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {alert.timestamp.toLocaleString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={alert.severity}
                        size="small"
                        color={alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'warning'}
                      />
                    </Box>
                    {onAcknowledgeAlert && (
                      <Button
                        size="small"
                        onClick={() => onAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemMonitoring;