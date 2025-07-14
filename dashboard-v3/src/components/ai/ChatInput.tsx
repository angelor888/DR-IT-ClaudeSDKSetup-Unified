import React, { useState, useRef, KeyboardEvent } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  AttachFile as AttachIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Work as JobIcon,
  People as CustomerIcon,
  Email as EmailIcon,
  Event as EventIcon,
  ThreeDRotation as MatterportIcon,
} from '@mui/icons-material';

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  onVoiceToggle?: (enabled: boolean) => void;
  isLoading?: boolean;
  isVoiceEnabled?: boolean;
  placeholder?: string;
  quickActions?: {
    label: string;
    icon?: React.ReactNode;
    action: string;
  }[];
}

const defaultQuickActions = [
  { label: 'Create Job', icon: <JobIcon />, action: 'Create a new job for ' },
  { label: 'Find Customer', icon: <CustomerIcon />, action: 'Find customer ' },
  { label: 'Send Email', icon: <EmailIcon />, action: 'Send email to ' },
  { label: 'Schedule Event', icon: <EventIcon />, action: 'Schedule event for ' },
  { label: 'Analyze Scan', icon: <MatterportIcon />, action: 'Analyze Matterport scan ' },
];

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onVoiceToggle,
  isLoading = false,
  isVoiceEnabled = false,
  placeholder = 'Type a message or use voice...',
  quickActions = defaultQuickActions,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Please use Chrome.');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      onVoiceToggle?.(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setMessage(transcript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      stopRecording();
    };

    recognitionRef.current.onend = () => {
      stopRecording();
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    onVoiceToggle?.(false);
  };

  const handleQuickAction = (action: string) => {
    setMessage(action);
    setAnchorEl(null);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
      {attachments.length > 0 && (
        <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {attachments.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              size="small"
              onDelete={() => removeAttachment(index)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disabled={isLoading}
        >
          <AddIcon />
        </IconButton>

        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading || isRecording}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFileSelect}
        />

        <Tooltip title="Attach files">
          <IconButton
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <AttachIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={isRecording ? 'Stop recording' : 'Start voice input'}>
          <IconButton
            size="small"
            onClick={handleVoiceToggle}
            disabled={isLoading}
            color={isRecording ? 'error' : 'default'}
          >
            {isRecording ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>

        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={isLoading || (!message.trim() && attachments.length === 0)}
        >
          {isLoading ? (
            <CircularProgress size={24} />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {quickActions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => handleQuickAction(action.action)}
          >
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ChatInput;