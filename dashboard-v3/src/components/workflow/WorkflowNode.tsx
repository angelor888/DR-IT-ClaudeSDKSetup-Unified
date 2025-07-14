import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Paper, Typography, Chip, IconButton } from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Webhook as WebhookIcon,
  Event as EventIcon,
  Extension as ExtensionIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Psychology as PsychologyIcon,
  CompareArrows as CompareArrowsIcon,
  Code as CodeIcon,
  Timer as TimerIcon,
  PlayCircle as PlayIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface WorkflowNodeData {
  label: string;
  icon?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  message?: string;
  [key: string]: any;
}

const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected, type }) => {
  const getIconComponent = () => {
    const icons: Record<string, any> = {
      Schedule: ScheduleIcon,
      Webhook: WebhookIcon,
      Event: EventIcon,
      Extension: ExtensionIcon,
      Email: EmailIcon,
      Sms: SmsIcon,
      Psychology: PsychologyIcon,
      CompareArrows: CompareArrowsIcon,
      Code: CodeIcon,
      Timer: TimerIcon,
    };
    const IconComponent = icons[data.icon || ''] || ExtensionIcon;
    return <IconComponent fontSize="small" />;
  };

  const getNodeColor = () => {
    switch (type) {
      case 'trigger':
        return '#4caf50';
      case 'action':
        return '#2196f3';
      case 'condition':
        return '#ff9800';
      case 'delay':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <PlayIcon fontSize="small" color="info" />;
      case 'success':
        return <CheckIcon fontSize="small" color="success" />;
      case 'error':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  const nodeColor = getNodeColor();

  return (
    <Paper
      elevation={selected ? 8 : 2}
      sx={{
        p: 2,
        minWidth: 200,
        border: selected ? '2px solid' : '1px solid',
        borderColor: selected ? nodeColor : 'divider',
        backgroundColor: 'background.paper',
        position: 'relative',
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      {type === 'trigger' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: nodeColor,
            width: 12,
            height: 12,
          }}
        />
      )}
      
      {type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: nodeColor,
            width: 12,
            height: 12,
          }}
        />
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor: `${nodeColor}20`,
            color: nodeColor,
          }}
        >
          {getIconComponent()}
        </Box>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ flexGrow: 1 }}>
          {data.label}
        </Typography>
        {getStatusIcon()}
      </Box>

      <Chip
        label={type}
        size="small"
        sx={{
          backgroundColor: `${nodeColor}20`,
          color: nodeColor,
          fontWeight: 'bold',
          textTransform: 'capitalize',
        }}
      />

      {data.message && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {data.message}
        </Typography>
      )}

      {type !== 'trigger' && type !== 'delay' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: nodeColor,
            width: 12,
            height: 12,
          }}
        />
      )}

      {type === 'condition' && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{
              background: '#4caf50',
              width: 12,
              height: 12,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#4caf50',
              fontWeight: 'bold',
            }}
          >
            T
          </Typography>
          <Handle
            type="source"
            position={Position.Left}
            id="false"
            style={{
              background: '#f44336',
              width: 12,
              height: 12,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#f44336',
              fontWeight: 'bold',
            }}
          >
            F
          </Typography>
        </>
      )}
    </Paper>
  );
};

export default memo(WorkflowNode);