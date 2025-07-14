import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  TableChart as TableIcon,
  BarChart as ChartIcon,
  PieChart as PieIcon,
  Timeline as TimelineIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export interface QueryResult {
  query: string;
  type: 'table' | 'chart' | 'metric' | 'list' | 'timeline';
  data: any;
  columns?: string[];
  summary?: string;
  metadata?: {
    totalCount?: number;
    executionTime?: number;
    dataSource?: string;
  };
  error?: string;
}

interface QueryResultsProps {
  result: QueryResult | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: (format: 'csv' | 'json' | 'pdf') => void;
  onShare?: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const QueryResults: React.FC<QueryResultsProps> = ({
  result,
  isLoading = false,
  onRefresh,
  onExport,
  onShare,
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [viewMode, setViewMode] = React.useState<'table' | 'chart'>('table');

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Processing Query...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analyzing your business data
          </Typography>
        </Box>
        <LinearProgress />
      </Paper>
    );
  }

  if (!result) {
    return null;
  }

  if (result.error) {
    return (
      <Alert
        severity="error"
        action={
          onRefresh && (
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          )
        }
      >
        <Typography variant="subtitle2">Query Error</Typography>
        <Typography variant="body2">{result.error}</Typography>
      </Alert>
    );
  }

  const renderTableView = () => {
    if (!result.data || !Array.isArray(result.data)) return null;

    const columns = result.columns || (result.data[0] ? Object.keys(result.data[0]) : []);
    const displayData = result.data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column}>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {column.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.map((row, index) => (
              <TableRow key={index} hover>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {formatCellValue(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={result.data.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    );
  };

  const renderChartView = () => {
    if (!result.data || !Array.isArray(result.data)) return null;

    // Determine best chart type based on data
    const hasNumericData = result.data.some((row: any) =>
      Object.values(row).some((val) => typeof val === 'number')
    );

    if (!hasNumericData) {
      return (
        <Alert severity="info">
          No numeric data available for chart visualization
        </Alert>
      );
    }

    // Find numeric columns
    const numericColumns = result.columns?.filter((col) =>
      result.data.some((row: any) => typeof row[col] === 'number')
    ) || [];

    if (numericColumns.length === 0) return null;

    // Simple bar chart for the first numeric column
    const dataKey = numericColumns[0];
    const labelKey = result.columns?.find((col) => !numericColumns.includes(col)) || 'label';

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={result.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={labelKey} />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          <Bar dataKey={dataKey} fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderMetricView = () => {
    if (typeof result.data !== 'object' || Array.isArray(result.data)) return null;

    return (
      <Grid container spacing={2}>
        {Object.entries(result.data).map(([key, value]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Typography>
                <Typography variant="h4">
                  {formatCellValue(value)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const formatCellValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return '-';
    if (value instanceof Date) return format(value, 'MMM dd, yyyy');
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (typeof value === 'number') {
      if (value > 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value > 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toFixed(2);
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderContent = () => {
    switch (result.type) {
      case 'table':
        return viewMode === 'chart' ? renderChartView() : renderTableView();
      case 'chart':
        return renderChartView();
      case 'metric':
        return renderMetricView();
      default:
        return renderTableView();
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Query Results
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {result.query}
            </Typography>
            {result.summary && (
              <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                {result.summary}
              </Alert>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {result.type === 'table' && (
              <Tooltip title={viewMode === 'table' ? 'View as chart' : 'View as table'}>
                <IconButton
                  size="small"
                  onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
                >
                  {viewMode === 'table' ? <ChartIcon /> : <TableIcon />}
                </IconButton>
              </Tooltip>
            )}
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={onRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            {onShare && (
              <Tooltip title="Share">
                <IconButton size="small" onClick={onShare}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            )}
            {onExport && (
              <Tooltip title="Export">
                <IconButton size="small" onClick={() => onExport('csv')}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {result.metadata && (
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            {result.metadata.totalCount !== undefined && (
              <Chip
                label={`${result.metadata.totalCount} records`}
                size="small"
                variant="outlined"
              />
            )}
            {result.metadata.executionTime !== undefined && (
              <Chip
                label={`${result.metadata.executionTime}ms`}
                size="small"
                variant="outlined"
              />
            )}
            {result.metadata.dataSource && (
              <Chip
                label={result.metadata.dataSource}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Box>

      {renderContent()}
    </Paper>
  );
};

export default QueryResults;