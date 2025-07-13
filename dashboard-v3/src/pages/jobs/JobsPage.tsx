import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const JobsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Jobs
      </Typography>
      
      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 300 }}>
        <Typography variant="h6" color="text.secondary">
          Job management interface will be implemented here
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Features: Scheduling, progress tracking, Matterport integration
        </Typography>
      </Paper>
    </Box>
  );
};

export default JobsPage;