import React, { useState } from 'react';
import { Fab, Badge, Tooltip, Zoom } from '@mui/material';
import { SmartToy as AIIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import GrokChatPanel from './GrokChatPanel';

const FloatingAIButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { automationEnabled, activeCommands } = useSelector((state: RootState) => state.ai);
  
  const hasActiveCommands = activeCommands.length > 0;

  return (
    <>
      <Zoom in={!isChatOpen}>
        <Tooltip 
          title={automationEnabled ? "AI Assistant (Automation Active)" : "AI Assistant"} 
          placement="left"
        >
          <Fab
            color="primary"
            aria-label="AI Assistant"
            onClick={() => setIsChatOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1200,
            }}
          >
            <Badge 
              color="error" 
              variant={hasActiveCommands ? "standard" : "dot"} 
              badgeContent={hasActiveCommands ? activeCommands.length : undefined}
              invisible={!automationEnabled && !hasActiveCommands}
            >
              <AIIcon />
            </Badge>
          </Fab>
        </Tooltip>
      </Zoom>

      <GrokChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        mode="floating"
      />
    </>
  );
};

export default FloatingAIButton;