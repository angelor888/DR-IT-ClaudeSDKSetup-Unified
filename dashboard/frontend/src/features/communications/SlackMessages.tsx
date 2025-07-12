import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  IconButton,
  Button,
  Stack,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  Tag as ChannelIcon,
  Lock as PrivateIcon,
  Send as SendIcon,
  AutoAwesome as AIIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  Psychology as SuggestIcon,
  Summarize as SummarizeIcon,
  Speed as QuickReplyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  useGetSlackChannelsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetAISuggestionMutation,
  useImproveMessageMutation,
  useSummarizeConversationMutation,
  useGetTemplatesQuery,
} from '@services/api/communicationsApi';
import type { UnifiedMessage } from './types';
import { format } from 'date-fns';

interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  hasUnread?: boolean;
}

export const SlackMessages: React.FC = () => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [quickReplyAnchor, setQuickReplyAnchor] = useState<null | HTMLElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  // API hooks
  const { data: channels, isLoading: channelsLoading } = useGetSlackChannelsQuery();
  const { data: messagesData, isLoading: messagesLoading } = useGetMessagesQuery(
    {
      platform: 'slack',
      recipient: selectedChannel || undefined,
      limit: 100,
    },
    { skip: !selectedChannel }
  );
  const { data: templates } = useGetTemplatesQuery({ platform: 'slack' });

  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [getAISuggestion, { isLoading: aiLoading }] = useGetAISuggestionMutation();
  const [improveMessage] = useImproveMessageMutation();
  const [summarizeConversation] = useSummarizeConversationMutation();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  // Get AI suggestion
  const handleGetAISuggestion = async () => {
    if (!selectedChannel || !message.trim()) return;

    try {
      const response = await getAISuggestion({
        action: 'suggest',
        content: message,
        context: {
          platform: 'slack',
          recipient: selectedChannel,
          tone: 'professional',
        },
      }).unwrap();

      if (response.result.suggestion) {
        setAiSuggestion(response.result.suggestion);
        setShowAIPanel(true);
      }
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
    }
  };

  // Improve message with AI
  const handleImproveMessage = async () => {
    if (!message.trim()) return;

    try {
      const response = await improveMessage({
        content: message,
        tone: 'professional',
      }).unwrap();

      if (response.result.improved) {
        setMessage(response.result.improved);
      }
    } catch (error) {
      console.error('Failed to improve message:', error);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!selectedChannel || !message.trim()) return;

    try {
      await sendMessage({
        platform: 'slack',
        recipient: selectedChannel,
        content: message,
      }).unwrap();

      setMessage('');
      setShowAIPanel(false);
      setAiSuggestion('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Apply template
  const handleApplyTemplate = (template: string) => {
    setMessage(template);
    setQuickReplyAnchor(null);
  };

  // Render message
  const renderMessage = (msg: UnifiedMessage) => {
    const isOutgoing = msg.type === 'outgoing';
    const showTimestamp = true; // Logic to show timestamp on hover or every N messages

    return (
      <Box
        key={msg.id}
        sx={{
          display: 'flex',
          justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <Stack
          direction={isOutgoing ? 'row-reverse' : 'row'}
          spacing={1}
          alignItems="flex-start"
          sx={{ maxWidth: '70%' }}
        >
          {!isOutgoing && (
            <Avatar sx={{ width: 32, height: 32 }}>
              {msg.sender.name.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              {!isOutgoing && (
                <Typography variant="caption" fontWeight={500}>
                  {msg.sender.name}
                </Typography>
              )}
              {showTimestamp && (
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(msg.timestamp), 'HH:mm')}
                </Typography>
              )}
              {msg.ai?.sentiment && (
                <Chip
                  label={msg.ai.sentiment}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18 }}
                />
              )}
            </Stack>
            <Paper
              sx={{
                p: 1.5,
                bgcolor: isOutgoing
                  ? theme.palette.primary.main
                  : theme.palette.grey[100],
                color: isOutgoing
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
              }}
              elevation={isOutgoing ? 2 : 0}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </Typography>
            </Paper>
            {msg.ai?.suggestedResponse && !isOutgoing && (
              <Card
                variant="outlined"
                sx={{
                  mt: 1,
                  bgcolor: 'action.hover',
                  borderColor: theme.palette.primary.main,
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <AIIcon fontSize="small" color="primary" />
                    <Typography variant="caption" color="primary">
                      AI Suggested Response
                    </Typography>
                  </Stack>
                  <Typography variant="body2" fontSize="0.875rem">
                    {msg.ai.suggestedResponse}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<SendIcon />}
                    onClick={() => setMessage(msg.ai!.suggestedResponse!)}
                    sx={{ mt: 1 }}
                  >
                    Use This Response
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        </Stack>
      </Box>
    );
  };

  // Selected channel details
  const selectedChannelData = channels?.find((ch: any) => ch.id === selectedChannel);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Channel List */}
      <Paper
        sx={{
          width: 280,
          borderRadius: 0,
          borderRight: 1,
          borderColor: 'divider',
          overflow: 'auto',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Slack Channels</Typography>
        </Box>
        <Divider />
        {channelsLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <List dense>
            {channels?.map((channel: Channel) => (
              <ListItem key={channel.id} disablePadding>
                <ListItemButton
                  selected={selectedChannel === channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {channel.isPrivate ? (
                      <PrivateIcon fontSize="small" />
                    ) : (
                      <ChannelIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`# ${channel.name}`}
                    secondary={`${channel.memberCount} members`}
                  />
                  {channel.hasUnread && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Message Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChannel ? (
          <>
            {/* Header */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 0,
                borderBottom: 1,
                borderColor: 'divider',
              }}
              elevation={0}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h6">
                    # {selectedChannelData?.name}
                  </Typography>
                  <Chip
                    label={`${selectedChannelData?.memberCount} members`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Summarize Conversation">
                    <IconButton
                      onClick={async () => {
                        if (messagesData?.messages.length) {
                          const result = await summarizeConversation(selectedChannel).unwrap();
                          // Handle summary display
                        }
                      }}
                    >
                      <SummarizeIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {messagesLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : messagesData?.messages.length === 0 ? (
                <Alert severity="info">
                  No messages in this channel yet. Start a conversation!
                </Alert>
              ) : (
                <>
                  {messagesData?.messages.map((msg: any) => renderMessage(msg))}
                  {isTyping && (
                    <Box display="flex" alignItems="center" gap={1} ml={5}>
                      <Typography variant="caption" color="text.secondary">
                        Someone is typing...
                      </Typography>
                      <CircularProgress size={12} />
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </Box>

            {/* AI Suggestion Panel */}
            <Fade in={showAIPanel}>
              <Paper
                sx={{
                  mx: 2,
                  mb: 1,
                  p: 2,
                  bgcolor: 'background.default',
                  border: 1,
                  borderColor: 'primary.main',
                }}
                elevation={3}
              >
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <AIIcon color="primary" />
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      AI Suggestion
                    </Typography>
                    <Typography variant="body2">{aiSuggestion}</Typography>
                    <Stack direction="row" spacing={1} mt={1}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setMessage(aiSuggestion);
                          setShowAIPanel(false);
                        }}
                      >
                        Use This
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleGetAISuggestion()}
                      >
                        Try Another
                      </Button>
                    </Stack>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setShowAIPanel(false)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Paper>
            </Fade>

            {/* Message Input */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 0,
                borderTop: 1,
                borderColor: 'divider',
              }}
              elevation={0}
            >
              <Stack spacing={1}>
                {/* Formatting toolbar */}
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small">
                    <BoldIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <ItalicIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <CodeIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <LinkIcon fontSize="small" />
                  </IconButton>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                  <Tooltip title="AI Suggest">
                    <IconButton
                      size="small"
                      color={aiLoading ? 'default' : 'primary'}
                      onClick={handleGetAISuggestion}
                      disabled={!message.trim() || aiLoading}
                    >
                      {aiLoading ? (
                        <CircularProgress size={18} />
                      ) : (
                        <SuggestIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Improve Message">
                    <IconButton
                      size="small"
                      onClick={handleImproveMessage}
                      disabled={!message.trim()}
                    >
                      <AIIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Quick Replies">
                    <IconButton
                      size="small"
                      onClick={(e) => setQuickReplyAnchor(e.currentTarget)}
                    >
                      <QuickReplyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small">
                    <AttachIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <EmojiIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {/* Message input */}
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sending}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <Typography variant="h6" color="text.secondary">
              Select a channel to start messaging
            </Typography>
          </Box>
        )}
      </Box>

      {/* Quick Reply Menu */}
      <Menu
        anchorEl={quickReplyAnchor}
        open={Boolean(quickReplyAnchor)}
        onClose={() => setQuickReplyAnchor(null)}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Quick Replies</Typography>
        </MenuItem>
        {templates
          ?.filter((t: any) => t.platform === 'slack' || t.platform === 'all')
          .slice(0, 5)
          .map((template: any) => (
            <MenuItem
              key={template.id}
              onClick={() => handleApplyTemplate(template.content)}
            >
              {template.name}
            </MenuItem>
          ))}
        <Divider />
        <MenuItem onClick={() => setQuickReplyAnchor(null)}>
          <Typography variant="caption">Manage Templates...</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};