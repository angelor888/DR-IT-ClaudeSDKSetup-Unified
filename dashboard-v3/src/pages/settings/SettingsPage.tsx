import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Settings
      </Typography>
      
      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 300 }}>
        <Typography variant="h6" color="text.secondary">
          Application settings and integrations will be managed here
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Features: MCP configuration, AI settings, user preferences
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPage;