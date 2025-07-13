import type React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Stack,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

// Generic card skeleton
export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <Card>
    <CardHeader
      avatar={<Skeleton variant="circular" width={40} height={40} />}
      title={<Skeleton variant="text" width="60%" />}
      subheader={<Skeleton variant="text" width="40%" />}
    />
    <CardContent>
      <Stack spacing={1}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} variant="text" width={`${Math.random() * 40 + 60}%`} />
        ))}
      </Stack>
    </CardContent>
  </Card>
);

// Dashboard stats skeleton
export const StatsSkeleton: React.FC = () => (
  <Grid container spacing={3}>
    {Array.from({ length: 4 }).map((_, index) => (
      <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="30%" height={16} />
          </Stack>
        </Paper>
      </Grid>
    ))}
  </Grid>
);

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          {Array.from({ length: columns }).map((_, index) => (
            <TableCell key={index}>
              <Skeleton variant="text" width="80%" />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton variant="text" width={`${Math.random() * 40 + 60}%`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// List skeleton
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <Stack spacing={2}>
    {Array.from({ length: items }).map((_, index) => (
      <Card key={index}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="circular" width={48} height={48} />
            <Box flex={1}>
              <Skeleton variant="text" width="70%" height={24} />
              <Skeleton variant="text" width="50%" height={20} />
              <Skeleton variant="text" width="30%" height={16} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={32} />
          </Stack>
        </CardContent>
      </Card>
    ))}
  </Stack>
);

// Form skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 5 }) => (
  <Card>
    <CardHeader
      title={<Skeleton variant="text" width="40%" height={32} />}
      subheader={<Skeleton variant="text" width="60%" height={20} />}
    />
    <CardContent>
      <Stack spacing={3}>
        {Array.from({ length: fields }).map((_, index) => (
          <Box key={index}>
            <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={56} />
          </Box>
        ))}
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Skeleton variant="rectangular" width={80} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

// Chart skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Paper sx={{ p: 2 }}>
    <Stack spacing={2}>
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="rectangular" width="100%" height={height} />
      <Stack direction="row" spacing={2} justifyContent="center">
        {Array.from({ length: 3 }).map((_, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <Skeleton variant="circular" width={12} height={12} />
            <Skeleton variant="text" width={60} height={16} />
          </Stack>
        ))}
      </Stack>
    </Stack>
  </Paper>
);

// Calendar skeleton
export const CalendarSkeleton: React.FC = () => (
  <Paper sx={{ p: 2 }}>
    <Stack spacing={2}>
      {/* Calendar header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Skeleton variant="text" width="200px" height={32} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rectangular" width={80} height={32} />
          <Skeleton variant="rectangular" width={80} height={32} />
          <Skeleton variant="rectangular" width={80} height={32} />
        </Stack>
      </Stack>
      
      {/* Calendar grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {/* Week header */}
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} variant="text" width="100%" height={24} />
        ))}
        
        {/* Calendar days */}
        {Array.from({ length: 35 }).map((_, index) => (
          <Box key={index} sx={{ minHeight: 80, p: 1 }}>
            <Skeleton variant="text" width="20px" height={16} sx={{ mb: 1 }} />
            {Math.random() > 0.7 && (
              <Skeleton variant="rectangular" width="100%" height={20} sx={{ mb: 0.5 }} />
            )}
            {Math.random() > 0.8 && (
              <Skeleton variant="rectangular" width="80%" height={20} />
            )}
          </Box>
        ))}
      </Box>
    </Stack>
  </Paper>
);

// Communications specific skeletons
export const ConversationListSkeleton: React.FC = () => (
  <Stack spacing={1}>
    {Array.from({ length: 8 }).map((_, index) => (
      <Box key={index} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={40} height={40} />
          <Box flex={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="60px" height={16} />
            </Stack>
            <Skeleton variant="text" width="80%" height={16} />
            <Skeleton variant="text" width="40%" height={14} />
          </Box>
        </Stack>
      </Box>
    ))}
  </Stack>
);

export const MessageListSkeleton: React.FC = () => (
  <Stack spacing={2} sx={{ p: 2 }}>
    {Array.from({ length: 6 }).map((_, index) => {
      const isOwn = Math.random() > 0.5;
      return (
        <Stack
          key={index}
          direction="row"
          justifyContent={isOwn ? 'flex-end' : 'flex-start'}
          spacing={1}
        >
          {!isOwn && <Skeleton variant="circular" width={32} height={32} />}
          <Box sx={{ maxWidth: '70%' }}>
            <Skeleton 
              variant="rectangular" 
              width={`${Math.random() * 200 + 100}px`} 
              height={40}
              sx={{ borderRadius: 2 }}
            />
            <Skeleton variant="text" width="60px" height={12} sx={{ mt: 0.5 }} />
          </Box>
          {isOwn && <Skeleton variant="circular" width={32} height={32} />}
        </Stack>
      );
    })}
  </Stack>
);