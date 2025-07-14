import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Chip,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Workflow } from '../../types/workflow';
import { workflowService } from '../../services/workflow/WorkflowService';

const WorkflowList: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
    } catch (err: any) {
      setError('Failed to load workflows');
      console.error('Error loading workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, workflow: Workflow) => {
    setAnchorEl(event.currentTarget);
    setSelectedWorkflow(workflow);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedWorkflow) {
      navigate(`/ai-assistant/workflows/${selectedWorkflow.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDuplicate = async () => {
    if (selectedWorkflow) {
      try {
        const { id, createdAt, updatedAt, createdBy, ...workflowData } = selectedWorkflow;
        const newWorkflow = await workflowService.createWorkflow({
          ...workflowData,
          name: `${workflowData.name} (Copy)`,
          status: 'draft',
        });
        await loadWorkflows();
      } catch (err: any) {
        setError('Failed to duplicate workflow');
      }
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedWorkflow) {
      try {
        await workflowService.deleteWorkflow(selectedWorkflow.id);
        await loadWorkflows();
        setDeleteDialogOpen(false);
      } catch (err: any) {
        setError('Failed to delete workflow');
      }
    }
    handleMenuClose();
  };

  const handleToggleStatus = async (workflow: Workflow) => {
    try {
      if (workflow.status === 'active') {
        await workflowService.pauseWorkflow(workflow.id);
      } else if (workflow.status === 'paused' || workflow.status === 'draft') {
        await workflowService.resumeWorkflow(workflow.id);
      }
      await loadWorkflows();
    } catch (err: any) {
      setError('Failed to update workflow status');
    }
  };

  const handleRun = async (workflow: Workflow) => {
    try {
      await workflowService.executeWorkflow(workflow.id);
      // Navigate to execution details or show success message
      navigate(`/ai-assistant/workflows/${workflow.id}/executions`);
    } catch (err: any) {
      setError('Failed to run workflow');
    }
  };

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedWorkflows = filteredWorkflows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'draft':
        return 'default';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckIcon fontSize="small" />;
      case 'paused':
        return <PauseIcon fontSize="small" />;
      case 'draft':
        return <EditIcon fontSize="small" />;
      case 'archived':
        return <ErrorIcon fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Workflow Automations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/ai-assistant/workflows/new')}
        >
          Create Workflow
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search workflows..."
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
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Run</TableCell>
              <TableCell>Run Count</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading workflows...
                </TableCell>
              </TableRow>
            ) : paginatedWorkflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No workflows found
                </TableCell>
              </TableRow>
            ) : (
              paginatedWorkflows.map((workflow) => (
                <TableRow key={workflow.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {workflow.name}
                      </Typography>
                      {workflow.description && (
                        <Typography variant="caption" color="text.secondary">
                          {workflow.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={workflow.status}
                      color={getStatusColor(workflow.status) as any}
                      size="small"
                      icon={getStatusIcon(workflow.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    {workflow.lastRun ? format(workflow.lastRun, 'MMM dd, yyyy HH:mm') : '-'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{workflow.runCount || 0}</Typography>
                      {workflow.errorCount && workflow.errorCount > 0 && (
                        <Chip
                          label={`${workflow.errorCount} errors`}
                          color="error"
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {format(workflow.createdAt, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {workflow.status === 'active' || workflow.status === 'paused' ? (
                        <Tooltip title={workflow.status === 'active' ? 'Pause' : 'Resume'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(workflow)}
                          >
                            {workflow.status === 'active' ? <PauseIcon /> : <PlayIcon />}
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Run Now">
                          <IconButton
                            size="small"
                            onClick={() => handleRun(workflow)}
                          >
                            <PlayIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/ai-assistant/workflows/${workflow.id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, workflow)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredWorkflows.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <CopyIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={() => {
          setDeleteDialogOpen(true);
          handleMenuClose();
        }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Workflow</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedWorkflow?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowList;