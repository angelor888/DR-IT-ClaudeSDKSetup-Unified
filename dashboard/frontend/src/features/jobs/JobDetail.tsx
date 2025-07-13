import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Tab,
  Tabs,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Note as NoteIcon,
  History as HistoryIcon,
  Assignment as TaskIcon,
  Sync as SyncIcon,
  FileCopy as DuplicateIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetJobDetailsQuery,
  useUpdateJobStatusMutation,
  useDeleteJobMutation,
  useSyncJobWithJobberMutation,
  useAddJobNoteMutation,
  useDuplicateJobMutation,
} from '@services/api/jobApi';
import {
  getJobStatusColor,
  getPriorityColor,
  getJobDisplayName,
  calculateJobProgress,
  formatJobDuration,
  isJobOverdue,
} from '@/types/job.types';
import { getCustomerName, formatAddress } from '@/types/customer.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`job-tabpanel-${index}`}
      aria-labelledby={`job-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const JobDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const { data: job, isLoading } = useGetJobDetailsQuery(id!);
  const [updateJobStatus, { isLoading: isUpdatingStatus }] = useUpdateJobStatusMutation();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();
  const [syncJob, { isLoading: isSyncing }] = useSyncJobWithJobberMutation();
  const [addNote, { isLoading: isAddingNote }] = useAddJobNoteMutation();
  const [duplicateJob, { isLoading: isDuplicating }] = useDuplicateJobMutation();

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateJobStatus({ id: id!, status: status as any }).unwrap();
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob(id!).unwrap();
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleSync = async () => {
    try {
      await syncJob(id!).unwrap();
    } catch (error) {
      console.error('Failed to sync job:', error);
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicatedJob = await duplicateJob({ id: id!, title: `${job?.title} (Copy)` }).unwrap();
      navigate(`/jobs/${duplicatedJob.id}/edit`);
    } catch (error) {
      console.error('Failed to duplicate job:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addNote({ jobId: id!, note: newNote, isInternal: isInternalNote }).unwrap();
      setNewNote('');
      setNoteDialogOpen(false);
      setIsInternalNote(false);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  if (isLoading || !job) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  const progress = calculateJobProgress(job);
  const isOverdue = isJobOverdue(job);

  const getStatusActionButtons = () => {
    switch (job.status) {
      case 'active':
        return (
          <>
            <Button
              startIcon={<CompleteIcon />}
              variant="contained"
              color="success"
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdatingStatus}
            >
              Complete Job
            </Button>
            <Button
              startIcon={<ScheduleIcon />}
              variant="outlined"
              onClick={() => handleStatusUpdate('on_hold')}
              disabled={isUpdatingStatus}
            >
              Put On Hold
            </Button>
          </>
        );
      case 'on_hold':
        return (
          <Button
            startIcon={<StartIcon />}
            variant="contained"
            onClick={() => handleStatusUpdate('active')}
            disabled={isUpdatingStatus}
          >
            Resume Job
          </Button>
        );
      case 'completed':
        return (
          <Button
            startIcon={<StartIcon />}
            variant="outlined"
            onClick={() => handleStatusUpdate('active')}
            disabled={isUpdatingStatus}
          >
            Reopen Job
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1">
            {getJobDisplayName(job)}
          </Typography>
          <Stack direction="row" spacing={1} mt={1}>
            <Chip 
              label={job.status.replace('_', ' ').toUpperCase()} 
              sx={{ backgroundColor: getJobStatusColor(job.status), color: 'white' }}
            />
            <Chip 
              label={job.priority.toUpperCase()} 
              sx={{ backgroundColor: getPriorityColor(job.priority), color: 'white' }}
            />
            {isOverdue && <Chip label="OVERDUE" color="error" />}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          {getStatusActionButtons()}
          <Button
            startIcon={isSyncing ? <CircularProgress size={20} /> : <SyncIcon />}
            variant="outlined"
            onClick={handleSync}
            disabled={isSyncing}
          >
            Sync
          </Button>
          <Button
            startIcon={<DuplicateIcon />}
            variant="outlined"
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            Duplicate
          </Button>
          <Button
            startIcon={<EditIcon />}
            variant="contained"
            onClick={() => navigate(`/jobs/${id}/edit`)}
          >
            Edit
          </Button>
          <IconButton
            onClick={() => setDeleteDialogOpen(true)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>

      {isOverdue && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This job is overdue! Expected completion: {new Date(job.endAt!).toLocaleString()}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title="Job Information" />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Job Number
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {job.jobNumber}
                  </Typography>
                </Box>
                
                {job.customer && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Customer
                      </Typography>
                      <Typography variant="body2">
                        {getCustomerName(job.customer)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {job.property?.address && (
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <LocationIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Property Address
                      </Typography>
                      <Typography variant="body2">
                        {formatAddress(job.property.address)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress} 
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" fontWeight="medium">
                      {progress}%
                    </Typography>
                  </Box>
                </Box>

                {job.startAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Scheduled Start
                    </Typography>
                    <Typography variant="body2">
                      {new Date(job.startAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {job.endAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Expected Completion
                    </Typography>
                    <Typography variant="body2">
                      {new Date(job.endAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {job.estimatedDuration && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Estimated Duration
                    </Typography>
                    <Typography variant="body2">
                      {formatJobDuration(job.estimatedDuration)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardHeader title="Financial Summary" />
            <CardContent>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">${job.subtotal.toLocaleString()}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Tax:</Typography>
                  <Typography variant="body2">${job.taxAmount.toLocaleString()}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">${job.total.toLocaleString()}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {job.tags && job.tags.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardHeader title="Tags" />
              <CardContent>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {job.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              aria-label="job detail tabs"
            >
              <Tab icon={<NoteIcon />} label="Notes" />
              <Tab icon={<TaskIcon />} label="Tasks" />
              <Tab icon={<HistoryIcon />} label="History" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <CardContent>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<NoteIcon />}
                    onClick={() => setNoteDialogOpen(true)}
                  >
                    Add Note
                  </Button>
                  
                  {job.description && (
                    <Box>
                      <Typography variant="h6" gutterBottom>Description</Typography>
                      <Typography variant="body2" whiteSpace="pre-wrap">
                        {job.description}
                      </Typography>
                    </Box>
                  )}

                  {job.notes && (
                    <Box>
                      <Typography variant="h6" gutterBottom>Customer Notes</Typography>
                      <Typography variant="body2" whiteSpace="pre-wrap">
                        {job.notes}
                      </Typography>
                    </Box>
                  )}

                  {job.internalNotes && (
                    <Box>
                      <Typography variant="h6" gutterBottom>Internal Notes</Typography>
                      <Typography variant="body2" whiteSpace="pre-wrap">
                        {job.internalNotes}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <CardContent>
                {job.milestones && job.milestones.length > 0 ? (
                  <List>
                    {job.milestones.map((milestone) => (
                      <ListItem key={milestone.id} divider>
                        <ListItemIcon>
                          <Chip 
                            size="small"
                            color={milestone.status === 'completed' ? 'success' : 'default'}
                            label={milestone.status === 'completed' ? '✓' : '○'}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={milestone.title}
                          secondary={
                            <Box>
                              <Typography variant="body2">{milestone.description}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Status: {milestone.status}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tasks defined for this job
                  </Typography>
                )}
              </CardContent>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Job history and activity log will be implemented in the next phase
                </Typography>
              </CardContent>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {getJobDisplayName(job)}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note here..."
            sx={{ mt: 2 }}
          />
          <Box mt={2}>
            <Typography variant="caption">
              <input
                type="checkbox"
                checked={isInternalNote}
                onChange={(e) => setIsInternalNote(e.target.checked)}
              />
              {' '}Internal note (not visible to customer)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddNote}
            variant="contained"
            disabled={isAddingNote || !newNote.trim()}
          >
            {isAddingNote ? <CircularProgress size={24} /> : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};