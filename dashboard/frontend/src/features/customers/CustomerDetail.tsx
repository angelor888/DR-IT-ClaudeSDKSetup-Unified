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
  Grid2 as Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Note as NoteIcon,
  History as HistoryIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetCustomerDetailsQuery,
  useDeleteCustomerMutation,
  useArchiveCustomerMutation,
  useSyncCustomerWithJobberMutation,
  useAddCustomerNoteMutation,
} from '@services/api/customerApi';
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
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const CustomerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  const { data: customer, isLoading } = useGetCustomerDetailsQuery(id!);
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();
  const [archiveCustomer, { isLoading: isArchiving }] = useArchiveCustomerMutation();
  const [syncCustomer, { isLoading: isSyncing }] = useSyncCustomerWithJobberMutation();
  const [addNote, { isLoading: isAddingNote }] = useAddCustomerNoteMutation();

  const handleDelete = async () => {
    try {
      await deleteCustomer(id!).unwrap();
      navigate('/customers');
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const handleArchive = async () => {
    if (!customer) return;
    try {
      await archiveCustomer({ id: id!, isArchived: !customer.isArchived }).unwrap();
    } catch (error) {
      console.error('Failed to archive customer:', error);
    }
  };

  const handleSync = async () => {
    try {
      await syncCustomer(id!).unwrap();
    } catch (error) {
      console.error('Failed to sync customer:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addNote({ customerId: id!, note: newNote }).unwrap();
      setNewNote('');
      setNoteDialogOpen(false);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  if (isLoading || !customer) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  const getSyncStatusAlert = () => {
    switch (customer.jobberSyncStatus) {
      case 'synced':
        return (
          <Alert severity="success" sx={{ mb: 2 }}>
            Successfully synced with Jobber on {new Date(customer.lastJobberSync!).toLocaleString()}
          </Alert>
        );
      case 'error':
        return (
          <Alert severity="error" sx={{ mb: 2 }}>
            Sync error: {customer.jobberSyncError}
          </Alert>
        );
      case 'pending':
        return (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Sync pending...
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {getCustomerName(customer)}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={isSyncing ? <CircularProgress size={20} /> : <SyncIcon />}
            variant="outlined"
            onClick={handleSync}
            disabled={isSyncing}
          >
            Sync with Jobber
          </Button>
          <Button
            startIcon={<EditIcon />}
            variant="contained"
            onClick={() => navigate(`/customers/${id}/edit`)}
          >
            Edit
          </Button>
          <IconButton
            onClick={handleArchive}
            disabled={isArchiving}
            color={customer.isArchived ? 'primary' : 'default'}
          >
            <ArchiveIcon />
          </IconButton>
          <IconButton
            onClick={() => setDeleteDialogOpen(true)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>

      {getSyncStatusAlert()}

      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card>
            <CardHeader title="Contact Information" />
            <CardContent>
              <Stack spacing={2}>
                {customer.email && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{customer.email}</Typography>
                  </Box>
                )}
                {customer.phone && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{customer.phone}</Typography>
                  </Box>
                )}
                {customer.address && (
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {formatAddress(customer.address)}
                    </Typography>
                  </Box>
                )}
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Preferred Contact Method
                  </Typography>
                  <Typography variant="body2">
                    {customer.preferredContactMethod || 'Not specified'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardHeader title="Tags" />
            <CardContent>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {customer.tags?.length ? (
                  customer.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardHeader title="Metadata" />
            <CardContent>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Customer ID
                  </Typography>
                  <Typography variant="body2">{customer.id}</Typography>
                </Box>
                {customer.jobberId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Jobber ID
                    </Typography>
                    <Typography variant="body2">{customer.jobberId}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {new Date(customer.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              aria-label="customer detail tabs"
            >
              <Tab icon={<NoteIcon />} label="Notes" />
              <Tab icon={<WorkIcon />} label="Jobs" />
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
                  {customer.notes ? (
                    <Typography variant="body2" whiteSpace="pre-wrap">
                      {customer.notes}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No notes available
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Jobs functionality will be implemented in the next phase
                </Typography>
              </CardContent>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  History tracking will be implemented in the next phase
                </Typography>
              </CardContent>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {getCustomerName(customer)}? This action cannot be undone.
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