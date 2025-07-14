import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  TrendingUp as InsightIcon,
  AutoAwesome as AutomationIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  setAutomationEnabled,
  clearError,
} from '../../store/slices/aiSlice';
import GrokChatPanel from '../../components/ai/GrokChatPanel';
import { getMCPHub } from '../../services/mcp/MCPHub';
import { format } from 'date-fns';

const AIAssistantPage: React.FC = () => {
  const dispatch = useDispatch();
  const {
    insights,
    activeCommands,
    commandHistory,
    isProcessing,
    error,
    grokStatus,
    mcpStatus,
    automationEnabled,
  } = useSelector((state: RootState) => state.ai);

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const mcpHub = React.useRef(getMCPHub());

  const handleToggleAutomation = () => {
    const newState = !automationEnabled;
    dispatch(setAutomationEnabled(newState));
    
    if (newState) {
      mcpHub.current.startAutonomousMode(60);
    } else {
      mcpHub.current.stopAutonomousMode();
    }
  };

  const handleRefreshInsights = async () => {
    // In a real implementation, this would fetch new insights
    console.log('Refreshing insights...');
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return '💡';
      case 'prediction':
        return '🔮';
      case 'alert':
        return '⚠️';
      case 'summary':
        return '📊';
      default:
        return '📌';
    }
  };

  const getCommandStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'executing':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          AI Assistant
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={<AIIcon />}
            label={`Grok: ${grokStatus}`}
            color={grokStatus === 'connected' ? 'success' : 'error'}
          />
          <Chip
            label={`MCP: ${mcpStatus}`}
            color={mcpStatus === 'connected' ? 'success' : 'error'}
          />
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          onClose={() => dispatch(clearError())}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* AI Status and Control */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AIIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">AI Control Center</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={automationEnabled}
                    onChange={handleToggleAutomation}
                    color="primary"
                  />
                }
                label="Automation Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {automationEnabled
                  ? 'AI is actively monitoring and managing operations'
                  : 'AI responds only to direct commands'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Active Processes
              </Typography>
              {activeCommands.length === 0 ? (
                <Typography variant="body2">No active processes</Typography>
              ) : (
                activeCommands.map((cmd) => (
                  <Box key={cmd.id} sx={{ mb: 1 }}>
                    <Chip
                      label={`${cmd.server}.${cmd.command}`}
                      color={getCommandStatusColor(cmd.status)}
                      size="small"
                      sx={{ width: '100%' }}
                    />
                  </Box>
                ))
              )}
            </Box>

            {isProcessing && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>
        </Grid>

        {/* AI Insights */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InsightIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">AI Insights</Typography>
              </Box>
              <Tooltip title="Refresh insights">
                <IconButton size="small" onClick={handleRefreshInsights}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {insights.length === 0 ? (
              <Alert severity="info">
                No insights available yet. Start chatting with Grok to generate insights!
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {insights.slice(0, 6).map((insight) => (
                  <Grid item xs={12} sm={6} key={insight.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'translateY(-2px)',
                        },
                        backgroundColor:
                          selectedInsight === insight.id
                            ? 'action.selected'
                            : 'background.paper',
                      }}
                      onClick={() => setSelectedInsight(insight.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ mr: 1 }}>
                            {getInsightIcon(insight.type)}
                          </Typography>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {insight.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {insight.description}
                        </Typography>
                        {insight.confidence && (
                          <LinearProgress
                            variant="determinate"
                            value={insight.confidence * 100}
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                      {insight.actionable && (
                        <CardActions>
                          <Button size="small" color="primary">
                            Take Action
                          </Button>
                        </CardActions>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Command History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HistoryIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">Command History</Typography>
            </Box>

            {commandHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No commands executed yet
              </Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Time</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Server</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Command</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Initiated By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commandHistory.slice(0, 10).map((cmd) => (
                      <tr key={cmd.id}>
                        <td style={{ padding: '8px' }}>
                          {format(new Date(cmd.createdAt), 'MMM dd, HH:mm')}
                        </td>
                        <td style={{ padding: '8px' }}>{cmd.server}</td>
                        <td style={{ padding: '8px' }}>{cmd.command}</td>
                        <td style={{ padding: '8px' }}>
                          <Chip
                            label={cmd.status}
                            size="small"
                            color={getCommandStatusColor(cmd.status)}
                          />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <Chip
                            label={cmd.initiatedBy}
                            size="small"
                            variant="outlined"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Chat Panel */}
      <GrokChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        mode="fullscreen"
      />
    </Box>
  );
};

export default AIAssistantPage;