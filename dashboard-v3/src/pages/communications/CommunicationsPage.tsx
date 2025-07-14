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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';

interface Communication {
  id: string;
  type: 'email' | 'sms' | 'slack' | 'phone';
  subject: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high';
  project?: string;
}

const CommunicationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);

  const communications: Communication[] = [
    {
      id: '1',
      type: 'email',
      subject: 'Kitchen renovation timeline update',
      sender: 'john.miller@email.com',
      recipient: 'demo@duetright.com',
      content: 'Hi there, I wanted to check on the timeline for our kitchen renovation. When can we expect the cabinets to be installed?',
      timestamp: '2025-01-14T10:30:00Z',
      status: 'unread',
      priority: 'medium',
      project: 'Kitchen Renovation'
    },
    {
      id: '2',
      type: 'sms',
      subject: 'Crew arrival notification',
      sender: 'Mike Johnson',
      recipient: 'Sarah Martinez',
      content: 'Alpha team is 15 minutes late due to traffic. ETA 8:45 AM at Green Lake site.',
      timestamp: '2025-01-14T08:30:00Z',
      status: 'read',
      priority: 'high',
      project: 'Green Lake Townhouse'
    },
    {
      id: '3',
      type: 'slack',
      subject: 'Weather alert - rain expected',
      sender: 'Weather Bot',
      recipient: '#construction-alerts',
      content: 'Heavy rain expected tomorrow 1/15. Consider indoor work for exterior projects.',
      timestamp: '2025-01-14T07:00:00Z',
      status: 'read',
      priority: 'medium'
    },
    {
      id: '4',
      type: 'email',
      subject: 'Invoice approval needed',
      sender: 'maria.r@email.com',
      recipient: 'billing@duetright.com',
      content: 'Please review and approve the invoice for materials delivered to the Ballard ADU project.',
      timestamp: '2025-01-13T16:45:00Z',
      status: 'replied',
      priority: 'low',
      project: 'ADU Construction'
    },
    {
      id: '5',
      type: 'phone',
      subject: 'Emergency repair request',
      sender: 'David Chen',
      recipient: 'Emergency Line',
      content: 'Pipe burst in basement during renovation. Need immediate assistance.',
      timestamp: '2025-01-13T14:20:00Z',
      status: 'read',
      priority: 'high',
      project: 'Queen Anne Bathroom'
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <EmailIcon />;
      case 'sms': return <SmsIcon />;
      case 'slack': return <SmsIcon />;
      case 'phone': return <PhoneIcon />;
      default: return <EmailIcon />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return '#1976d2';
      case 'sms': return '#4caf50';
      case 'slack': return '#7b1fa2';
      case 'phone': return '#ff9800';
      default: return '#757575';
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

  const filterCommunications = (status?: string) => {
    let filtered = communications.filter(comm =>
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (status) {
      filtered = filtered.filter(comm => comm.status === status);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getTabCommunications = () => {
    switch (activeTab) {
      case 0: return filterCommunications();
      case 1: return filterCommunications('unread');
      case 2: return filterCommunications('read');
      case 3: return filterCommunications('archived');
      default: return filterCommunications();
    }
  };

  const unreadCount = communications.filter(c => c.status === 'unread').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Communications Center
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsComposeDialogOpen(true)}
          sx={{
            backgroundColor: '#FFBB2F',
            color: '#2C2B2E',
            '&:hover': {
              backgroundColor: '#FF8A3D',
            },
          }}
        >
          Compose
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {communications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Messages
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {unreadCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unread Messages
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {communications.filter(c => c.status === 'replied').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Replied Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {communications.filter(c => c.priority === 'high').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
            <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error">
                  All Messages
                </Badge>
              } 
            />
            <Tab label="Unread" />
            <Tab label="Read" />
            <Tab label="Archived" />
          </Tabs>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search communications..."
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
        </Box>

        <List>
          {getTabCommunications().map((comm) => (
            <React.Fragment key={comm.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: comm.status === 'unread' ? 'action.hover' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
                onClick={() => setSelectedComm(comm)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getTypeColor(comm.type) }}>
                    {getTypeIcon(comm.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={comm.status === 'unread' ? 'bold' : 'normal'}>
                        {comm.subject}
                      </Typography>
                      <Chip 
                        label={comm.priority} 
                        size="small" 
                        sx={{ 
                          bgcolor: getPriorityColor(comm.priority),
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                      {comm.project && (
                        <Chip 
                          label={comm.project} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        From: {comm.sender}
                      </Typography>
                      <br />
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {comm.content}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comm.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Compose Dialog */}
      <Dialog open={isComposeDialogOpen} onClose={() => setIsComposeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Compose Message</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Type"
                margin="normal"
                defaultValue="email"
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="slack">Slack</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Recipient"
                margin="normal"
                required
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Subject"
                margin="normal"
                required
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                margin="normal"
                defaultValue="medium"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Project (Optional)"
                margin="normal"
                placeholder="e.g., Kitchen Renovation"
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Message"
                margin="normal"
                multiline
                rows={6}
                placeholder="Type your message here..."
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsComposeDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SendIcon />}
            onClick={() => setIsComposeDialogOpen(false)}
            sx={{
              backgroundColor: '#FFBB2F',
              color: '#2C2B2E',
              '&:hover': {
                backgroundColor: '#FF8A3D',
              },
            }}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Detail Dialog */}
      <Dialog 
        open={Boolean(selectedComm)} 
        onClose={() => setSelectedComm(null)} 
        maxWidth="sm" 
        fullWidth
      >
        {selectedComm && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: getTypeColor(selectedComm.type) }}>
                  {getTypeIcon(selectedComm.type)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedComm.subject}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    From: {selectedComm.sender}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedComm.content}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(selectedComm.timestamp).toLocaleString()}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button startIcon={<ReplyIcon />}>
                Reply
              </Button>
              <Button startIcon={<ArchiveIcon />}>
                Archive
              </Button>
              <Button onClick={() => setSelectedComm(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CommunicationsPage;