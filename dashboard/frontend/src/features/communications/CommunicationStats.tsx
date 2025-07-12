import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as TimeIcon,
  SentimentSatisfied as PositiveIcon,
  SentimentNeutral as NeutralIcon,
  SentimentDissatisfied as NegativeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useGetCommunicationStatsQuery } from '@services/api/communicationsApi';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';

interface CommunicationStatsProps {
  open: boolean;
  onClose: () => void;
}

export const CommunicationStats: React.FC<CommunicationStatsProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = React.useState<'day' | 'week' | 'month'>('week');

  // Calculate date range based on selection
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    
    return { startDate: start, endDate: end };
  };

  const { data: stats, isLoading } = useGetCommunicationStatsQuery(getDateRange());

  // Prepare chart data
  const sentimentData = stats ? [
    { name: 'Positive', value: stats.sentiment.positive, color: theme.palette.success.main },
    { name: 'Neutral', value: stats.sentiment.neutral, color: theme.palette.grey[500] },
    { name: 'Negative', value: stats.sentiment.negative, color: theme.palette.error.main },
  ] : [];

  const platformData = stats ? [
    { name: 'Slack', messages: stats.platforms.slack },
    { name: 'SMS', messages: stats.platforms.twilio },
    { name: 'Email', messages: stats.platforms.email },
  ] : [];

  // Format time
  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  };

  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 600 } },
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h5">Communication Analytics</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Time Range Selector */}
        <Box mb={3}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(_, newRange) => newRange && setTimeRange(newRange)}
            fullWidth
          >
            <ToggleButton value="day">Last 24 Hours</ToggleButton>
            <ToggleButton value="week">Last 7 Days</ToggleButton>
            <ToggleButton value="month">Last 30 Days</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {isLoading ? (
          <LinearProgress />
        ) : stats ? (
          <Stack spacing={3}>
            {/* Key Metrics */}
            <Grid container spacing={2}>
              <Grid size={6}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Messages
                        </Typography>
                        <Typography variant="h4">{stats.totalMessages}</Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <TrendingUpIcon fontSize="small" color="success" />
                          <Typography variant="caption" color="success.main">
                            +12%
                          </Typography>
                        </Stack>
                      </Box>
                      <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                        <EmailIcon />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={6}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Avg Response Time
                        </Typography>
                        <Typography variant="h4">
                          {formatResponseTime(stats.responseTime.average)}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <TrendingDownIcon fontSize="small" color="success" />
                          <Typography variant="caption" color="success.main">
                            -8%
                          </Typography>
                        </Stack>
                      </Box>
                      <Avatar sx={{ bgcolor: theme.palette.success.light }}>
                        <TimeIcon />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      AI Assistance Usage
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={4}>
                        <Stack alignItems="center">
                          <Typography variant="h6">{stats.aiAssistance.suggestionsUsed}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Suggestions Used
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid size={4}>
                        <Stack alignItems="center">
                          <Typography variant="h6">{stats.aiAssistance.autoResponsesSent}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Auto Responses
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid size={4}>
                        <Stack alignItems="center">
                          <Typography variant="h6">{stats.aiAssistance.summariesGenerated}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Summaries
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider />

            {/* Sentiment Analysis */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Message Sentiment
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid size={6}>
                  <Stack spacing={2} justifyContent="center" height="100%">
                    {sentimentData.map((item) => (
                      <Stack key={item.name} direction="row" alignItems="center" spacing={1}>
                        {item.name === 'Positive' && <PositiveIcon color="success" />}
                        {item.name === 'Neutral' && <NeutralIcon />}
                        {item.name === 'Negative' && <NegativeIcon color="error" />}
                        <Typography variant="body2">{item.name}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {item.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({Math.round((item.value / stats.totalMessages) * 100)}%)
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Platform Distribution */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Messages by Platform
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="messages" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Divider />

            {/* Response Time Distribution */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Response Time Analysis
              </Typography>
              <Grid container spacing={2}>
                <Grid size={3}>
                  <Stack alignItems="center">
                    <Typography variant="h6">
                      {formatResponseTime(stats.responseTime.fastest)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Fastest
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={3}>
                  <Stack alignItems="center">
                    <Typography variant="h6">
                      {formatResponseTime(stats.responseTime.average)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Average
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={3}>
                  <Stack alignItems="center">
                    <Typography variant="h6">
                      {formatResponseTime(stats.responseTime.median)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Median
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={3}>
                  <Stack alignItems="center">
                    <Typography variant="h6">
                      {formatResponseTime(stats.responseTime.slowest)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Slowest
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Top Contacts */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Most Active Contacts
              </Typography>
              <List>
                {stats.topContacts.slice(0, 5).map((contact: any, index: number) => (
                  <ListItem key={contact.id} disableGutters>
                    <ListItemAvatar>
                      <Avatar>{contact.name.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={`${contact.messageCount} messages`}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(contact.lastContact), 'MMM d')}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Stack>
        ) : (
          <Typography>No data available</Typography>
        )}
      </Box>
    </Drawer>
  );
};