import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AIInsight, MCPCommand } from '../../types';

interface AIState {
  insights: AIInsight[];
  activeCommands: MCPCommand[];
  commandHistory: MCPCommand[];
  isProcessing: boolean;
  error: string | null;
  grokStatus: 'connected' | 'disconnected' | 'error';
  mcpStatus: 'connected' | 'disconnected' | 'error';
  automationEnabled: boolean;
}

const initialState: AIState = {
  insights: [],
  activeCommands: [],
  commandHistory: [],
  isProcessing: false,
  error: null,
  grokStatus: 'disconnected',
  mcpStatus: 'disconnected',
  automationEnabled: false,
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    setInsights: (state, action: PayloadAction<AIInsight[]>) => {
      state.insights = action.payload;
    },
    addInsight: (state, action: PayloadAction<AIInsight>) => {
      state.insights.unshift(action.payload);
      // Keep only the latest 50 insights
      if (state.insights.length > 50) {
        state.insights = state.insights.slice(0, 50);
      }
    },
    removeInsight: (state, action: PayloadAction<string>) => {
      state.insights = state.insights.filter(insight => insight.id !== action.payload);
    },
    addCommand: (state, action: PayloadAction<MCPCommand>) => {
      state.activeCommands.push(action.payload);
    },
    updateCommand: (state, action: PayloadAction<MCPCommand>) => {
      const index = state.activeCommands.findIndex(cmd => cmd.id === action.payload.id);
      if (index !== -1) {
        state.activeCommands[index] = action.payload;
        
        // Move to history if completed or failed
        if (action.payload.status === 'completed' || action.payload.status === 'failed') {
          state.commandHistory.unshift(action.payload);
          state.activeCommands.splice(index, 1);
          
          // Keep only the latest 100 commands in history
          if (state.commandHistory.length > 100) {
            state.commandHistory = state.commandHistory.slice(0, 100);
          }
        }
      }
    },
    setGrokStatus: (state, action: PayloadAction<AIState['grokStatus']>) => {
      state.grokStatus = action.payload;
    },
    setMCPStatus: (state, action: PayloadAction<AIState['mcpStatus']>) => {
      state.mcpStatus = action.payload;
    },
    setAutomationEnabled: (state, action: PayloadAction<boolean>) => {
      state.automationEnabled = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isProcessing = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setProcessing,
  setInsights,
  addInsight,
  removeInsight,
  addCommand,
  updateCommand,
  setGrokStatus,
  setMCPStatus,
  setAutomationEnabled,
  setError,
  clearError,
} = aiSlice.actions;
export default aiSlice.reducer;