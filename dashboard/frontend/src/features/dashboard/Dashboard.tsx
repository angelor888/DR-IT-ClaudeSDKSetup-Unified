import { Paper, Typography, Box, Card, CardContent, CircularProgress, Stack } from '@mui/material'
import {
  People as PeopleIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { useGetAnalyticsQuery } from '@services/api/dashboardApi'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  trend?: string
}

const StatCard = ({ title, value, icon, color, trend }: StatCardProps) => (
  <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="h2">
            {value}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUpIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
              <Typography variant="body2" color="success.main">
                {trend}
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

export const Dashboard = () => {
  const { data: analytics, isLoading, error } = useGetAnalyticsQuery()

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography color="error">Failed to load analytics data</Typography>
      </Box>
    )
  }

  // Mock data for now
  const stats = {
    totalCustomers: analytics?.totalCustomers || 156,
    activeJobs: analytics?.activeJobs || 23,
    monthlyRevenue: analytics?.monthlyRevenue || '$45,230',
    completionRate: analytics?.completionRate || '94%',
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Welcome back! Here's what's happening with your business today.
      </Typography>

      <Stack spacing={3}>
        {/* Stat Cards */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
          gap={3}
        >
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<PeopleIcon sx={{ color: 'white' }} />}
            color="#1976d2"
            trend="+12% from last month"
          />
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            icon={<WorkIcon sx={{ color: 'white' }} />}
            color="#dc004e"
          />
          <StatCard
            title="Monthly Revenue"
            value={stats.monthlyRevenue}
            icon={<MoneyIcon sx={{ color: 'white' }} />}
            color="#4caf50"
            trend="+8% from last month"
          />
          <StatCard
            title="Completion Rate"
            value={stats.completionRate}
            icon={<TrendingUpIcon sx={{ color: 'white' }} />}
            color="#ff9800"
          />
        </Box>

        {/* Recent Activity and Quick Actions */}
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr' }}
          gap={3}
        >
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Activity timeline will be displayed here...
              </Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Quick action buttons will be displayed here...
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Service Health */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Service Health Monitor
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Service health status will be displayed here...
            </Typography>
          </Box>
        </Paper>
      </Stack>
    </Box>
  )
}