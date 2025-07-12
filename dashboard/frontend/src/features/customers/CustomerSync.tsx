import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  useGetCustomerSyncStatusQuery,
  useSyncAllCustomersWithJobberMutation,
} from '@services/api/customerApi';

export const CustomerSync: React.FC = () => {
  const { 
    data: syncStatus, 
    isLoading, 
    refetch 
  } = useGetCustomerSyncStatusQuery(undefined, {
    pollingInterval: 5000, // Poll every 5 seconds
  });
  
  const [syncAllCustomers, { isLoading: isSyncing }] = useSyncAllCustomersWithJobberMutation();

  const handleSyncAll = async () => {
    try {
      await syncAllCustomers().unwrap();
      // Refetch status after initiating sync
      refetch();
    } catch (error) {
      console.error('Failed to start sync:', error);
    }
  };

  const getSyncProgress = () => {
    if (!syncStatus) return 0;
    const { totalCustomers, syncedCustomers } = syncStatus;
    if (totalCustomers === 0) return 0;
    return (syncedCustomers / totalCustomers) * 100;
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <ScheduleIcon color="warning" />;
      default:
        return <WarningIcon color="disabled" />;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography>Loading sync status...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Jobber Sync Status
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            startIcon={isSyncing ? <SyncIcon className="animate-spin" /> : <SyncIcon />}
            variant="contained"
            onClick={handleSyncAll}
            disabled={isSyncing || syncStatus?.isRunning}
          >
            {isSyncing || syncStatus?.isRunning ? 'Syncing...' : 'Sync All Customers'}
          </Button>
        </Stack>
      </Stack>

      {syncStatus?.isRunning && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Sync is currently running. This page will automatically update with progress.
          </Typography>
        </Alert>
      )}

      <Stack spacing={3}>
        <Card>
          <CardHeader title="Sync Overview" />
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Overall Progress
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getSyncProgress()} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {syncStatus?.syncedCustomers || 0} of {syncStatus?.totalCustomers || 0} customers processed
                </Typography>
              </Box>

              <Stack direction="row" spacing={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {syncStatus?.syncedCustomers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Synced
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {syncStatus?.pendingCustomers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {syncStatus?.errorCustomers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Errors
                  </Typography>
                </Box>
              </Stack>

              {syncStatus?.lastSync && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last sync completed: {new Date(syncStatus.lastSync).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {syncStatus?.errors && syncStatus.errors.length > 0 && (
          <Card>
            <CardHeader 
              title="Sync Errors" 
              action={
                <Chip 
                  label={syncStatus.errors.length} 
                  color="error" 
                  size="small" 
                />
              }
            />
            <CardContent>
              <List>
                {syncStatus.errors?.map((error, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Customer ID: ${error.customerId}`}
                        secondary={
                          <Stack spacing={1}>
                            <Typography variant="body2" color="error">
                              {error.error}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(error.timestamp).toLocaleString()}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                    {index < (syncStatus.errors?.length || 0) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader title="Sync Information" />
          <CardContent>
            <Stack spacing={2}>
              <Alert severity="info">
                <Typography variant="body2">
                  Customer sync pulls data from Jobber and updates local customer records. 
                  This includes contact information, addresses, and metadata.
                </Typography>
              </Alert>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    {getSyncStatusIcon('synced')}
                  </ListItemIcon>
                  <ListItemText
                    primary="Synced"
                    secondary="Customer data successfully synchronized with Jobber"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {getSyncStatusIcon('pending')}
                  </ListItemIcon>
                  <ListItemText
                    primary="Pending"
                    secondary="Customer is queued for synchronization"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {getSyncStatusIcon('error')}
                  </ListItemIcon>
                  <ListItemText
                    primary="Error"
                    secondary="Synchronization failed - check error details above"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {getSyncStatusIcon('not_synced')}
                  </ListItemIcon>
                  <ListItemText
                    primary="Not Synced"
                    secondary="Customer has not been synchronized with Jobber"
                  />
                </ListItem>
              </List>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};