import React, { useState, useCallback } from 'react';
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
  Menu,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Archive as ArchiveIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Sync as SyncIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  useGetJobListQuery, 
  useUpdateJobStatusMutation,
  useArchiveJobMutation,
  useRescheduleJobMutation
} from '@services/api/jobApi';
import { 
  getJobStatusColor, 
  getPriorityColor, 
  getJobDisplayName, 
  calculateJobProgress,
  formatJobDuration,
  isJobOverdue,
  getJobUrgencyScore
} from '@/types/job.types';
import type { Job, JobFilters } from '@/types/job.types';
import { getCustomerName } from '@/types/customer.types';

export const JobList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    limit: 25,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetJobListQuery(filters);
  const [updateJobStatus] = useUpdateJobStatusMutation();
  const [archiveJob] = useArchiveJobMutation();
  const [rescheduleJob] = useRescheduleJobMutation();

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  }, [searchTerm]);

  const handleStatusUpdate = useCallback(async (jobId: string, status: Job['status']) => {
    try {
      await updateJobStatus({ id: jobId, status }).unwrap();
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  }, [updateJobStatus]);

  const handleArchiveToggle = useCallback(async (jobId: string, isArchived: boolean) => {
    try {
      await archiveJob({ id: jobId, isArchived: !isArchived }).unwrap();
    } catch (error) {
      console.error('Failed to toggle archive status:', error);
    }
  }, [archiveJob]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, jobId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedJobId(jobId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJobId(null);
  };

  const getStatusChip = (status: Job['status']) => {
    const statusConfig = {
      active: { label: 'Active', color: 'primary' as const },
      completed: { label: 'Completed', color: 'success' as const },
      cancelled: { label: 'Cancelled', color: 'error' as const },
      on_hold: { label: 'On Hold', color: 'warning' as const },
      archived: { label: 'Archived', color: 'default' as const },
    };

    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getPriorityChip = (priority: Job['priority']) => {
    const priorityConfig = {
      low: { label: 'Low', color: 'success' as const },
      medium: { label: 'Medium', color: 'warning' as const },
      high: { label: 'High', color: 'error' as const },
      urgent: { label: 'Urgent', color: 'error' as const, variant: 'filled' as const },
    };

    const config = priorityConfig[priority];
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small"
        variant={config.variant || 'outlined'}
      />
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'jobNumber',
      headerName: 'Job #',
      width: 120,
      renderCell: (params: GridRenderCellParams<Job>) => (
        <Typography variant="body2" fontWeight="medium">
          {params.row.jobNumber}
        </Typography>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Job>) => (
        <Box>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {params.row.title}
          </Typography>
          {params.row.description && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: 180,
      renderCell: (params: GridRenderCellParams<Job>) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2" noWrap>
            {params.row.customer ? getCustomerName(params.row.customer) : 'No Customer'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams<Job>) => getStatusChip(params.row.status),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params: GridRenderCellParams<Job>) => getPriorityChip(params.row.priority),
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 120,
      renderCell: (params: GridRenderCellParams<Job>) => {
        const progress = calculateJobProgress(params.row);
        return (
          <Box width="100%">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption">{progress}%</Typography>
              {isJobOverdue(params.row) && (
                <Chip label="Overdue" color="error" size="small" variant="outlined" />
              )}
            </Box>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        );
      },
    },
    {
      field: 'startAt',
      headerName: 'Start Date',
      width: 130,
      renderCell: (params: GridRenderCellParams<Job>) => (
        <Box display="flex" alignItems="center" gap={1}>
          <ScheduleIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {params.row.startAt 
              ? new Date(params.row.startAt).toLocaleDateString()
              : 'Not scheduled'
            }
          </Typography>
        </Box>
      ),
    },
    {
      field: 'total',
      headerName: 'Value',
      width: 100,
      renderCell: (params: GridRenderCellParams<Job>) => (
        <Box display="flex" alignItems="center" gap={1}>
          <MoneyIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight="medium">
            ${params.row.total.toLocaleString()}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'estimatedDuration',
      headerName: 'Duration',
      width: 100,
      renderCell: (params: GridRenderCellParams<Job>) => (
        <Typography variant="body2">
          {formatJobDuration(params.row.estimatedDuration)}
        </Typography>
      ),
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 150,
      renderCell: (params: GridRenderCellParams<Job>) => (
        <Stack direction="row" spacing={0.5}>
          {params.row.tags?.slice(0, 2).map((tag, index) => (
            <Chip key={index} label={tag} size="small" variant="outlined" />
          ))}
          {params.row.tags && params.row.tags.length > 2 && (
            <Typography variant="caption" color="text.secondary">
              +{params.row.tags.length - 2}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Job>) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => navigate(`/jobs/${params.row.id}/edit`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 'active' && (
            <Tooltip title="Complete">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleStatusUpdate(params.row.id, 'completed')}
              >
                <CompleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={params.row.status === 'archived' ? 'Unarchive' : 'Archive'}>
            <IconButton
              size="small"
              onClick={() => handleArchiveToggle(params.row.id, params.row.status === 'archived')}
            >
              <ArchiveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, params.row.id)}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Jobs
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<CalendarIcon />}
            variant="outlined"
            onClick={() => navigate('/jobs/calendar')}
          >
            Calendar
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={() => navigate('/jobs/export')}
          >
            Export
          </Button>
          <Button
            startIcon={<SyncIcon />}
            variant="outlined"
            onClick={() => navigate('/jobs/sync')}
          >
            Sync
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => navigate('/jobs/new')}
          >
            Add Job
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
          <Button
            startIcon={<FilterIcon />}
            variant="outlined"
            size="small"
            onClick={() => navigate('/jobs/filters')}
          >
            Filters
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <DataGrid
          rows={data?.jobs || []}
          columns={columns}
          rowCount={data?.total || 0}
          loading={isLoading || isFetching}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationModel={{
            page: filters.page ? filters.page - 1 : 0,
            pageSize: filters.limit || 25,
          }}
          onPaginationModelChange={(model) => {
            setFilters(prev => ({
              ...prev,
              page: model.page + 1,
              limit: model.pageSize,
            }));
          }}
          onSortModelChange={(model) => {
            if (model.length > 0) {
              setFilters(prev => ({
                ...prev,
                sortBy: model[0].field as any,
                sortOrder: model[0].sort || 'asc',
              }));
            }
          }}
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/jobs/${params.row.id}`)}
          getRowClassName={(params) => {
            const urgencyScore = getJobUrgencyScore(params.row);
            if (urgencyScore >= 50) return 'urgent-job';
            if (isJobOverdue(params.row)) return 'overdue-job';
            return '';
          }}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
            '& .urgent-job': {
              backgroundColor: 'rgba(244, 67, 54, 0.04)',
            },
            '& .overdue-job': {
              backgroundColor: 'rgba(255, 152, 0, 0.04)',
            },
          }}
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/jobs/${selectedJobId}`);
          handleMenuClose();
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/jobs/${selectedJobId}/duplicate`);
          handleMenuClose();
        }}>
          Duplicate Job
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/jobs/${selectedJobId}/visits`);
          handleMenuClose();
        }}>
          Manage Visits
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/jobs/${selectedJobId}/sync`);
          handleMenuClose();
        }}>
          Sync with Jobber
        </MenuItem>
      </Menu>
    </Box>
  );
};