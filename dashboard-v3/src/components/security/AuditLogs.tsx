import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  duration?: number;
  status: 'success' | 'failure';
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

interface AuditLogsProps {
  onExport?: () => void;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ onExport }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);

  // Mock audit logs data
  const mockLogs: AuditLog[] = [
    {
      id: 'audit_1',
      timestamp: new Date('2025-01-14T10:30:00'),
      userId: 'user_123',
      userEmail: 'john@duetright.com',
      action: 'customer_updated',
      resource: 'customers',
      resourceId: 'cust_001',
      ipAddress: '192.168.1.100',
      duration: 250,
      status: 'success',
      changes: [
        { field: 'phone', oldValue: '(206) 555-0123', newValue: '(206) 555-0124' },
        { field: 'address', oldValue: '123 Main St', newValue: '123 Main Street' },
      ],
    },
    {
      id: 'audit_2',
      timestamp: new Date('2025-01-14T10:25:00'),
      userId: 'user_456',
      userEmail: 'sarah@duetright.com',
      action: 'job_created',
      resource: 'jobs',
      resourceId: 'job_003',
      ipAddress: '192.168.1.101',
      duration: 150,
      status: 'success',
    },
    {
      id: 'audit_3',
      timestamp: new Date('2025-01-14T10:20:00'),
      userId: 'user_789',
      userEmail: 'mike@duetright.com',
      action: 'workflow_executed',
      resource: 'workflows',
      resourceId: 'wf_005',
      ipAddress: '192.168.1.102',
      duration: 5000,
      status: 'success',
    },
    {
      id: 'audit_4',
      timestamp: new Date('2025-01-14T10:15:00'),
      userId: 'user_123',
      userEmail: 'john@duetright.com',
      action: 'login_attempt',
      resource: 'auth',
      ipAddress: '192.168.1.100',
      duration: 100,
      status: 'failure',
    },
    {
      id: 'audit_5',
      timestamp: new Date('2025-01-14T10:10:00'),
      userId: 'user_456',
      userEmail: 'sarah@duetright.com',
      action: 'grok_query',
      resource: 'ai',
      ipAddress: '192.168.1.101',
      duration: 750,
      status: 'success',
    },
  ];

  const filteredLogs = mockLogs.filter(log =>
    !searchTerm ||
    log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getActionColor = (action: string) => {
    if (action.includes('created') || action.includes('login')) return 'success';
    if (action.includes('deleted') || action.includes('failure')) return 'error';
    if (action.includes('updated')) return 'warning';
    return 'default';
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Status', 'IP Address', 'Duration (ms)'],
      ...filteredLogs.map(log => [
        format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        log.userEmail,
        log.action,
        log.resource,
        log.status,
        log.ipAddress || '',
        log.duration?.toString() || '',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    if (onExport) onExport();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Audit Logs
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Date range filter">
            <IconButton>
              <DateRangeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export logs">
            <IconButton onClick={handleExport}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search audit logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={(e) => setFilterAnchor(e.currentTarget)}
        >
          Filters
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Changes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  {format(log.timestamp, 'MMM dd, HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {log.userEmail}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.action.replace(/_/g, ' ')}
                    size="small"
                    color={getActionColor(log.action) as any}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {log.resource}
                    {log.resourceId && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {log.resourceId}
                      </Typography>
                    )}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.status}
                    size="small"
                    color={log.status === 'success' ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {log.ipAddress || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {log.duration ? `${log.duration}ms` : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {log.changes && log.changes.length > 0 ? (
                    <Tooltip
                      title={
                        <Box>
                          {log.changes.map((change, idx) => (
                            <Typography key={idx} variant="caption" display="block">
                              {change.field}: {String(change.oldValue)} → {String(change.newValue)}
                            </Typography>
                          ))}
                        </Box>
                      }
                    >
                      <Chip
                        label={`${log.changes.length} changes`}
                        size="small"
                        variant="outlined"
                      />
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredLogs.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem onClick={() => setFilterAnchor(null)}>
          Last 24 Hours
        </MenuItem>
        <MenuItem onClick={() => setFilterAnchor(null)}>
          Last Week
        </MenuItem>
        <MenuItem onClick={() => setFilterAnchor(null)}>
          Last Month
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={() => setFilterAnchor(null)}>
          Success Only
        </MenuItem>
        <MenuItem onClick={() => setFilterAnchor(null)}>
          Failures Only
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default AuditLogs;