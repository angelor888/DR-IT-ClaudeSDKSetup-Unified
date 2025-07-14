import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Tab,
  Tabs,
  Chip,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  DateRange as DateRangeIcon,
  AutoAwesome as AIIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material';
import { predictiveAnalyticsService } from '../../services/analytics/PredictiveAnalyticsService';
import { AnalyticsDashboard, RevenueForecast } from '../../types/analytics';
import MetricCard from '../../components/analytics/MetricCard';
import RevenueForecastChart from '../../components/analytics/RevenueForecastChart';
import InsightCard from '../../components/analytics/InsightCard';
import JobCompletionList from '../../components/analytics/JobCompletionList';
import ResourceOptimizationPanel from '../../components/analytics/ResourceOptimizationPanel';
import CustomerChurnAnalysis from '../../components/analytics/CustomerChurnAnalysis';

const AnalyticsPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [forecastPeriod, setForecastPeriod] = useState<RevenueForecast['period']>('monthly');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await predictiveAnalyticsService.getAnalyticsDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError('Failed to load analytics data');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleExport = () => {
    // Export analytics data
    console.log('Exporting analytics data...');
    setAnchorEl(null);
  };

  const handleScheduleReport = () => {
    // Schedule automated reports
    console.log('Scheduling report...');
    setAnchorEl(null);
  };

  const handleInsightAction = (insightId: string, action: string) => {
    console.log('Executing insight action:', insightId, action);
    // Implement action execution
  };

  const handleForecastPeriodChange = async (period: RevenueForecast['period']) => {
    setForecastPeriod(period);
    // Reload forecast with new period
    try {
      const newForecast = await predictiveAnalyticsService.getRevenueForecast(period);
      if (dashboard) {
        setDashboard({
          ...dashboard,
          forecasts: {
            ...dashboard.forecasts,
            revenue: newForecast,
          },
        });
      }
    } catch (err) {
      console.error('Error updating forecast period:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadAnalytics}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Predictive Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered insights and forecasts for your business
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <DownloadIcon />
          </IconButton>
        </Box>
      </Box>

      {/* AI Insights Alert */}
      {dashboard.insights.length > 0 && dashboard.insights.some(i => i.impact === 'high') && (
        <Alert 
          severity="info" 
          icon={<AIIcon />}
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={() => setActiveTab(2)}>
              View All
            </Button>
          }
        >
          <Typography variant="subtitle2" fontWeight="medium">
            {dashboard.insights.filter(i => i.impact === 'high').length} high-impact insights available
          </Typography>
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {dashboard.metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.id}>
            <MetricCard
              metric={metric}
              sparklineData={[65, 68, 70, 72, 75, 78, 82, 85, 88]}
            />
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Revenue Forecast" 
            icon={<TrendingUpIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Operations" 
            icon={<ConstructionIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="AI Insights" 
            icon={<AIIcon />} 
            iconPosition="start"
            sx={{
              '& .MuiTab-iconWrapper': {
                color: dashboard.insights.some(i => i.impact === 'high') ? 'warning.main' : 'inherit',
              },
            }}
          />
          <Tab 
            label="Customers" 
            icon={<GroupsIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <RevenueForecastChart
              forecast={dashboard.forecasts.revenue}
              historicalData={[
                { date: new Date('2025-01-01'), value: 120000, label: 'Jan' },
                { date: new Date('2025-01-15'), value: 125000, label: 'Jan' },
                { date: new Date('2025-02-01'), value: 130000, label: 'Feb' },
                { date: new Date('2025-02-15'), value: 135000, label: 'Feb' },
              ]}
              onPeriodChange={handleForecastPeriodChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Seasonal Patterns
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Peak Season: March - August
                </Typography>
                <Typography variant="body2" paragraph>
                  Revenue typically increases by 35% during spring and summer months due to favorable weather conditions.
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Low Season: November - January
                </Typography>
                <Typography variant="body2">
                  Winter months show 25% lower revenue. Consider indoor projects and maintenance services.
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Revenue Drivers
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Kitchen Remodels</Typography>
                    <Typography variant="body2" fontWeight="medium">35%</Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 8, bgcolor: 'grey.200', borderRadius: 1 }}>
                    <Box sx={{ width: '35%', height: '100%', bgcolor: 'primary.main', borderRadius: 1 }} />
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Bathroom Renovations</Typography>
                    <Typography variant="body2" fontWeight="medium">25%</Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 8, bgcolor: 'grey.200', borderRadius: 1 }}>
                    <Box sx={{ width: '25%', height: '100%', bgcolor: 'primary.main', borderRadius: 1 }} />
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Deck & Outdoor</Typography>
                    <Typography variant="body2" fontWeight="medium">20%</Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 8, bgcolor: 'grey.200', borderRadius: 1 }}>
                    <Box sx={{ width: '20%', height: '100%', bgcolor: 'primary.main', borderRadius: 1 }} />
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <JobCompletionList predictions={dashboard.forecasts.jobCompletions} />
          </Grid>
          <Grid item xs={12} md={6}>
            <ResourceOptimizationPanel optimizations={dashboard.forecasts.resourceOptimization} />
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {dashboard.insights.map((insight) => (
            <Grid item xs={12} md={6} key={insight.id}>
              <InsightCard
                insight={insight}
                onAction={handleInsightAction}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <CustomerChurnAnalysis risks={dashboard.forecasts.customerChurn} />
      )}

      {/* Export Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={handleExport}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export to PDF
        </MenuItem>
        <MenuItem onClick={handleExport}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export to Excel
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleScheduleReport}>
          <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
          Schedule Report
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AnalyticsPage;