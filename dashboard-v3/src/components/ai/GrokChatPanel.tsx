import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Drawer,
  Fab,
  Badge,
  Collapse,
  Divider,
  Tooltip,
  Chip,
  Button,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  AutoAwesome as AutoModeIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  addCommand,
  updateCommand,
  setProcessing,
  setError,
  clearError,
  setAutomationEnabled,
} from '../../store/slices/aiSlice';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import QuickActions from './QuickActions';
import GrokService from '../../services/grok/GrokService';
import { getMCPHub } from '../../services/mcp/MCPHub';
import { conversationService } from '../../services/ai/ConversationService';
import { auditService } from '../../services/ai/AuditService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  toolCalls?: any[];
}

interface GrokChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'floating' | 'fullscreen' | 'drawer';
  initialMessage?: string;
}

const GrokChatPanel: React.FC<GrokChatPanelProps> = ({
  isOpen,
  onClose,
  mode = 'floating',
  initialMessage,
}) => {
  const dispatch = useDispatch();
  const { isProcessing, error, automationEnabled, grokStatus } = useSelector(
    (state: RootState) => state.ai
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(mode === 'fullscreen');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const grokService = useRef(new GrokService());
  const mcpHub = useRef(getMCPHub());

  useEffect(() => {
    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      addSystemMessage('👋 Hi! I\'m your AI assistant powered by Grok. I can help you manage customers, schedule jobs, send communications, and automate your business operations. What would you like to do today?');
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addSystemMessage = (content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, userMessage]);
    setShowQuickActions(false);

    // Add to recent commands
    setRecentCommands((prev) => [content, ...prev.slice(0, 9)]);

    // Process with Grok
    dispatch(setProcessing(true));
    dispatch(clearError());

    // Log chat action
    const startTime = Date.now();

    try {
      // Check if this is a command that requires MCP action
      const isCommand = content.toLowerCase().includes('create') ||
                       content.toLowerCase().includes('send') ||
                       content.toLowerCase().includes('schedule') ||
                       content.toLowerCase().includes('analyze');

      if (isCommand) {
        // Get available MCP servers
        const availableServers = mcpHub.current.getConnectedServers().map(s => s.id);
        
        // Let Grok decide what action to take
        const mcpAction = await grokService.current.decideMCPAction(
          content,
          availableServers
        );

        if (mcpAction) {
          // Add assistant message about the action
          const actionMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: `I'll help you with that. Let me ${mcpAction.method.replace('_', ' ')} using ${mcpAction.server}.`,
            timestamp: new Date(),
            toolCalls: [{
              id: `tool-${Date.now()}`,
              name: `${mcpAction.server}.${mcpAction.method}`,
              status: 'executing',
            }],
          };
          setMessages((prev) => [...prev, actionMessage]);

          // Execute the MCP command
          const command = await mcpHub.current.executeCommand(
            mcpAction.server,
            mcpAction.method,
            mcpAction.params,
            'ai'
          );

          // Update the message with the result
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === actionMessage.id
                ? {
                    ...msg,
                    content: `✅ Successfully executed: ${mcpAction.method.replace('_', ' ')}`,
                    toolCalls: [{
                      ...msg.toolCalls![0],
                      status: 'completed',
                      result: command.result,
                    }],
                  }
                : msg
            )
          );

          // Add result details if available
          if (command.result) {
            const resultMessage: Message = {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: `Here are the details:\n${JSON.stringify(command.result, null, 2)}`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, resultMessage]);
          }
        } else {
          // Regular chat completion
          const response = await grokService.current.chatCompletion([
            { role: 'user', content },
          ], {
            conversationId,
          });

          const assistantMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Log token usage
          const duration = Date.now() - startTime;
          await auditService.logChatMessage(
            content,
            assistantMessage.content.length,
            response.usage?.total_tokens
          );
        }
      } else {
        // Regular chat completion for non-command messages
        const response = await grokService.current.chatCompletion([
          ...messages.map((msg) => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          })),
          { role: 'user', content },
        ], {
          conversationId,
        });

        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update conversation ID if this is a new conversation
        if (!conversationId && response.conversationId) {
          setConversationId(response.conversationId);
        }

        // Log token usage
        const duration = Date.now() - startTime;
        await auditService.logChatMessage(
          content,
          assistantMessage.content.length,
          response.usage?.total_tokens
        );
      }

      // Save conversation locally
      if (conversationId) {
        conversationService.saveLocalConversation(conversationId, messages);
      }
    } catch (error: any) {
      console.error('Error processing message:', error);
      dispatch(setError(error.message || 'Failed to process message'));
      
      // Log error
      await auditService.logError('chat_error', error.message || 'Unknown error', {
        content,
        duration: Date.now() - startTime,
      });
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: '❌ I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      dispatch(setProcessing(false));
    }
  };

  const handleQuickAction = (command: string) => {
    handleSendMessage(command);
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowQuickActions(true);
    addSystemMessage('Chat cleared. How can I help you?');
  };

  const handleToggleAutomation = () => {
    const newState = !automationEnabled;
    dispatch(setAutomationEnabled(newState));
    
    if (newState) {
      mcpHub.current.startAutonomousMode(60); // Check every hour
      addSystemMessage('🤖 Automation mode enabled. I will proactively monitor and manage your business operations.');
    } else {
      mcpHub.current.stopAutonomousMode();
      addSystemMessage('🛑 Automation mode disabled. I will only respond to your direct commands.');
    }
  };

  const renderContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          <Typography variant="h6" fontWeight="medium">
            Grok AI Assistant
          </Typography>
          <Chip
            label={grokStatus}
            size="small"
            color={grokStatus === 'connected' ? 'success' : 'error'}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={automationEnabled ? 'Disable automation' : 'Enable automation'}>
            <IconButton size="small" onClick={handleToggleAutomation}>
              <AutoModeIcon color={automationEnabled ? 'primary' : 'inherit'} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear chat">
            <IconButton size="small" onClick={handleClearChat}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
          {mode === 'floating' && (
            <>
              <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                <IconButton
                  size="small"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Minimize">
                <IconButton size="small" onClick={() => setIsMinimized(true)}>
                  <MinimizeIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: 'background.default',
        }}
      >
        {showQuickActions && messages.length <= 1 ? (
          <QuickActions
            onActionSelect={handleQuickAction}
            recentActions={recentCommands}
          />
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                {...message}
                onRetry={
                  message.status === 'error'
                    ? () => handleSendMessage(message.content)
                    : undefined
                }
              />
            ))}
            {isProcessing && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Grok is thinking...
                </Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Input area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isProcessing}
        placeholder={
          showQuickActions
            ? 'Try a quick action above or type your own command...'
            : 'Type a message...'
        }
      />
    </Box>
  );

  if (mode === 'drawer') {
    return (
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400, md: 480 } },
        }}
      >
        {renderContent()}
      </Drawer>
    );
  }

  if (mode === 'floating' || isFullscreen) {
    return (
      <>
        <Collapse in={!isOpen && !isMinimized}>
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1300,
            }}
            onClick={() => {
              setIsMinimized(false);
              onClose();
            }}
          >
            <Badge color="error" variant="dot" invisible={!automationEnabled}>
              <AIIcon />
            </Badge>
          </Fab>
        </Collapse>

        <Collapse in={isOpen && !isMinimized}>
          <Paper
            elevation={8}
            sx={{
              position: 'fixed',
              bottom: isFullscreen ? 0 : 24,
              right: isFullscreen ? 0 : 24,
              width: isFullscreen ? '100%' : { xs: '90%', sm: 400, md: 480 },
              height: isFullscreen ? '100vh' : { xs: '80vh', sm: 600 },
              maxHeight: '100vh',
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: isFullscreen ? 0 : 2,
            }}
          >
            {renderContent()}
          </Paper>
        </Collapse>

        {isMinimized && (
          <Fab
            color="primary"
            variant="extended"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1300,
            }}
            onClick={() => setIsMinimized(false)}
          >
            <AIIcon sx={{ mr: 1 }} />
            Grok Assistant
          </Fab>
        )}
      </>
    );
  }

  return null;
};

export default GrokChatPanel;