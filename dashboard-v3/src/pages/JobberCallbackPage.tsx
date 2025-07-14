import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import JobberService from '../services/integrations/JobberService';

const JobberCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Processing Jobber authentication...');
  
  const jobberService = new JobberService();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check if user denied authorization
      if (error) {
        setStatus('error');
        if (error === 'access_denied') {
          setMessage('Authorization was cancelled. You can try connecting again.');
        } else {
          setMessage(errorDescription || `Authorization failed: ${error}`);
        }
        return;
      }

      // Check if we have the required parameters
      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback parameters. Please try connecting again.');
        return;
      }

      setMessage('Exchanging authorization code for access token...');

      // Exchange code for access token
      const success = await jobberService.handleOAuthCallback(code, state);

      if (success) {
        setStatus('success');
        setMessage('Successfully connected to Jobber! Redirecting...');
        
        // Redirect to integrations page after 2 seconds
        setTimeout(() => {
          navigate('/integrations', { replace: true });
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Failed to complete Jobber connection. Please try again.');
      }

    } catch (error: any) {
      console.error('Jobber callback error:', error);
      setStatus('error');
      
      if (error.message.includes('Invalid state')) {
        setMessage('Security validation failed. Please try connecting again.');
      } else if (error.message.includes('expired')) {
        setMessage('Authorization expired. Please try connecting again.');
      } else {
        setMessage(error.message || 'An unexpected error occurred during authentication.');
      }
    }
  };

  const handleRetry = () => {
    navigate('/integrations', { replace: true });
  };

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <CircularProgress size={48} color="primary" />;
      case 'success':
        return <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Card>
        <CardContent>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            py={4}
          >
            {/* Icon */}
            <Box mb={3}>
              {getIcon()}
            </Box>

            {/* Title */}
            <Typography variant="h4" component="h1" gutterBottom>
              {status === 'processing' && 'Connecting to Jobber'}
              {status === 'success' && 'Successfully Connected!'}
              {status === 'error' && 'Connection Failed'}
            </Typography>

            {/* Message */}
            <Alert 
              severity={getColor() as any} 
              sx={{ maxWidth: 500, mb: 3 }}
              icon={false}
            >
              <Typography variant="body1">
                {message}
              </Typography>
            </Alert>

            {/* Additional Info */}
            {status === 'success' && (
              <Box textAlign="center" mb={3}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Your Jobber account has been successfully connected to the DuetRight Dashboard.
                  You can now sync your real business data.
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                  <BusinessIcon color="primary" />
                  <Typography variant="body2" color="primary">
                    Ready to sync customers, jobs, and business metrics
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Action Buttons */}
            {status === 'error' && (
              <Button
                variant="contained"
                onClick={handleRetry}
                startIcon={<BusinessIcon />}
                size="large"
              >
                Back to Integrations
              </Button>
            )}

            {status === 'success' && (
              <Typography variant="body2" color="text.secondary">
                Redirecting to integrations page...
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Debug Information (only in development) */}
      {import.meta.env.DEV && (
        <Card sx={{ mt: 2, opacity: 0.7 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Debug Information
            </Typography>
            <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
              {JSON.stringify({
                code: searchParams.get('code')?.substring(0, 20) + '...',
                state: searchParams.get('state'),
                error: searchParams.get('error'),
                error_description: searchParams.get('error_description'),
                status,
              }, null, 2)}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default JobberCallbackPage;