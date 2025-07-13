import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Alert, Container } from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  showRefresh?: boolean;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunkError = this.state.error?.message?.includes('Loading chunk') ||
                          this.state.error?.message?.includes('Loading CSS chunk');

      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={3}
            textAlign="center"
          >
            <Alert severity="error" sx={{ width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {isChunkError ? 'Application Update Available' : 'Something went wrong'}
              </Typography>
              <Typography variant="body2">
                {isChunkError 
                  ? 'The application has been updated. Please refresh the page to load the latest version.'
                  : 'An unexpected error occurred while loading this page.'
                }
              </Typography>
            </Alert>

            <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
              {(this.props.showRefresh !== false || isChunkError) && (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRefresh}
                >
                  Refresh Page
                </Button>
              )}
              
              <Button
                variant="outlined"
                onClick={this.handleRetry}
              >
                Try Again
              </Button>

              {this.props.showHomeButton && (
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                >
                  Go Home
                </Button>
              )}
            </Box>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, width: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details (Development Only):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Specific error boundary for chunk loading errors
export const ChunkErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    showRefresh
    fallback={
      <Alert severity="warning" sx={{ m: 2 }}>
        <Typography variant="body2">
          Failed to load application resources. Please refresh the page.
        </Typography>
        <Button
          size="small"
          onClick={() => window.location.reload()}
          sx={{ mt: 1 }}
        >
          Refresh
        </Button>
      </Alert>
    }
  >
    {children}
  </ErrorBoundary>
);

// Route-specific error boundary
export const RouteErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary showRefresh showHomeButton>
    {children}
  </ErrorBoundary>
);