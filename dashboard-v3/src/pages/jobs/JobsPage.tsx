import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  LinearProgress,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

interface Job {
  id: string;
  title: string;
  customer: string;
  address: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  budget: string;
  estimatedDuration: string;
  assignedCrew: string;
  scheduledDate: string;
  description: string;
}

const JobsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const jobs: Job[] = [
    {
      id: '1',
      title: 'Kitchen Renovation',
      customer: 'John & Sarah Miller',
      address: '1234 Green Lake Ave, Seattle, WA',
      status: 'in_progress',
      priority: 'high',
      progress: 75,
      budget: '$45,000',
      estimatedDuration: '6 weeks',
      assignedCrew: 'Alpha Team',
      scheduledDate: '2025-01-15',
      description: 'Complete kitchen remodel with new cabinets, countertops, and appliances'
    },
    {
      id: '2',
      title: 'Bathroom Remodel',
      customer: 'Capital Hill Properties LLC',
      address: '567 Capitol Hill St, Seattle, WA',
      status: 'scheduled',
      priority: 'medium',
      progress: 0,
      budget: '$25,000',
      estimatedDuration: '4 weeks',
      assignedCrew: 'Beta Team',
      scheduledDate: '2025-02-01',
      description: 'Master bathroom renovation with walk-in shower and new fixtures'
    },
    {
      id: '3',
      title: 'ADU Construction',
      customer: 'Maria Rodriguez',
      address: '890 Ballard Ave, Seattle, WA',
      status: 'in_progress',
      priority: 'high',
      progress: 40,
      budget: '$125,000',
      estimatedDuration: '12 weeks',
      assignedCrew: 'Gamma Team',
      scheduledDate: '2024-12-01',
      description: 'New accessory dwelling unit construction from ground up'
    },
    {
      id: '4',
      title: 'Deck Installation',
      customer: 'David & Lisa Chen',
      address: '432 Queen Anne St, Seattle, WA',
      status: 'completed',
      priority: 'low',
      progress: 100,
      budget: '$18,000',
      estimatedDuration: '2 weeks',
      assignedCrew: 'Delta Team',
      scheduledDate: '2024-11-15',
      description: 'Composite deck installation with integrated lighting'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'on_hold': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const filterJobsByStatus = (status?: string) => {
    let filtered = jobs.filter(job =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (status) {
      filtered = filtered.filter(job => job.status === status);
    }

    return filtered;
  };

  const getTabJobs = () => {
    switch (activeTab) {
      case 0: return filterJobsByStatus();
      case 1: return filterJobsByStatus('scheduled');
      case 2: return filterJobsByStatus('in_progress');
      case 3: return filterJobsByStatus('completed');
      default: return filterJobsByStatus();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Job Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
          sx={{
            backgroundColor: '#FFBB2F',
            color: '#2C2B2E',
            '&:hover': {
              backgroundColor: '#FF8A3D',
            },
          }}
        >
          Create Job
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {jobs.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {jobs.filter(j => j.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {jobs.filter(j => j.status === 'scheduled').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scheduled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                $213K
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
            <Tab label="All Jobs" />
            <Tab label="Scheduled" />
            <Tab label="In Progress" />
            <Tab label="Completed" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          >
            Filter
          </Button>
        </Box>

        <Grid container spacing={2}>
          {getTabJobs().map((job) => (
            <Grid xs={12} lg={6} key={job.id}>
              <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <WorkIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {job.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={job.status.replace('_', ' ')} 
                            size="small" 
                            color={getStatusColor(job.status)}
                          />
                          <Chip 
                            label={job.priority} 
                            size="small" 
                            sx={{ 
                              bgcolor: getPriorityColor(job.priority),
                              color: 'white'
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {job.customer}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {job.address}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Crew: {job.assignedCrew} • Duration: {job.estimatedDuration}
                      </Typography>
                    </Box>
                  </Box>

                  {job.status === 'in_progress' && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Progress
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {job.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={job.progress} 
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Budget
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {job.budget}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        Scheduled
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(job.scheduledDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {job.description}
                  </Typography>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AssignmentIcon />}
                    fullWidth
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem>Priority: High</MenuItem>
        <MenuItem>Priority: Medium</MenuItem>
        <MenuItem>Priority: Low</MenuItem>
        <Divider />
        <MenuItem>This Week</MenuItem>
        <MenuItem>This Month</MenuItem>
        <MenuItem>Next Month</MenuItem>
      </Menu>

      {/* Add Job Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Job</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                margin="normal"
                required
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer"
                margin="normal"
                required
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Address"
                margin="normal"
                required
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget"
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Duration"
                margin="normal"
                placeholder="e.g., 4 weeks"
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Scheduled Date"
                type="date"
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Assigned Crew"
                margin="normal"
                placeholder="e.g., Alpha Team"
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Description"
                margin="normal"
                multiline
                rows={3}
                placeholder="Detailed job description..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setIsAddDialogOpen(false)}
            sx={{
              backgroundColor: '#FFBB2F',
              color: '#2C2B2E',
              '&:hover': {
                backgroundColor: '#FF8A3D',
              },
            }}
          >
            Create Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobsPage;