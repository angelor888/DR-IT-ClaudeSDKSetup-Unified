import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import {
  People as PeopleIcon,
  Work as WorkIcon,
  Message as MessageIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          {trend !== undefined && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUpIcon 
                fontSize="small" 
                sx={{ color: trend > 0 ? 'success.main' : 'error.main' }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: trend > 0 ? 'success.main' : 'error.main',
                  ml: 0.5 
                }}
              >
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            p: 2,
            borderRadius: '50%',
            backgroundColor: `${color}.light`,
            color: `${color}.main`,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  // Mock data - in real app, this would come from API
  const stats = {
    customers: 156,
    activeJobs: 23,
    messages: 89,
    revenue: '$12,345',
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats.customers}
            icon={<PeopleIcon />}
            color="primary"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            icon={<WorkIcon />}
            color="secondary"
            trend={-3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Messages"
            value={stats.messages}
            icon={<MessageIcon />}
            color="info"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue"
            value={stats.revenue}
            icon={<TrendingUpIcon />}
            color="success"
            trend={15}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                No recent activity to display
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Quick actions will appear here
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;