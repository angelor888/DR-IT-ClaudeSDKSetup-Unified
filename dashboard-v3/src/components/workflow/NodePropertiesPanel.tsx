import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Node } from 'reactflow';
import { mcpTools } from '../../services/mcp/MCPService';

interface NodePropertiesPanelProps {
  open: boolean;
  node: Node | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: any) => void;
  onDelete: () => void;
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  open,
  node,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (node?.data) {
      setFormData(node.data);
    }
  }, [node]);

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (node) {
      onUpdate(node.id, newData);
    }
  };

  const renderTriggerProperties = () => {
    const triggerType = formData.type || 'schedule';

    return (
      <>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Trigger Type</InputLabel>
          <Select
            value={triggerType}
            label="Trigger Type"
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <MenuItem value="schedule">Schedule</MenuItem>
            <MenuItem value="webhook">Webhook</MenuItem>
            <MenuItem value="event">Event</MenuItem>
            <MenuItem value="manual">Manual</MenuItem>
          </Select>
        </FormControl>

        {triggerType === 'schedule' && (
          <>
            <TextField
              fullWidth
              label="Cron Expression"
              value={formData.schedule || ''}
              onChange={(e) => handleChange('schedule', e.target.value)}
              placeholder="0 9 * * 1-5"
              helperText="Run at 9 AM on weekdays"
              sx={{ mb: 2 }}
            />
            <Alert severity="info" sx={{ mb: 2 }}>
              Use cron syntax: minute hour day month weekday
            </Alert>
          </>
        )}

        {triggerType === 'webhook' && (
          <>
            <TextField
              fullWidth
              label="Webhook Path"
              value={formData.webhookPath || ''}
              onChange={(e) => handleChange('webhookPath', e.target.value)}
              placeholder="/webhook/my-workflow"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>HTTP Method</InputLabel>
              <Select
                value={formData.webhookMethod || 'POST'}
                label="HTTP Method"
                onChange={(e) => handleChange('webhookMethod', e.target.value)}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {triggerType === 'event' && (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Event Source</InputLabel>
              <Select
                value={formData.eventSource || ''}
                label="Event Source"
                onChange={(e) => handleChange('eventSource', e.target.value)}
              >
                <MenuItem value="jobs">Jobs</MenuItem>
                <MenuItem value="customers">Customers</MenuItem>
                <MenuItem value="communications">Communications</MenuItem>
                <MenuItem value="ai">AI Assistant</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.eventType || ''}
                label="Event Type"
                onChange={(e) => handleChange('eventType', e.target.value)}
              >
                <MenuItem value="created">Created</MenuItem>
                <MenuItem value="updated">Updated</MenuItem>
                <MenuItem value="deleted">Deleted</MenuItem>
                <MenuItem value="status_changed">Status Changed</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
      </>
    );
  };

  const renderActionProperties = () => {
    const actionType = formData.actionType || 'mcp';

    return (
      <>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Action Type</InputLabel>
          <Select
            value={actionType}
            label="Action Type"
            onChange={(e) => handleChange('actionType', e.target.value)}
          >
            <MenuItem value="mcp">MCP Tool</MenuItem>
            <MenuItem value="email">Send Email</MenuItem>
            <MenuItem value="sms">Send SMS</MenuItem>
            <MenuItem value="ai">AI Action</MenuItem>
            <MenuItem value="http">HTTP Request</MenuItem>
            <MenuItem value="database">Database Query</MenuItem>
          </Select>
        </FormControl>

        {actionType === 'mcp' && (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>MCP Tool</InputLabel>
              <Select
                value={formData.mcpTool || ''}
                label="MCP Tool"
                onChange={(e) => handleChange('mcpTool', e.target.value)}
              >
                {Object.keys(mcpTools).map((tool) => (
                  <MenuItem key={tool} value={tool}>
                    {tool}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Tool Parameters (JSON)"
              value={formData.mcpParams || '{}'}
              onChange={(e) => handleChange('mcpParams', e.target.value)}
              sx={{ mb: 2 }}
            />
          </>
        )}

        {actionType === 'email' && (
          <>
            <TextField
              fullWidth
              label="To (use {{variables}})"
              value={formData.emailTo || ''}
              onChange={(e) => handleChange('emailTo', e.target.value)}
              placeholder="{{customer.email}}"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Subject"
              value={formData.emailSubject || ''}
              onChange={(e) => handleChange('emailSubject', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Email Body"
              value={formData.emailBody || ''}
              onChange={(e) => handleChange('emailBody', e.target.value)}
              sx={{ mb: 2 }}
            />
          </>
        )}

        {actionType === 'ai' && (
          <>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="AI Prompt"
              value={formData.aiPrompt || ''}
              onChange={(e) => handleChange('aiPrompt', e.target.value)}
              placeholder="Analyze the following data and provide insights..."
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>AI Model</InputLabel>
              <Select
                value={formData.aiModel || 'grok-2'}
                label="AI Model"
                onChange={(e) => handleChange('aiModel', e.target.value)}
              >
                <MenuItem value="grok-2">Grok 2</MenuItem>
                <MenuItem value="grok-vision">Grok Vision</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
      </>
    );
  };

  const renderConditionProperties = () => {
    const conditionType = formData.conditionType || 'comparison';

    return (
      <>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Condition Type</InputLabel>
          <Select
            value={conditionType}
            label="Condition Type"
            onChange={(e) => handleChange('conditionType', e.target.value)}
          >
            <MenuItem value="comparison">Value Comparison</MenuItem>
            <MenuItem value="javascript">JavaScript</MenuItem>
            <MenuItem value="ai">AI Decision</MenuItem>
          </Select>
        </FormControl>

        {conditionType === 'comparison' && (
          <>
            <TextField
              fullWidth
              label="Left Value"
              value={formData.leftValue || ''}
              onChange={(e) => handleChange('leftValue', e.target.value)}
              placeholder="{{job.status}}"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={formData.operator || 'equals'}
                label="Operator"
                onChange={(e) => handleChange('operator', e.target.value)}
              >
                <MenuItem value="equals">Equals</MenuItem>
                <MenuItem value="not_equals">Not Equals</MenuItem>
                <MenuItem value="greater_than">Greater Than</MenuItem>
                <MenuItem value="less_than">Less Than</MenuItem>
                <MenuItem value="contains">Contains</MenuItem>
                <MenuItem value="starts_with">Starts With</MenuItem>
                <MenuItem value="ends_with">Ends With</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Right Value"
              value={formData.rightValue || ''}
              onChange={(e) => handleChange('rightValue', e.target.value)}
              placeholder="completed"
              sx={{ mb: 2 }}
            />
          </>
        )}

        {conditionType === 'javascript' && (
          <TextField
            fullWidth
            multiline
            rows={6}
            label="JavaScript Expression"
            value={formData.jsExpression || ''}
            onChange={(e) => handleChange('jsExpression', e.target.value)}
            placeholder="return context.job.cost > 10000;"
            sx={{ mb: 2 }}
          />
        )}

        {conditionType === 'ai' && (
          <TextField
            fullWidth
            multiline
            rows={4}
            label="AI Decision Prompt"
            value={formData.aiDecisionPrompt || ''}
            onChange={(e) => handleChange('aiDecisionPrompt', e.target.value)}
            placeholder="Should we send a follow-up email based on the customer's response?"
            sx={{ mb: 2 }}
          />
        )}
      </>
    );
  };

  const renderDelayProperties = () => {
    return (
      <>
        <TextField
          fullWidth
          type="number"
          label="Duration"
          value={formData.duration || 1000}
          onChange={(e) => handleChange('duration', parseInt(e.target.value))}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Unit</InputLabel>
          <Select
            value={formData.unit || 'ms'}
            label="Unit"
            onChange={(e) => handleChange('unit', e.target.value)}
          >
            <MenuItem value="ms">Milliseconds</MenuItem>
            <MenuItem value="s">Seconds</MenuItem>
            <MenuItem value="m">Minutes</MenuItem>
            <MenuItem value="h">Hours</MenuItem>
            <MenuItem value="d">Days</MenuItem>
          </Select>
        </FormControl>
      </>
    );
  };

  const renderNodeProperties = () => {
    if (!node) return null;

    switch (node.type) {
      case 'trigger':
        return renderTriggerProperties();
      case 'action':
        return renderActionProperties();
      case 'condition':
        return renderConditionProperties();
      case 'delay':
        return renderDelayProperties();
      default:
        return null;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          p: 3,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Node Properties</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {node && (
        <>
          <TextField
            fullWidth
            label="Node Name"
            value={formData.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            sx={{ mb: 3 }}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            {node.type ? node.type.charAt(0).toUpperCase() + node.type.slice(1) : ''} Settings
          </Typography>

          {renderNodeProperties()}

          <Divider sx={{ my: 3 }} />

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Advanced Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.continueOnError || false}
                    onChange={(e) => handleChange('continueOnError', e.target.checked)}
                  />
                }
                label="Continue on Error"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Timeout (seconds)"
                value={formData.timeout || 30}
                onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Retry Count"
                value={formData.retryCount || 0}
                onChange={(e) => handleChange('retryCount', parseInt(e.target.value))}
              />
            </AccordionDetails>
          </Accordion>

          <Box sx={{ mt: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >
              Delete Node
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );
};

export default NodePropertiesPanel;