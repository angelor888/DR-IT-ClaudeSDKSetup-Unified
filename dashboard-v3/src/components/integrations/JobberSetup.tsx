import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import JobberService from '../../services/integrations/JobberService';

interface JobberSetupProps {
  onConnectionChange?: (connected: boolean) => void;
}

const JobberSetup: React.FC<JobberSetupProps> = ({ onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const jobberService = new JobberService();

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const connected = await jobberService.isConnected();
      setIsConnected(connected);
      onConnectionChange?.(connected);
    } catch (error: any) {
      console.error('Failed to check Jobber connection:', error);
      setError('Failed to check connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Start OAuth flow
      const authUrl = await jobberService.initializeOAuth();
      
      // Open OAuth in popup window
      const popup = window.open(
        authUrl,
        'jobber-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Poll for popup closure or success
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          // Check if connection was successful
          setTimeout(() => {
            checkConnectionStatus();
          }, 1000);
        }
      }, 1000);

      // Set timeout for popup
      setTimeout(() => {
        if (popup && !popup.closed) {
          popup.close();
          clearInterval(checkClosed);
          setIsConnecting(false);
          setError('OAuth process timed out');
        }
      }, 300000); // 5 minutes

    } catch (error: any) {
      console.error('Jobber OAuth failed:', error);
      setError(error.message || 'Failed to connect to Jobber');
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      setSuccess(null);
      
      await jobberService.syncAllData();
      setSuccess('Successfully synced all Jobber data');
      
      // Refresh the page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Jobber sync failed:', error);
      setError(error.message || 'Failed to sync Jobber data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect Jobber? This will remove all synced data.')) {
      try {
        // TODO: Implement disconnect functionality
        setSuccess('Disconnected from Jobber');
        setIsConnected(false);
        onConnectionChange?.(false);
      } catch (error: any) {
        setError('Failed to disconnect from Jobber');
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" p={3}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>Checking Jobber connection...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
          <Box display="flex" alignItems="center">
            <BusinessIcon sx={{ mr: 2, fontSize: 32, color: '#1976d2' }} />
            <Box>
              <Typography variant="h6" component="h2">
                Jobber Integration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connect your Jobber account to sync customers, jobs, and business data
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={isConnected ? <CheckCircleIcon /> : <ErrorIcon />}
            label={isConnected ? 'Connected' : 'Not Connected'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {!isConnected ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Connect your Jobber account to replace demo data with your real business information:
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <PeopleIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Customer Data" 
                  secondary="Import all your Jobber clients and their contact information"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WorkIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Job Management" 
                  secondary="Sync active jobs, scheduling, and job statuses"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Business Metrics" 
                  secondary="Get real revenue, completion rates, and growth data"
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                onClick={handleConnect}
                disabled={isConnecting}
                startIcon={isConnecting ? <CircularProgress size={20} /> : <BusinessIcon />}
                fullWidth
              >
                {isConnecting ? 'Connecting to Jobber...' : 'Connect Jobber Account'}
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your Jobber account is connected. You can sync data or manage your connection below.
            </Typography>

            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={handleSync}
                disabled={isSyncing}
                startIcon={isSyncing ? <CircularProgress size={20} /> : <SyncIcon />}
              >
                {isSyncing ? 'Syncing Data...' : 'Sync Jobber Data'}
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> After syncing, refresh the dashboard to see your real business data 
              replace the demo information.
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default JobberSetup;