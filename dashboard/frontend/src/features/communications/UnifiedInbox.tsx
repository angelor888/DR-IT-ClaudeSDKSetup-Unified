import React, { useState, useEffect } from 'react';
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
  ListItemSecondaryAction,
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
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Archive as ArchiveIcon,
  MarkEmailRead as MarkReadIcon,
  AutoAwesome as AIIcon,
  Tag as SlackIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  Send as SendIcon,
  Category as CategoryIcon,
  SentimentSatisfied as SentimentIcon,
  MoreVert as MoreIcon,
  TrendingUp as UrgentIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  useGetMessagesQuery,
  useGetConversationsQuery,
  useMarkMessagesAsReadMutation,
  useBulkCategorizeMessagesMutation,
  useGetCommunicationStatsQuery,
} from '@services/api/communicationsApi';
import type { UnifiedMessage, Conversation } from './types';
import { formatDistanceToNow } from 'date-fns';

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
      id={`inbox-tabpanel-${index}`}
      aria-labelledby={`inbox-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

export const UnifiedInbox: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [aiCategorizing, setAiCategorizing] = useState(false);
  
  // Filters
  const [platformFilter, setPlatformFilter] = useState<'all' | 'slack' | 'twilio'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // API queries
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useGetMessagesQuery({
    platform: platformFilter === 'all' ? undefined : platformFilter,
    search: searchQuery || undefined,
    sentiment: sentimentFilter === 'all' ? undefined : sentimentFilter,
    urgency: urgencyFilter === 'all' ? undefined : urgencyFilter,
    limit: 50,
  });

  const { data: conversationsData, isLoading: conversationsLoading } = useGetConversationsQuery({
    platform: platformFilter === 'all' ? undefined : platformFilter,
    status: 'active',
    limit: 20,
  });

  const { data: stats } = useGetCommunicationStatsQuery({});

  const [markAsRead] = useMarkMessagesAsReadMutation();
  const [categorizeMessages] = useBulkCategorizeMessagesMutation();

  // Handle AI categorization
  const handleAICategorize = async () => {
    if (selectedMessages.length === 0) return;
    
    setAiCategorizing(true);
    try {
      await categorizeMessages(selectedMessages).unwrap();
      setSelectedMessages([]);
      refetchMessages();
    } catch (error) {
      console.error('Failed to categorize messages:', error);
    } finally {
      setAiCategorizing(false);
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
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

  // Get sentiment color
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return theme.palette.success.main;
      case 'negative':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Render message list item
  const renderMessageItem = (message: UnifiedMessage) => {
    const isSelected = selectedMessages.includes(message.id);
    const isUnread = message.status === 'delivered';

    return (
      <ListItem
        key={message.id}
        alignItems="flex-start"
        sx={{
          bgcolor: isSelected ? 'action.selected' : 'transparent',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        onClick={() => {
          if (isSelected) {
            setSelectedMessages(prev => prev.filter(id => id !== message.id));
          } else {
            setSelectedMessages(prev => [...prev, message.id]);
          }
        }}
      >
        <ListItemAvatar>
          <Badge
            color="primary"
            variant="dot"
            invisible={!isUnread}
            overlap="circular"
          >
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {getPlatformIcon(message.platform)}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                variant="subtitle2"
                component="span"
                fontWeight={isUnread ? 600 : 400}
              >
                {message.sender.name}
              </Typography>
              {message.ai?.category && (
                <Chip
                  label={message.ai.category}
                  size="small"
                  variant="outlined"
                  icon={<CategoryIcon />}
                />
              )}
              {message.ai?.urgency === 'high' && (
                <Tooltip title="Urgent">
                  <UrgentIcon fontSize="small" color="error" />
                </Tooltip>
              )}
            </Box>
          }
          secondary={
            <>
              <Typography
                component="span"
                variant="body2"
                color="text.primary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {message.content}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                </Typography>
                {message.ai?.sentiment && (
                  <SentimentIcon
                    fontSize="small"
                    sx={{ color: getSentimentColor(message.ai.sentiment) }}
                  />
                )}
                {message.ai?.tags?.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="filled"
                    sx={{ height: 20 }}
                  />
                ))}
              </Box>
            </>
          }
        />
        <ListItemSecondaryAction>
          <IconButton
            edge="end"
            aria-label="more"
            onClick={(e) => {
              e.stopPropagation();
              // Handle menu open
            }}
          >
            <MoreIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  // Render conversation list item
  const renderConversationItem = (conversation: Conversation) => {
    return (
      <ListItem
        key={conversation.id}
        alignItems="flex-start"
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <ListItemAvatar>
          <Badge
            badgeContent={conversation.unreadCount}
            color="primary"
            overlap="circular"
          >
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {getPlatformIcon(conversation.platform)}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" fontWeight={conversation.unreadCount > 0 ? 600 : 400}>
                {conversation.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {conversation.lastMessage && 
                  formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true })
                }
              </Typography>
            </Box>
          }
          secondary={
            <>
              <Typography
                component="span"
                variant="body2"
                color="text.primary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {conversation.ai?.summary || conversation.lastMessage?.content || 'No messages yet'}
              </Typography>
              {conversation.ai?.tags && (
                <Box display="flex" gap={0.5} mt={0.5}>
                  {conversation.ai.tags.slice(0, 3).map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20 }}
                    />
                  ))}
                </Box>
              )}
            </>
          }
        />
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5" component="h1">
            Unified Communications
          </Typography>
          <Stack direction="row" spacing={1}>
            {selectedMessages.length > 0 && (
              <>
                <Button
                  startIcon={<AIIcon />}
                  variant="outlined"
                  onClick={handleAICategorize}
                  disabled={aiCategorizing}
                >
                  {aiCategorizing ? 'Categorizing...' : 'AI Categorize'}
                </Button>
                <Button
                  startIcon={<MarkReadIcon />}
                  variant="outlined"
                  onClick={async () => {
                    await markAsRead(selectedMessages);
                    setSelectedMessages([]);
                    refetchMessages();
                  }}
                >
                  Mark as Read
                </Button>
              </>
            )}
            <IconButton onClick={() => refetchMessages()}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={(e) => setFilterAnchor(e.currentTarget)}>
              <FilterIcon />
            </IconButton>
          </Stack>
        </Stack>

        {/* Search and filters */}
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1}>
            {platformFilter !== 'all' && (
              <Chip
                label={platformFilter}
                onDelete={() => setPlatformFilter('all')}
                size="small"
              />
            )}
            {sentimentFilter !== 'all' && (
              <Chip
                label={`Sentiment: ${sentimentFilter}`}
                onDelete={() => setSentimentFilter('all')}
                size="small"
              />
            )}
            {urgencyFilter !== 'all' && (
              <Chip
                label={`Urgency: ${urgencyFilter}`}
                onDelete={() => setUrgencyFilter('all')}
                size="small"
              />
            )}
          </Stack>
        </Stack>

        {/* Stats summary */}
        {stats && (
          <Stack direction="row" spacing={3} mt={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Messages
              </Typography>
              <Typography variant="h6">{stats.totalMessages}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Avg Response Time
              </Typography>
              <Typography variant="h6">
                {Math.round(stats.responseTime.average / 60)}m
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                AI Assistance
              </Typography>
              <Typography variant="h6">{stats.aiAssistance.suggestionsUsed}</Typography>
            </Box>
          </Stack>
        )}
      </Paper>

      {/* Content */}
      <Paper sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="All Messages" />
          <Tab label="Conversations" />
          <Tab label="Unread" />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <TabPanel value={tabValue} index={0}>
            {messagesLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : messagesData?.messages.length === 0 ? (
              <Alert severity="info" sx={{ m: 2 }}>
                No messages found. Start a conversation to see messages here.
              </Alert>
            ) : (
              <List>
                {messagesData?.messages.map((message: any) => renderMessageItem(message))}
              </List>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {conversationsLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : conversationsData?.conversations.length === 0 ? (
              <Alert severity="info" sx={{ m: 2 }}>
                No active conversations.
              </Alert>
            ) : (
              <List>
                {conversationsData?.conversations.map((conversation: any) => 
                  renderConversationItem(conversation)
                )}
              </List>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {messagesLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {messagesData?.messages
                  .filter((msg: any) => msg.status === 'delivered')
                  .map((message: any) => renderMessageItem(message))}
              </List>
            )}
          </TabPanel>
        </Box>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Platform</Typography>
        </MenuItem>
        {['all', 'slack', 'twilio'].map((platform) => (
          <MenuItem
            key={platform}
            selected={platformFilter === platform}
            onClick={() => {
              setPlatformFilter(platform as any);
              setFilterAnchor(null);
            }}
          >
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem disabled>
          <Typography variant="subtitle2">Sentiment</Typography>
        </MenuItem>
        {['all', 'positive', 'neutral', 'negative'].map((sentiment) => (
          <MenuItem
            key={sentiment}
            selected={sentimentFilter === sentiment}
            onClick={() => {
              setSentimentFilter(sentiment as any);
              setFilterAnchor(null);
            }}
          >
            {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem disabled>
          <Typography variant="subtitle2">Urgency</Typography>
        </MenuItem>
        {['all', 'low', 'medium', 'high'].map((urgency) => (
          <MenuItem
            key={urgency}
            selected={urgencyFilter === urgency}
            onClick={() => {
              setUrgencyFilter(urgency as any);
              setFilterAnchor(null);
            }}
          >
            {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};