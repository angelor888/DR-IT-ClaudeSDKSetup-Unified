import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Memory as IntegrationIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { healthCheckService, ServiceHealth, HealthCheckResult } from '../../services/healthCheck';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      slack: true,
      pushNotifications: true,
    },
    integrations: {
      grok4: true,
      jobber: false,
      quickbooks: true,
      matterport: false,
    },
    appearance: {
      theme: 'dark',
      language: 'en',
      timeZone: 'America/Los_Angeles',
    },
    ai: {
      autoInsights: true,
      weatherAlerts: true,
      scheduleOptimization: true,
      budgetAnalysis: false,
    },
  });

  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
  };

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      // Use mock data for now since backend API is not available
      const data = await healthCheckService.getMockHealthData();
      setHealthData(data);
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
    // Refresh health data every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 20 }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#F44336', fontSize: 20 }} />;
      case 'disconnected':
        return <WarningIcon sx={{ color: '#FF9800', fontSize: 20 }} />;
      case 'checking':
        return <CircularProgress size={16} />;
      default:
        return <WarningIcon sx={{ color: '#FF9800', fontSize: 20 }} />;
    }
  };

  const getStatusColor = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'error':
        return 'error';
      case 'disconnected':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Settings & Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  General Settings
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={settings.appearance.theme}
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                  >
                    <MenuItem value="dark">Dark Theme</MenuItem>
                    <MenuItem value="light">Light Theme</MenuItem>
                    <MenuItem value="auto">Auto (System)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Time Zone</InputLabel>
                  <Select
                    value={settings.appearance.timeZone}
                    onChange={(e) => handleSettingChange('appearance', 'timeZone', e.target.value)}
                  >
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={settings.appearance.language}
                    onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{
                  backgroundColor: '#FFBB2F',
                  color: '#2C2B2E',
                  '&:hover': {
                    backgroundColor: '#FF8A3D',
                  },
                }}
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Notifications
                </Typography>
              </Box>

              <List>
                <ListItem>
                  <ListItemText primary="Email Notifications" secondary="Receive updates via email" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.email}
                      onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="SMS Notifications" secondary="Receive text messages" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.sms}
                      onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Slack Integration" secondary="Post to Slack channels" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.slack}
                      onChange={(e) => handleSettingChange('notifications', 'slack', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Push Notifications" secondary="Browser notifications" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.pushNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* AI & Automation */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IntegrationIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  AI & Automation
                </Typography>
              </Box>

              <List>
                <ListItem>
                  <ListItemText primary="Auto Insights" secondary="AI-powered recommendations" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.ai.autoInsights}
                      onChange={(e) => handleSettingChange('ai', 'autoInsights', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Weather Alerts" secondary="Automatic weather notifications" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.ai.weatherAlerts}
                      onChange={(e) => handleSettingChange('ai', 'weatherAlerts', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Schedule Optimization" secondary="AI schedule suggestions" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.ai.scheduleOptimization}
                      onChange={(e) => handleSettingChange('ai', 'scheduleOptimization', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Budget Analysis" secondary="Automated cost tracking" />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.ai.budgetAnalysis}
                      onChange={(e) => handleSettingChange('ai', 'budgetAnalysis', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Service Health Dashboard */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Service Health Status
                  </Typography>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={loadHealthData}
                  disabled={isLoading}
                >
                  <RefreshIcon />
                </IconButton>
              </Box>

              {/* Health Summary */}
              {healthData && (
                <Alert 
                  severity={healthData.summary.errors > 0 ? 'error' : healthData.summary.disconnected > 0 ? 'warning' : 'success'}
                  sx={{ mb: 2 }}
                >
                  {healthData.summary.connected}/{healthData.summary.total} services operational
                  {healthData.summary.errors > 0 && ` • ${healthData.summary.errors} errors`}
                  {healthData.summary.disconnected > 0 && ` • ${healthData.summary.disconnected} disconnected`}
                </Alert>
              )}

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {healthData?.services.map((service, index) => (
                    <ListItem key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        {getStatusIcon(service.status)}
                      </Box>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {service.name}
                            </Typography>
                            {service.capabilities && service.capabilities.length > 0 && (
                              <Tooltip title={`Capabilities: ${service.capabilities.join(', ')}`}>
                                <Chip 
                                  label={`${service.capabilities.length} features`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Tooltip>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {service.endpoint}
                            </Typography>
                            {service.responseTime && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTimeIcon sx={{ fontSize: 12 }} />
                                {service.responseTime}ms
                              </Typography>
                            )}
                            {service.errorMessage && (
                              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                {service.errorMessage}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={service.status}
                          color={getStatusColor(service.status) as any}
                          size="small"
                          variant={service.status === 'connected' ? 'filled' : 'outlined'}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Add Service
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  size="small"
                  onClick={loadHealthData}
                  disabled={isLoading}
                >
                  Refresh All
                </Button>
              </Box>

              {healthData && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  Last updated: {healthData.timestamp.toLocaleTimeString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Company Information */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Company Information
              </Typography>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    defaultValue="DuetRight Construction"
                    margin="normal"
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="License Number"
                    defaultValue="WA-CONST-2025-001"
                    margin="normal"
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    defaultValue="(206) 555-0123"
                    margin="normal"
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    defaultValue="info@duetright.com"
                    margin="normal"
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    defaultValue="1234 Construction Ave, Seattle, WA 98101"
                    margin="normal"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{
                    backgroundColor: '#FFBB2F',
                    color: '#2C2B2E',
                    '&:hover': {
                      backgroundColor: '#FF8A3D',
                    },
                    mr: 2,
                  }}
                >
                  Update Company Info
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />}>
                  Reset to Defaults
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid xs={12}>
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              System Status: All systems operational
            </Typography>
            <Typography variant="body2">
              Last sync: {new Date().toLocaleString()} • 
              Version: 3.0.0 • 
              Uptime: 99.9% • 
              4 of 6 integrations active
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;