import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  Psychology as SuggestIcon,
  Send as SendIcon,
  AttachFile as AttachIcon,
  Schedule as ScheduleIcon,
  Tag as SlackIcon,
  Sms as SmsIcon,
  Speed as QuickIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  useSendMessageMutation,
  useGetSlackChannelsQuery,
  useGetAISuggestionMutation,
  useGenerateAITemplateMutation,
  useGetTemplatesQuery,
} from '@services/api/communicationsApi';

interface MessageComposerProps {
  open: boolean;
  onClose: () => void;
  defaultPlatform?: 'slack' | 'twilio';
  defaultRecipient?: string;
  defaultMessage?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  open,
  onClose,
  defaultPlatform = 'slack',
  defaultRecipient = '',
  defaultMessage = '',
}) => {
  const theme = useTheme();
  const [platform, setPlatform] = useState<'slack' | 'twilio'>(defaultPlatform);
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [message, setMessage] = useState(defaultMessage);
  const [tone, setTone] = useState<'professional' | 'friendly' | 'casual'>('professional');
  const [aiMode, setAiMode] = useState<'off' | 'suggest' | 'improve' | 'generate'>('off');
  const [aiIntent, setAiIntent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  // API hooks
  const { data: slackChannels } = useGetSlackChannelsQuery(undefined, {
    skip: platform !== 'slack',
  });
  const { data: templates } = useGetTemplatesQuery({ platform });
  
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [getAISuggestion, { isLoading: aiLoading }] = useGetAISuggestionMutation();
  const [generateTemplate] = useGenerateAITemplateMutation();

  // Handle AI assistance
  const handleAIAssist = async () => {
    if (aiMode === 'off') return;

    try {
      let result;
      
      switch (aiMode) {
        case 'suggest':
          result = await getAISuggestion({
            action: 'suggest',
            content: message,
            context: {
              platform,
              recipient,
              tone,
              intent: aiIntent,
            },
          }).unwrap();
          
          if (result.result.suggestion) {
            setMessage(result.result.suggestion);
          }
          break;
          
        case 'improve':
          result = await getAISuggestion({
            action: 'improve',
            content: message,
            context: { tone },
          }).unwrap();
          
          if (result.result.improved) {
            setMessage(result.result.improved);
          }
          break;
          
        case 'generate':
          if (!aiIntent) {
            alert('Please describe what you want to say');
            return;
          }
          
          const template = await generateTemplate({
            category: 'general',
            intent: aiIntent,
            tone,
          }).unwrap();
          
          setMessage(template.content);
          break;
      }
    } catch (error) {
      console.error('AI assistance failed:', error);
    }
  };

  // Handle send
  const handleSend = async () => {
    if (!recipient || !message.trim()) return;

    try {
      await sendMessage({
        platform,
        recipient,
        content: message,
        attachments,
        useAI: aiMode !== 'off',
        aiContext: aiMode !== 'off' ? { tone, intent: aiIntent } : undefined,
      }).unwrap();

      // Reset and close
      setMessage('');
      setRecipient('');
      setAttachments([]);
      onClose();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Get recipient options based on platform
  const getRecipientOptions = () => {
    if (platform === 'slack') {
      return slackChannels?.map((ch: any) => ({
        label: `#${ch.name}`,
        value: ch.id,
      })) || [];
    }
    
    // For Twilio, we'd fetch recent contacts
    return [];
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">New Message</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Platform Selection */}
          <ToggleButtonGroup
            value={platform}
            exclusive
            onChange={(_, newPlatform) => newPlatform && setPlatform(newPlatform)}
            fullWidth
          >
            <ToggleButton value="slack">
              <Stack direction="row" spacing={1} alignItems="center">
                <SlackIcon />
                <span>Slack</span>
              </Stack>
            </ToggleButton>
            <ToggleButton value="twilio">
              <Stack direction="row" spacing={1} alignItems="center">
                <SmsIcon />
                <span>SMS</span>
              </Stack>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Recipient */}
          <Autocomplete
            freeSolo
            options={getRecipientOptions()}
            value={recipient}
            onChange={(_, newValue) => {
              if (typeof newValue === 'string') {
                setRecipient(newValue);
              } else if (newValue) {
                setRecipient((newValue as any).value);
              }
            }}
            onInputChange={(_, newValue) => setRecipient(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={platform === 'slack' ? 'Channel' : 'Phone Number'}
                placeholder={platform === 'slack' ? '#general' : '+1 (555) 123-4567'}
                required
              />
            )}
          />

          {/* AI Mode Selection */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AIIcon color={aiMode !== 'off' ? 'primary' : 'action'} />
                  <Typography variant="subtitle2">AI Assistance</Typography>
                </Stack>
                <ToggleButtonGroup
                  value={aiMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setAiMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="off">Off</ToggleButton>
                  <ToggleButton value="suggest">Suggest</ToggleButton>
                  <ToggleButton value="improve">Improve</ToggleButton>
                  <ToggleButton value="generate">Generate</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {aiMode !== 'off' && (
                <>
                  <Stack direction="row" spacing={1}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Tone</InputLabel>
                      <Select
                        value={tone}
                        onChange={(e) => setTone(e.target.value as any)}
                        label="Tone"
                      >
                        <MenuItem value="professional">Professional</MenuItem>
                        <MenuItem value="friendly">Friendly</MenuItem>
                        <MenuItem value="casual">Casual</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {aiMode === 'generate' && (
                      <TextField
                        fullWidth
                        size="small"
                        label="What do you want to say?"
                        placeholder="e.g., Schedule a meeting for next week"
                        value={aiIntent}
                        onChange={(e) => setAiIntent(e.target.value)}
                      />
                    )}
                    
                    <Button
                      variant="outlined"
                      startIcon={aiLoading ? <CircularProgress size={16} /> : <SuggestIcon />}
                      onClick={handleAIAssist}
                      disabled={aiLoading}
                    >
                      {aiMode === 'generate' ? 'Generate' : aiMode}
                    </Button>
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>

          {/* Message */}
          <TextField
            fullWidth
            multiline
            rows={8}
            label="Message"
            placeholder={
              aiMode === 'generate' 
                ? "Click 'Generate' to create a message..."
                : "Type your message here..."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />

          {/* Quick Templates */}
          {templates && templates.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Quick Templates
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {templates.slice(0, 5).map((template: any) => (
                  <Chip
                    key={template.id}
                    label={template.name}
                    icon={<QuickIcon />}
                    onClick={() => setMessage(template.content)}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Additional Options */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              startIcon={<AttachIcon />}
              component="label"
            >
              Attach File
              <input
                type="file"
                hidden
                multiple
                onChange={(e) => setAttachments(Array.from(e.target.files || []))}
              />
            </Button>
            
            <Button
              startIcon={<ScheduleIcon />}
              onClick={() => setScheduling(!scheduling)}
              color={scheduling ? 'primary' : 'inherit'}
            >
              Schedule
            </Button>
          </Stack>

          {/* Attachments */}
          {attachments.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {attachments.map((file, index) => (
                <Chip
                  key={index}
                  label={file.name}
                  onDelete={() => setAttachments(attachments.filter((_, i) => i !== index))}
                  size="small"
                />
              ))}
            </Stack>
          )}

          {/* Schedule Options */}
          {scheduling && (
            <TextField
              type="datetime-local"
              label="Send at"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
          onClick={handleSend}
          disabled={!recipient || !message.trim() || sending}
        >
          {scheduling ? 'Schedule' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};