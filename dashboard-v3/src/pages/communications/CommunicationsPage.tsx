import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const CommunicationsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Communications
      </Typography>
      
      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 300 }}>
        <Typography variant="h6" color="text.secondary">
          Unified communications hub will be implemented here
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Features: Slack, Gmail, Twilio SMS integration
        </Typography>
      </Paper>
    </Box>
  );
};

export default CommunicationsPage;