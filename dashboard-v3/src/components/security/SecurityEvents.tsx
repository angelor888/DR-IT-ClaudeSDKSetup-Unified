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
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { SecurityEvent } from '../../types/security';

interface SecurityEventsProps {
  events: SecurityEvent[];
  onEventClick?: (event: SecurityEvent) => void;
}

const SecurityEvents: React.FC<SecurityEventsProps> = ({
  events,
  onEventClick,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'info':
        return <InfoIcon sx={{ color: 'info.main' }} />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'login':
      case 'logout':
        return 'primary';
      case 'access_denied':
      case 'suspicious_activity':
        return 'error';
      case 'permission_change':
        return 'warning';
      case 'data_export':
      case 'api_call':
        return 'default';
      default:
        return 'default';
    }
  };

  const getResultIcon = (result: string) => {
    return result === 'success' 
      ? <CheckIcon sx={{ color: 'success.main', fontSize: 16 }} />
      : <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />;
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = !severityFilter || event.severity === severityFilter;
    const matchesType = !typeFilter || event.type === typeFilter;
    
    return matchesSearch && matchesSeverity && matchesType;
  });

  const paginatedEvents = filteredEvents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleExport = () => {
    // Export events as CSV
    const csv = [
      ['Timestamp', 'Type', 'Severity', 'User', 'Resource', 'Action', 'Result', 'IP Address'],
      ...filteredEvents.map(event => [
        format(event.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        event.type,
        event.severity,
        event.userEmail || '',
        event.resource || '',
        event.action || '',
        event.result,
        event.ipAddress || '',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-events-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Security Events
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export events">
            <IconButton onClick={handleExport}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search events..."
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
          {(severityFilter || typeFilter) && (
            <Chip
              label={(severityFilter ? 1 : 0) + (typeFilter ? 1 : 0)}
              size="small"
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Resource/Action</TableCell>
              <TableCell>Result</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Device</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEvents.map((event) => (
              <TableRow
                key={event.id}
                hover
                onClick={() => onEventClick?.(event)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  {format(event.timestamp, 'MMM dd, HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={event.type.replace(/_/g, ' ')}
                    size="small"
                    color={getTypeColor(event.type) as any}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getSeverityIcon(event.severity)}
                    <Typography variant="caption">
                      {event.severity}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {event.userEmail || 'Anonymous'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {event.resource && (
                    <Typography variant="body2">
                      {event.resource}
                      {event.action && ` / ${event.action}`}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getResultIcon(event.result)}
                    <Typography variant="caption">
                      {event.result}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {event.ipAddress || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {event.metadata?.device || '-'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredEvents.length}
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
        <MenuItem disabled>
          <Typography variant="subtitle2">Severity</Typography>
        </MenuItem>
        {['critical', 'error', 'warning', 'info'].map((severity) => (
          <MenuItem
            key={severity}
            onClick={() => {
              setSeverityFilter(severityFilter === severity ? null : severity);
            }}
            selected={severityFilter === severity}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </MenuItem>
        ))}
        <MenuItem divider />
        <MenuItem disabled>
          <Typography variant="subtitle2">Event Type</Typography>
        </MenuItem>
        {['login', 'logout', 'access_denied', 'permission_change', 'suspicious_activity'].map((type) => (
          <MenuItem
            key={type}
            onClick={() => {
              setTypeFilter(typeFilter === type ? null : type);
            }}
            selected={typeFilter === type}
          >
            {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </MenuItem>
        ))}
        <MenuItem divider />
        <MenuItem
          onClick={() => {
            setSeverityFilter(null);
            setTypeFilter(null);
            setFilterAnchor(null);
          }}
        >
          Clear Filters
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default SecurityEvents;