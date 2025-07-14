import React, { useState } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Google as GoogleIcon,
} from '@mui/icons-material';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setUser } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const authError = useSelector((state: RootState) => state.auth.error);
  const dispatch = useDispatch();
  const navigate = useNavigate();


  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      console.log('Google login successful:', result.user?.email);
    } catch (err: any) {
      console.error('Google login error:', err);
      
      let errorMessage = 'Google login failed. ';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login was cancelled. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Login was cancelled. Please try again.';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google login. Please contact support.';
      } else {
        errorMessage += err.message || 'Please try again or contact support.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setError('');
    
    // Create demo user for development
    const demoUser = {
      id: 'demo-user-123',
      email: 'demo@duetright.com',
      name: 'Demo User',
      role: 'admin' as const,
      avatar: undefined,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Simulate login delay
    setTimeout(() => {
      dispatch(setUser({ user: demoUser, token: 'demo-token-123' }));
      navigate('/dashboard');
      setIsLoading(false);
    }, 1000);
  };

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
            DuetRight
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
            Dashboard v3
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            AI-Powered Business Management
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Sign in with your DuetRight Google account
          </Typography>
        </Box>

        {(error || authError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || authError}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={isLoading}
          sx={{
            mb: 3,
            py: 1.5,
            backgroundColor: '#4285f4',
            color: 'white',
            '&:hover': {
              backgroundColor: '#3367d6',
            },
            '&:disabled': {
              backgroundColor: '#94a3b8',
            },
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </Button>

        {isDevelopment && (
          <>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleDemoLogin}
              disabled={isLoading}
              sx={{
                mb: 3,
                backgroundColor: '#FFBB2F',
                color: '#2C2B2E',
                '&:hover': {
                  backgroundColor: '#FF8A3D',
                },
              }}
            >
              🏗️ Demo Login (Development)
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>
          </>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
          Powered by Grok 4 AI • MCP Integration Hub
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;