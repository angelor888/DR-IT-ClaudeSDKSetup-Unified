import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const CustomersPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Customers
      </Typography>
      
      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 300 }}>
        <Typography variant="h6" color="text.secondary">
          Customer management interface will be implemented here
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Features: Jobber integration, contact management, job history
        </Typography>
      </Paper>
    </Box>
  );
};

export default CustomersPage;