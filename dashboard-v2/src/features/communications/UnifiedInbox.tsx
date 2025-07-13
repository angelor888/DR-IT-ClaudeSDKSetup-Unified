import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Badge,
  Tooltip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Archive as ArchiveIcon,
  MarkEmailRead as MarkReadIcon,
  Tag as SlackIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  Send as SendIcon,
  TrendingUp as UrgentIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  useGetMessagesQuery,
  useGetConversationsQuery,
  useMarkMessagesAsReadMutation,
  useGetCommunicationStatsQuery,
} from '../../services/api/communicationApi';
import {
  formatMessageTime,
  getStatusColor,
} from '../../types/communication.types';
import type { Message, Conversation } from '../../types/communication.types';

// Mock data for demo mode
const mockMessages: Message[] = [
  {
    id: '1',
    platform: 'slack',
    type: 'incoming',
    sender: {
      id: 's1',
      name: 'Sarah Johnson',
      avatar: undefined,
    },
    recipient: {
      id: 'r1',
      name: 'Support Team',
      channel: '#support',
    },
    content: 'Hey team, the client is asking about the server migration timeline. Can someone update them?',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
    status: 'read',
    thread: {
      id: 't1',
      messageCount: 3,
    },
  },
  {
    id: '2',
    platform: 'twilio',
    type: 'incoming',
    sender: {
      id: 's2',
      name: 'John Doe',
      phone: '+1234567890',
    },
    recipient: {
      id: 'r2',
      name: 'DuetRight IT',
      phone: '+0987654321',
    },
    content: 'Is someone available to help with my email setup today?',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    status: 'delivered',
  },
  {
    id: '3',
    platform: 'email',
    type: 'outgoing',
    sender: {
      id: 's3',
      name: 'DuetRight IT',
      email: 'support@duetright.com',
    },
    recipient: {
      id: 'r3',
      name: 'ABC Corporation',
      email: 'contact@abc.com',
    },
    content: 'Your monthly maintenance has been completed. Please find the report attached.',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
    status: 'sent',
    attachments: [
      {
        id: 'a1',
        type: 'file',
        name: 'maintenance-report.pdf',
        url: '#',
      },
    ],
  },
];

const mockConversations: Conversation[] = [
  {
    id: 'c1',
    title: 'Server Migration Discussion',
    participants: [
      { id: 'p1', name: 'Sarah Johnson' },
      { id: 'p2', name: 'Support Team' },
    ],
    platform: 'slack',
    lastMessage: mockMessages[0],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    updatedAt: mockMessages[0].timestamp,
    status: 'active',
  },
  {
    id: 'c2',
    title: 'Email Setup Support',
    participants: [
      { id: 'p3', name: 'John Doe' },
      { id: 'p4', name: 'DuetRight IT' },
    ],
    platform: 'twilio',
    lastMessage: mockMessages[1],
    unreadCount: 1,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    updatedAt: mockMessages[1].timestamp,
    status: 'active',
  },
];

const mockStats = {
  totalMessages: 156,
  sentMessages: 78,
  receivedMessages: 78,
  responseTime: {
    average: 15, // minutes
  },
  platforms: {
    slack: 45,
    twilio: 67,
    email: 44,
  },
  recentActivity: [
    { date: '2024-01-19', messageCount: 23 },
    { date: '2024-01-18', messageCount: 31 },
    { date: '2024-01-17', messageCount: 28 },
  ],
};

const UnifiedInbox: React.FC = () => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // For demo mode, we'll use mock data
  const { data: messagesData, isLoading: messagesLoading } = useGetMessagesQuery(
    { platform: 'all', limit: 50 },
    { skip: true }
  );
  const { data: conversationsData, isLoading: conversationsLoading } = useGetConversationsQuery(
    {},
    { skip: true }
  );
  const { data: statsData } = useGetCommunicationStatsQuery(
    {},
    { skip: true }
  );

  // Use mock data
  const messages = mockMessages;
  const conversations = mockConversations;
  const stats = mockStats;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const getPlatformIcon = (platform: Message['platform']) => {
    switch (platform) {
      case 'slack':
        return <SlackIcon />;
      case 'twilio':
        return <SmsIcon />;
      case 'email':
        return <EmailIcon />;
      default:
        return <EmailIcon />;
    }
  };

  const renderMessagesList = () => (
    <List>
      {messages.map((message) => (
        <React.Fragment key={message.id}>
          <ListItem
            sx={{
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              cursor: 'pointer',
            }}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={getPlatformIcon(message.platform)}
              >
                <Avatar>{message.sender.name.charAt(0)}</Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle2">
                    {message.sender.name}
                  </Typography>
                  {message.type === 'incoming' && message.status === 'delivered' && (
                    <Chip label="New" size="small" color="primary" />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {formatMessageTime(message.timestamp)}
                  </Typography>
                </Stack>
              }
              secondary={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {message.content}
                </Typography>
              }
            />
            <Stack direction="row" spacing={1}>
              <Tooltip title="Mark as read">
                <IconButton size="small">
                  <MarkReadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Archive">
                <IconButton size="small">
                  <ArchiveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </ListItem>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );

  const renderConversationsList = () => (
    <List>
      {conversations.map((conversation) => (
        <React.Fragment key={conversation.id}>
          <ListItem
            selected={selectedConversation === conversation.id}
            onClick={() => setSelectedConversation(conversation.id)}
            sx={{
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              cursor: 'pointer',
            }}
          >
            <ListItemAvatar>
              <Badge
                badgeContent={conversation.unreadCount}
                color="primary"
                overlap="circular"
              >
                <Avatar>{conversation.title.charAt(0)}</Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2">{conversation.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {conversation.lastMessage && formatMessageTime(conversation.lastMessage.timestamp)}
                  </Typography>
                </Stack>
              }
              secondary={
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={0.5}>
                    <Chip
                      label={conversation.platform}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${conversation.participants.length} participants`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Box>
              }
            />
          </ListItem>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Communications</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<RefreshIcon />}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<SendIcon />}>
            Compose
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Stats Cards */}
        <Stack spacing={2} sx={{ width: { xs: '100%', md: '250px' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Today's Activity
            </Typography>
            <Typography variant="h4">{stats.totalMessages}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total messages
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Response Time
            </Typography>
            <Typography variant="h4">{stats.responseTime.average}m</Typography>
            <Typography variant="body2" color="text.secondary">
              Average response
            </Typography>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Platform Breakdown
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Slack</Typography>
                <Typography variant="body2">{stats.platforms.slack}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">SMS</Typography>
                <Typography variant="body2">{stats.platforms.twilio}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Email</Typography>
                <Typography variant="body2">{stats.platforms.email}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Stack>

        {/* Messages/Conversations List */}
        <Paper sx={{ flex: 1 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
              <Tab label="All Messages" />
              <Tab label="Conversations" />
              <Tab label="Slack" />
              <Tab label="SMS" />
              <Tab label="Email" />
            </Tabs>
          </Box>

          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder="Search messages..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small">
                      <FilterIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {selectedTab === 0 && renderMessagesList()}
            {selectedTab === 1 && renderConversationsList()}
            {selectedTab === 2 && (
              <Alert severity="info">Slack messages will appear here when connected</Alert>
            )}
            {selectedTab === 3 && (
              <Alert severity="info">SMS messages will appear here when connected</Alert>
            )}
            {selectedTab === 4 && (
              <Alert severity="info">Email messages will appear here when connected</Alert>
            )}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
};

export default UnifiedInbox;