import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Person as PersonIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RetryIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  toolCalls?: {
    id: string;
    name: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    result?: any;
  }[];
  onRetry?: () => void;
  onCopy?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  role,
  content,
  timestamp,
  status = 'sent',
  toolCalls,
  onRetry,
  onCopy,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === 'user';
  const isSystem = role === 'system';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        opacity: status === 'sending' ? 0.7 : 1,
      }}
    >
      {!isUser && (
        <Avatar
          sx={{
            bgcolor: isSystem ? 'warning.main' : 'primary.main',
            width: 36,
            height: 36,
            mr: 1,
          }}
        >
          {isSystem ? '⚙️' : <AIIcon />}
        </Avatar>
      )}

      <Box sx={{ maxWidth: '70%' }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isUser
              ? 'primary.main'
              : isSystem
              ? 'warning.dark'
              : 'background.paper',
            color: isUser || isSystem ? 'white' : 'text.primary',
            borderRadius: 2,
            borderTopLeftRadius: isUser ? 2 : 0,
            borderTopRightRadius: isUser ? 0 : 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {content}
          </Typography>

          {toolCalls && toolCalls.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {toolCalls.map((call) => (
                <Chip
                  key={call.id}
                  label={call.name}
                  size="small"
                  icon={
                    call.status === 'executing' ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : call.status === 'completed' ? (
                      <CheckIcon />
                    ) : call.status === 'failed' ? (
                      <ErrorIcon />
                    ) : undefined
                  }
                  color={
                    call.status === 'completed'
                      ? 'success'
                      : call.status === 'failed'
                      ? 'error'
                      : 'default'
                  }
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                opacity: 0.7,
                color: isUser || isSystem ? 'inherit' : 'text.secondary',
              }}
            >
              {format(timestamp, 'HH:mm')}
            </Typography>

            <Box>
              {status === 'error' && onRetry && (
                <Tooltip title="Retry">
                  <IconButton size="small" onClick={onRetry} sx={{ p: 0.5 }}>
                    <RetryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {!isUser && (
                <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    sx={{
                      p: 0.5,
                      color: isSystem ? 'inherit' : 'text.secondary',
                    }}
                  >
                    {copied ? (
                      <CheckIcon fontSize="small" />
                    ) : (
                      <CopyIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      {isUser && (
        <Avatar
          sx={{
            bgcolor: 'secondary.main',
            width: 36,
            height: 36,
            ml: 1,
          }}
        >
          <PersonIcon />
        </Avatar>
      )}
    </Box>
  );
};

export default ChatMessage;