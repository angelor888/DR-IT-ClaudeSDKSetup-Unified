import type React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { CardSkeleton, TableSkeleton, FormSkeleton, ChartSkeleton, CalendarSkeleton, ConversationListSkeleton } from './Skeletons';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  minHeight?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 40,
  minHeight = '60vh' 
}) => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight={minHeight}
    flexDirection="column"
    gap={2}
  >
    <CircularProgress size={size} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

export const PageLoader = () => <LoadingSpinner />;

export const ComponentLoader = () => (
  <Box sx={{ p: 2 }}>
    <CardSkeleton rows={4} />
  </Box>
);

export const CommunicationsLoader = () => (
  <Box sx={{ p: 2 }}>
    <ConversationListSkeleton />
  </Box>
);

export const ChartLoader = () => <ChartSkeleton />;

export const TableLoader = () => <TableSkeleton />;

export const FormLoader = () => <FormSkeleton />;

export const CalendarLoader = () => <CalendarSkeleton />;

export const CardLoader = () => <CardSkeleton />;