import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading DuetRight Dashboard...' 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        gap: 3,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography 
        variant="h6" 
        color="text.secondary"
        sx={{ textAlign: 'center' }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;