import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  TextField,
  Button,
  Stack,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Fade,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Send as SendIcon,
  AutoAwesome as AIIcon,
  AttachFile as AttachIcon,
  Schedule as ScheduleIcon,
  Psychology as SuggestIcon,
  ContactPhone as ContactIcon,
  Message as MessageIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Add as AddIcon,
  SmartToy as SmartComposeIcon,
  Close as CloseIcon,
  CheckCircle as DeliveredIcon,
  Error as FailedIcon,
  AccessTime as PendingIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  useGetMessagesQuery,
  useGetTwilioNumbersQuery,
  useSendSMSMutation,
  useGetAISuggestionMutation,
  useImproveMessageMutation,
  useGetTemplatesQuery,
  useAnalyzeMessageSentimentMutation,
} from '@services/api/communicationsApi';
import type { UnifiedMessage } from './types';
import { format } from 'date-fns';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

interface Contact {
  phone: string;
  name?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}

export const TwilioSMS: React.FC = () => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [newContactDialog, setNewContactDialog] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSmartCompose, setShowSmartCompose] = useState(false);
  const [smartComposeOptions, setSmartComposeOptions] = useState<string[]>([]);
  const [messageLength, setMessageLength] = useState(0);
  const [scheduleSend, setScheduleSend] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  // API hooks
  const { data: twilioNumbers } = useGetTwilioNumbersQuery();
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = 
    useGetMessagesQuery({
      platform: 'twilio',
      search: searchQuery || undefined,
      limit: 100,
    });
  const { data: templates } = useGetTemplatesQuery({ platform: 'twilio' });

  const [sendSMS, { isLoading: sending }] = useSendSMSMutation();
  const [getAISuggestion, { isLoading: aiLoading }] = useGetAISuggestionMutation();
  const [improveMessage] = useImproveMessageMutation();
  const [analyzeSentiment] = useAnalyzeMessageSentimentMutation();

  // Extract unique contacts from messages
  const contacts: Contact[] = React.useMemo(() => {
    if (!messagesData?.messages) return [];

    const contactMap = new Map<string, Contact>();

    messagesData.messages.forEach((msg: any) => {
      const phone = msg.type === 'incoming' ? msg.sender.phone! : msg.recipient.phone!;
      const name = msg.type === 'incoming' ? msg.sender.name : msg.recipient.name;
      
      if (!phone) return;

      const existing = contactMap.get(phone);
      if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessageTime!)) {
        contactMap.set(phone, {
          phone,
          name,
          lastMessage: msg.content,
          lastMessageTime: new Date(msg.timestamp),
          unreadCount: msg.status === 'delivered' && msg.type === 'incoming' ? 1 : 0,
        });
      } else if (msg.status === 'delivered' && msg.type === 'incoming') {
        existing.unreadCount = (existing.unreadCount || 0) + 1;
      }
    });

    return Array.from(contactMap.values()).sort(
      (a, b) => (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0)
    );
  }, [messagesData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData, selectedContact]);

  // Calculate message segments (SMS is limited to 160 chars)
  useEffect(() => {
    setMessageLength(message.length);
  }, [message]);

  // Smart compose functionality
  const handleSmartCompose = async () => {
    if (!message.trim()) return;

    try {
      const response = await getAISuggestion({
        action: 'suggest',
        content: message,
        context: {
          platform: 'twilio',
          tone: 'friendly',
          intent: 'complete_message',
        },
      }).unwrap();

      if (response.result.suggestion) {
        // Get multiple variations
        const suggestions = [
          response.result.suggestion,
          // You could make multiple API calls for variations
        ];
        setSmartComposeOptions(suggestions);
        setShowSmartCompose(true);
      }
    } catch (error) {
      console.error('Failed to get smart compose suggestions:', error);
    }
  };

  // Send SMS
  const handleSendSMS = async () => {
    if (!selectedContact || !message.trim() || !selectedNumber) return;

    try {
      await sendSMS({
        to: selectedContact,
        body: message,
      }).unwrap();

      setMessage('');
      setShowSmartCompose(false);
      refetchMessages();
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  };

  // Add new contact
  const handleAddContact = () => {
    if (!isValidPhoneNumber(newContactPhone, 'US')) {
      alert('Please enter a valid phone number');
      return;
    }

    // In a real app, this would save to the backend
    setSelectedContact(newContactPhone);
    setNewContactDialog(false);
    setNewContactPhone('');
    setNewContactName('');
  };

  // Format phone number for display
  const formatPhone = (phone: string) => {
    try {
      const parsed = parsePhoneNumber(phone, 'US');
      return parsed?.formatNational() || phone;
    } catch {
      return phone;
    }
  };

  // Get message status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'read':
        return <DeliveredIcon fontSize="small" color="success" />;
      case 'failed':
        return <FailedIcon fontSize="small" color="error" />;
      default:
        return <PendingIcon fontSize="small" color="action" />;
    }
  };

  // Render message bubble
  const renderMessage = (msg: UnifiedMessage) => {
    const isOutgoing = msg.type === 'outgoing';

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
          direction="column"
          spacing={0.5}
          sx={{ maxWidth: '70%' }}
          alignItems={isOutgoing ? 'flex-end' : 'flex-start'}
        >
          <Paper
            sx={{
              p: 2,
              bgcolor: isOutgoing
                ? theme.palette.primary.main
                : theme.palette.grey[100],
              color: isOutgoing
                ? theme.palette.primary.contrastText
                : theme.palette.text.primary,
              borderRadius: 2,
              position: 'relative',
            }}
            elevation={isOutgoing ? 2 : 0}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </Typography>
            {msg.ai?.sentiment && (
              <Chip
                label={msg.ai.sentiment}
                size="small"
                sx={{
                  position: 'absolute',
                  top: -10,
                  right: 10,
                  height: 20,
                }}
              />
            )}
          </Paper>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {format(new Date(msg.timestamp), 'HH:mm')}
            </Typography>
            {isOutgoing && getStatusIcon(msg.status)}
          </Stack>
        </Stack>
      </Box>
    );
  };

  // Selected contact messages
  const contactMessages = messagesData?.messages.filter(
    (msg: any) => msg.sender.phone === selectedContact || msg.recipient.phone === selectedContact
  );

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Contact List */}
      <Paper
        sx={{
          width: 320,
          borderRadius: 0,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">SMS Messages</Typography>
            <IconButton size="small" onClick={() => setNewContactDialog(true)}>
              <AddIcon />
            </IconButton>
          </Stack>
          <TextField
            fullWidth
            size="small"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {messagesLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={30} />
            </Box>
          ) : contacts.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              No conversations yet. Send your first SMS!
            </Alert>
          ) : (
            <List>
              {contacts.map((contact) => (
                <ListItem key={contact.phone} disablePadding>
                  <ListItemButton
                    selected={selectedContact === contact.phone}
                    onClick={() => setSelectedContact(contact.phone)}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <PhoneIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name || formatPhone(contact.phone)}
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
                          {contact.lastMessage}
                        </Typography>
                      }
                    />
                    {contact.unreadCount! > 0 && (
                      <Chip
                        label={contact.unreadCount}
                        size="small"
                        color="primary"
                        sx={{ height: 24 }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      {/* Message Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedContact ? (
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
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar>
                    <ContactIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {contacts.find(c => c.phone === selectedContact)?.name || 
                       formatPhone(selectedContact)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedContact}
                    </Typography>
                  </Box>
                </Stack>
                <IconButton>
                  <MoreIcon />
                </IconButton>
              </Stack>
            </Paper>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
              {contactMessages?.length === 0 ? (
                <Alert severity="info">
                  Start a conversation with this contact
                </Alert>
              ) : (
                <>
                  {contactMessages?.map((msg: any) => renderMessage(msg))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </Box>

            {/* Smart Compose Suggestions */}
            <Fade in={showSmartCompose}>
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
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SmartComposeIcon color="primary" />
                      <Typography variant="subtitle2" color="primary">
                        Smart Compose Suggestions
                      </Typography>
                    </Stack>
                    <IconButton
                      size="small"
                      onClick={() => setShowSmartCompose(false)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  {smartComposeOptions.map((option, index) => (
                    <Card
                      key={index}
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => {
                        setMessage(option);
                        setShowSmartCompose(false);
                      }}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2">{option}</Typography>
                      </CardContent>
                    </Card>
                  ))}
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
              <Stack spacing={2}>
                {/* From number selector */}
                <FormControl size="small" fullWidth>
                  <InputLabel>From Number</InputLabel>
                  <Select
                    value={selectedNumber}
                    onChange={(e) => setSelectedNumber(e.target.value)}
                    label="From Number"
                  >
                    {twilioNumbers?.map((number: any) => (
                      <MenuItem key={number.phoneNumber} value={number.phoneNumber}>
                        {number.friendlyName || number.phoneNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Message input with character count */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      handleSendSMS();
                    }
                  }}
                  helperText={
                    <Stack direction="row" justifyContent="space-between">
                      <span>
                        {messageLength}/160 characters
                        {messageLength > 160 && ` (${Math.ceil(messageLength / 160)} segments)`}
                      </span>
                      <span>Ctrl+Enter to send</span>
                    </Stack>
                  }
                />

                {/* Action buttons */}
                <Stack direction="row" spacing={1} justifyContent="space-between">
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Smart Compose">
                      <IconButton
                        onClick={handleSmartCompose}
                        disabled={!message.trim() || aiLoading}
                        color="primary"
                      >
                        {aiLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <SmartComposeIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Improve Message">
                      <IconButton
                        onClick={async () => {
                          const result = await improveMessage({
                            content: message,
                            tone: 'friendly',
                          }).unwrap();
                          if (result.result.improved) {
                            setMessage(result.result.improved);
                          }
                        }}
                        disabled={!message.trim()}
                      >
                        <AIIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Attach Media">
                      <IconButton>
                        <AttachIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Schedule Send">
                      <IconButton
                        onClick={() => setScheduleSend(!scheduleSend)}
                        color={scheduleSend ? 'primary' : 'default'}
                      >
                        <ScheduleIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={handleSendSMS}
                    disabled={!message.trim() || !selectedNumber || sending}
                  >
                    {sending ? 'Sending...' : 'Send SMS'}
                  </Button>
                </Stack>

                {/* Schedule options */}
                {scheduleSend && (
                  <TextField
                    type="datetime-local"
                    size="small"
                    fullWidth
                    label="Schedule for"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
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
            <Stack spacing={2} alignItems="center">
              <MessageIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                Select a contact to start messaging
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setNewContactDialog(true)}
              >
                New Conversation
              </Button>
            </Stack>
          </Box>
        )}
      </Box>

      {/* New Contact Dialog */}
      <Dialog open={newContactDialog} onClose={() => setNewContactDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New SMS Conversation</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Phone Number"
              placeholder="+1 (555) 123-4567"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              helperText="Enter a valid US phone number"
            />
            <TextField
              fullWidth
              label="Contact Name (Optional)"
              placeholder="John Doe"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewContactDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddContact}>
            Start Conversation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};