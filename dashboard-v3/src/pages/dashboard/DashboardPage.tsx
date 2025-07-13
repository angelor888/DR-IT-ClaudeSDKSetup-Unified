import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import {
  People,
  Work,
  Email,
  Psychology,
} from '@mui/icons-material';

const DashboardPage: React.FC = () => {
  const metrics = [
    {
      title: 'Total Customers',
      value: '1,234',
      change: '+12%',
      icon: <People />,
      color: '#1976d2',
    },
    {
      title: 'Active Jobs',
      value: '87',
      change: '+5%',
      icon: <Work />,
      color: '#388e3c',
    },
    {
      title: 'Communications',
      value: '456',
      change: '+23%',
      icon: <Email />,
      color: '#f57c00',
    },
    {
      title: 'AI Insights',
      value: '12',
      change: 'New',
      icon: <Psychology />,
      color: '#7b1fa2',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome to DuetRight Dashboard v3
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        AI-powered business management with Grok 4 and MCP integration
      </Typography>

      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}05 100%)`,
                border: `1px solid ${metric.color}20`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      backgroundColor: metric.color,
                      mr: 2,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {metric.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {metric.value}
                    </Typography>
                    <Chip 
                      label={metric.change} 
                      size="small" 
                      color="success"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {metric.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '80%',
              color: 'text.secondary'
            }}>
              <Typography>
                Real-time activity feed will be implemented here
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              AI Insights
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '80%',
              color: 'text.secondary'
            }}>
              <Typography textAlign="center">
                Grok 4 AI insights will appear here
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;