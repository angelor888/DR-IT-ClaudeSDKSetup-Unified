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
  Button,
} from '@mui/material';
import {
  Email,
  Psychology,
  Construction,
  AttachMoney,
  Schedule,
  Warning,
  Group,
  Engineering,
  Build,
  HomeWork,
} from '@mui/icons-material';

const DashboardPage: React.FC = () => {
  const metrics = [
    {
      title: 'Active Projects',
      value: '23',
      change: '+3 this month',
      icon: <Construction />,
      color: '#FFBB2F',
      subtitle: 'Construction Projects'
    },
    {
      title: 'Monthly Revenue',
      value: '$124K',
      change: '+18% vs last month',
      icon: <AttachMoney />,
      color: '#4caf50',
      subtitle: 'February 2025'
    },
    {
      title: 'Active Crew',
      value: '12',
      change: '4 teams on-site',
      icon: <Group />,
      color: '#037887',
      subtitle: 'Construction Teams'
    },
    {
      title: 'Project Completion',
      value: '94%',
      change: 'On-time delivery',
      icon: <Schedule />,
      color: '#2196f3',
      subtitle: 'This Quarter'
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
          <Grid xs={12} sm={6} md={3} key={index}>
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
                <Typography variant="h6" fontWeight="bold" color="text.primary">
                  {metric.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HomeWork color="primary" />
              Current Construction Projects
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[
                { name: 'Green Lake Townhouse Renovation', status: 'In Progress', progress: 75, location: 'Green Lake, Seattle' },
                { name: 'Capitol Hill Kitchen Remodel', status: 'Design Phase', progress: 25, location: 'Capitol Hill, Seattle' },
                { name: 'Ballard ADU Construction', status: 'Foundation', progress: 40, location: 'Ballard, Seattle' },
                { name: 'Queen Anne Bathroom Renovation', status: 'Final Touches', progress: 90, location: 'Queen Anne, Seattle' },
              ].map((project, index) => (
                <Card key={index} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {project.name}
                      </Typography>
                      <Chip 
                        label={project.status} 
                        size="small" 
                        color={project.progress > 80 ? 'success' : project.progress > 50 ? 'warning' : 'info'} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      📍 {project.location}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: '100%', 
                        height: 8, 
                        bgcolor: 'grey.200', 
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: `${project.progress}%`, 
                          height: '100%', 
                          bgcolor: 'primary.main',
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {project.progress}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
<Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Build color="primary" />
              Equipment & Alerts
            </Typography>
            
            {/* Weather Alert */}
            <Card sx={{ mb: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Weather Alert
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Heavy rain expected tomorrow. Consider indoor work for Green Lake project.
                </Typography>
              </CardContent>
            </Card>

            {/* Equipment Status */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Engineering />
              Equipment Status
            </Typography>
            
            {[
              { name: 'Excavator CAT 320', status: 'Active', location: 'Green Lake Site', color: '#4caf50' },
              { name: 'Concrete Mixer', status: 'Maintenance', location: 'Ballard Site', color: '#ff9800' },
              { name: 'Crane - 40ft', status: 'Available', location: 'Yard', color: '#2196f3' },
              { name: 'Compressor', status: 'Active', location: 'Capitol Hill', color: '#4caf50' },
            ].map((equipment, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                py: 1,
                borderBottom: index < 3 ? '1px solid' : 'none',
                borderColor: 'divider'
              }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {equipment.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {equipment.location}
                  </Typography>
                </Box>
                <Chip 
                  label={equipment.status} 
                  size="small" 
                  sx={{ 
                    bgcolor: equipment.color,
                    color: 'white',
                    fontWeight: 'bold'
                  }} 
                />
              </Box>
            ))}

            {/* Quick Actions */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<Schedule />}>
                Schedule Inspection
              </Button>
              <Button variant="outlined" size="small" startIcon={<Group />}>
                Manage Crews
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Group color="primary" />
              Crew Management
            </Typography>
            
            {[
              { name: 'Alpha Team', lead: 'Mike Johnson', project: 'Green Lake Townhouse', status: 'On-Site', count: 4 },
              { name: 'Beta Team', lead: 'Sarah Martinez', project: 'Capitol Hill Kitchen', status: 'Break', count: 3 },
              { name: 'Gamma Team', lead: 'David Chen', project: 'Ballard ADU', status: 'On-Site', count: 5 },
              { name: 'Delta Team', lead: 'Lisa Rodriguez', project: 'Queen Anne Bathroom', status: 'Travel', count: 2 },
            ].map((crew, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                py: 1.5,
                borderBottom: index < 3 ? '1px solid' : 'none',
                borderColor: 'divider'
              }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {crew.name} ({crew.count} workers)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lead: {crew.lead}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    📍 {crew.project}
                  </Typography>
                </Box>
                <Chip 
                  label={crew.status} 
                  size="small" 
                  color={crew.status === 'On-Site' ? 'success' : crew.status === 'Break' ? 'warning' : 'info'}
                />
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology color="primary" />
              AI Insights (Grok 4)
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                🎯 Today's Recommendations
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • Schedule concrete pour for Ballard ADU before rain tomorrow
              </Typography>
              <Typography variant="body2">
                • Alpha Team efficiency up 12% this week - consider bonus
              </Typography>
              <Typography variant="body2">
                • Queen Anne project ahead of schedule - potential early completion
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="info.main">
                📊 Performance Metrics
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • Project completion rate: 94% (↑5% vs last month)
              </Typography>
              <Typography variant="body2">
                • Customer satisfaction: 4.8/5.0 (↑0.2 vs last quarter)
              </Typography>
            </Box>

            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<Psychology />}
              sx={{ mt: 1 }}
            >
              Get More AI Insights
            </Button>
          </Paper>
        </Grid>

        <Grid xs={12}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email color="primary" />
              Recent Activity Feed
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              {[
                { time: '10 minutes ago', action: 'Concrete pour completed at Ballard ADU', type: 'success', user: 'David Chen' },
                { time: '2 hours ago', action: 'Weather alert: Rain expected tomorrow', type: 'warning', user: 'System' },
                { time: '3 hours ago', action: 'Alpha Team clocked in at Green Lake site', type: 'info', user: 'Mike Johnson' },
                { time: '5 hours ago', action: 'Material delivery scheduled for Capitol Hill project', type: 'info', user: 'Sarah Martinez' },
                { time: '1 day ago', action: 'Queen Anne project inspection passed', type: 'success', user: 'Lisa Rodriguez' },
                { time: '2 days ago', action: 'New customer inquiry: Fremont deck renovation', type: 'info', user: 'System' },
              ].map((activity, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  py: 1.5,
                  borderBottom: index < 5 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}>
                  <Chip 
                    label={activity.type === 'success' ? '✅' : activity.type === 'warning' ? '⚠️' : 'ℹ️'} 
                    size="small" 
                    sx={{ mr: 2, minWidth: '40px' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {activity.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.time} • {activity.user}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="outlined" size="small">
                View All Activity
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;