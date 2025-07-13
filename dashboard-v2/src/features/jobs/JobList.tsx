import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  TextField,
  InputAdornment,
  LinearProgress,
  Alert,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Archive as ArchiveIcon,
  Search as SearchIcon,
  Sync as SyncIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetJobListQuery } from '../../services/api/jobApi';
import { 
  getJobStatusColor, 
  getPriorityColor, 
  getJobDisplayName, 
  calculateJobProgress,
  formatJobDuration,
  isJobOverdue
} from '../../types/job.types';
import type { Job, JobFilters } from '../../types/job.types';

// Mock data for demo mode
const mockJobs: Job[] = [
  {
    id: '1',
    jobNumber: 'JOB-001',
    title: 'Network Setup',
    description: 'Complete network infrastructure setup',
    status: 'active',
    priority: 'high',
    customerId: '1',
    customer: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      isArchived: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    startAt: '2024-01-20T09:00:00Z',
    endAt: '2024-01-20T17:00:00Z',
    estimatedDuration: 480,
    total: 2500,
    progressPercentage: 35,
    tags: ['Network', 'Installation'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    jobNumber: 'JOB-002',
    title: 'Server Maintenance',
    description: 'Monthly server maintenance and updates',
    status: 'completed',
    priority: 'medium',
    customerId: '2',
    customer: {
      id: '2',
      companyName: 'ABC Corporation',
      email: 'contact@abc.com',
      isArchived: false,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    },
    startAt: '2024-01-18T10:00:00Z',
    endAt: '2024-01-18T14:00:00Z',
    estimatedDuration: 240,
    total: 800,
    progressPercentage: 100,
    tags: ['Maintenance', 'Server'],
    completedAt: '2024-01-18T13:30:00Z',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-18T13:30:00Z',
  },
  {
    id: '3',
    jobNumber: 'JOB-003',
    title: 'Email Migration',
    description: 'Migrate email system to cloud',
    status: 'active',
    priority: 'urgent',
    customerId: '3',
    customer: {
      id: '3',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      isArchived: false,
      createdAt: '2024-01-05T10:00:00Z',
      updatedAt: '2024-01-05T10:00:00Z',
    },
    startAt: '2024-01-19T08:00:00Z',
    endAt: '2024-01-19T12:00:00Z',
    estimatedDuration: 240,
    total: 1200,
    progressPercentage: 60,
    tags: ['Email', 'Cloud', 'Migration'],
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
  },
];

export const JobList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    limit: 25,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Use real API
  const { data, isLoading, error } = useGetJobListQuery(filters);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // In real implementation, this would update filters
  };

  const handleAddJob = () => {
    navigate('/jobs/new');
  };

  const handleEditJob = (id: string) => {
    navigate(`/jobs/${id}`);
  };

  const getCustomerName = (job: Job) => {
    if (job.customer?.companyName) {
      return job.customer.companyName;
    }
    if (job.customer?.firstName || job.customer?.lastName) {
      return `${job.customer.firstName || ''} ${job.customer.lastName || ''}`.trim();
    }
    return 'Unknown Customer';
  };

  const columns: GridColDef[] = [
    {
      field: 'jobNumber',
      headerName: 'Job #',
      width: 100,
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'customer',
      headerName: 'Customer',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => getCustomerName(params.row),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: getJobStatusColor(params.value),
            color: 'white',
          }}
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: getPriorityColor(params.value),
            color: 'white',
          }}
        />
      ),
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={calculateJobProgress(params.row)} 
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" sx={{ mt: 0.5 }}>
            {calculateJobProgress(params.row)}%
          </Typography>
        </Box>
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 100,
      valueGetter: (params) => `$${params.value.toFixed(2)}`,
    },
    {
      field: 'startAt',
      headerName: 'Start Date',
      width: 120,
      valueGetter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleEditJob(params.row.id)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 'active' && (
            <Tooltip title="Mark Complete">
              <IconButton size="small">
                <CompleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="View Calendar">
            <IconButton size="small">
              <CalendarIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading jobs. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Jobs</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<CalendarIcon />}
          >
            Calendar View
          </Button>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
          >
            Sync with Jobber
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddJob}
          >
            New Job
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search jobs by title, customer, or job number..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={data?.jobs || []}
          columns={columns}
          pageSize={25}
          rowsPerPageOptions={[25, 50, 100]}
          loading={isLoading}
          disableSelectionOnClick
          getRowClassName={(params) => 
            isJobOverdue(params.row) ? 'overdue-row' : ''
          }
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .overdue-row': {
              backgroundColor: 'rgba(255, 0, 0, 0.05)',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default JobList;