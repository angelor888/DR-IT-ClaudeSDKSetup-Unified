import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Chat as ChatIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import JobberSetup from '../components/integrations/JobberSetup';

const IntegrationsPage: React.FC = () => {
  const [jobberConnected, setJobberConnected] = useState(false);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumb */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link underline="hover" color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Typography color="text.primary">Integrations</Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Integrations
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect your business tools to replace demo data with real information
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Transform Your Dashboard:</strong> Connect Jobber to replace all demo data 
          with your actual customers, jobs, and business metrics. This will make the dashboard 
          a real business management tool.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Jobber Integration */}
        <Grid item xs={12}>
          <JobberSetup onConnectionChange={setJobberConnected} />
        </Grid>

        {/* Other Integrations (Coming Soon) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ opacity: 0.6 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Box display="flex" alignItems="center">
                  <AccountBalanceIcon sx={{ mr: 2, fontSize: 32, color: '#2e7d32' }} />
                  <Box>
                    <Typography variant="h6" component="h2">
                      QuickBooks Integration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sync financial data, invoices, and accounting information
                    </Typography>
                  </Box>
                </Box>
                <Chip label="Coming Soon" color="default" variant="outlined" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Connect QuickBooks to import real financial data, invoices, and revenue metrics.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ opacity: 0.6 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Box display="flex" alignItems="center">
                  <EmailIcon sx={{ mr: 2, fontSize: 32, color: '#d32f2f' }} />
                  <Box>
                    <Typography variant="h6" component="h2">
                      Gmail Integration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connect email communications and customer correspondence
                    </Typography>
                  </Box>
                </Box>
                <Chip label="Coming Soon" color="default" variant="outlined" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Sync Gmail to track customer communications and email history.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ opacity: 0.6 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Box display="flex" alignItems="center">
                  <ChatIcon sx={{ mr: 2, fontSize: 32, color: '#4a148c' }} />
                  <Box>
                    <Typography variant="h6" component="h2">
                      Slack Integration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team notifications and business updates
                    </Typography>
                  </Box>
                </Box>
                <Chip label="Coming Soon" color="default" variant="outlined" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Get real-time business notifications and team coordination through Slack.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ opacity: 0.6 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Box display="flex" alignItems="center">
                  <SmsIcon sx={{ mr: 2, fontSize: 32, color: '#ff6f00' }} />
                  <Box>
                    <Typography variant="h6" component="h2">
                      Twilio SMS Integration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      SMS communications with customers and team
                    </Typography>
                  </Box>
                </Box>
                <Chip label="Coming Soon" color="default" variant="outlined" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Send and receive SMS messages directly from the dashboard.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Integration Status Summary */}
        <Grid item xs={12}>
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Integration Status</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" color={jobberConnected ? 'success.main' : 'text.secondary'}>
                      {jobberConnected ? '1' : '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connected
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="text.secondary">
                      4
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="info.main">
                      {jobberConnected ? '100%' : '0%'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Data Quality
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="primary.main">
                      {jobberConnected ? 'Live' : 'Demo'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Data Mode
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default IntegrationsPage;