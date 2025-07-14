import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  QueryStats as QueryIcon,
  Help as HelpIcon,
  BookmarkBorder as SaveIcon,
  Code as CodeIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import NaturalQueryBar from '../../components/ai/NaturalQueryBar';
import QueryResults from '../../components/ai/QueryResults';
import QueryHistory from '../../components/ai/QueryHistory';
import { queryService, QueryResponse } from '../../services/ai/QueryService';
import { QueryHistoryItem } from '../../components/ai/QueryHistory';
import { useDispatch } from 'react-redux';
import { setError } from '../../store/slices/aiSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`query-tabpanel-${index}`}
      aria-labelledby={`query-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const NaturalQueryPage: React.FC = () => {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<QueryResponse | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [showSQL, setShowSQL] = useState(false);

  useEffect(() => {
    // Load query history from localStorage
    loadQueryHistory();
  }, []);

  const loadQueryHistory = () => {
    try {
      const saved = localStorage.getItem('query_history');
      if (saved) {
        const history = JSON.parse(saved);
        setQueryHistory(history);
        setRecentQueries(history.slice(0, 5).map((h: QueryHistoryItem) => h.query));
      }
    } catch (error) {
      console.error('Failed to load query history:', error);
    }
  };

  const saveQueryHistory = (newItem: QueryHistoryItem) => {
    const updatedHistory = [newItem, ...queryHistory].slice(0, 50);
    setQueryHistory(updatedHistory);
    setRecentQueries(updatedHistory.slice(0, 5).map(h => h.query));
    
    try {
      localStorage.setItem('query_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save query history:', error);
    }
  };

  const handleQuery = async (query: string) => {
    setIsLoading(true);
    setTabValue(0); // Switch to results tab
    
    try {
      const response = await queryService.processQuery({
        query,
        context: {
          dataSource: 'all',
          limit: 100,
        },
      });

      setCurrentResult(response);

      // Save to history
      const historyItem: QueryHistoryItem = {
        id: `query-${Date.now()}`,
        query,
        timestamp: new Date(),
        resultCount: response.metadata.totalCount,
        executionTime: response.metadata.executionTime,
        dataSource: response.metadata.dataSource,
      };
      
      saveQueryHistory(historyItem);
      await queryService.saveQueryToHistory(query, response);
    } catch (error: any) {
      console.error('Query failed:', error);
      dispatch(setError(error.message || 'Query execution failed'));
      
      setCurrentResult({
        query,
        type: 'table',
        data: null,
        error: error.message || 'Failed to execute query',
        metadata: {
          totalCount: 0,
          executionTime: 0,
          dataSource: 'error',
        },
      } as any);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplayQuery = (item: QueryHistoryItem) => {
    handleQuery(item.query);
  };

  const handleDeleteHistory = (id: string) => {
    const updatedHistory = queryHistory.filter(h => h.id !== id);
    setQueryHistory(updatedHistory);
    localStorage.setItem('query_history', JSON.stringify(updatedHistory));
  };

  const handleToggleFavorite = (id: string) => {
    const updatedHistory = queryHistory.map(h =>
      h.id === id ? { ...h, isFavorite: !h.isFavorite } : h
    );
    setQueryHistory(updatedHistory);
    localStorage.setItem('query_history', JSON.stringify(updatedHistory));
  };

  const handleExportResults = (format: 'csv' | 'json' | 'pdf') => {
    if (!currentResult) return;

    // In a real implementation, this would generate and download the file
    console.log(`Exporting results as ${format}`, currentResult);
  };

  const handleShareQuery = () => {
    if (!currentResult) return;

    // In a real implementation, this would generate a shareable link
    const shareUrl = `${window.location.origin}/query?q=${encodeURIComponent(currentResult.query)}`;
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Natural Language Query
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ask questions about your data in plain English
        </Typography>
      </Box>

      {/* Query Bar */}
      <Box sx={{ mb: 3 }}>
        <NaturalQueryBar
          onQuery={handleQuery}
          recentQueries={recentQueries}
          placeholder="Try: 'Show me revenue for this month' or 'List all active customers'"
        />
      </Box>

      {/* Example Queries */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <HelpIcon fontSize="small" color="action" />
          <Typography variant="subtitle2">Example Queries</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            'Show me all active customers',
            'Revenue this month vs last month',
            'Jobs scheduled this week',
            'Top 5 customers by revenue',
            'Average job completion time',
            'Overdue invoices',
          ].map((example) => (
            <Chip
              key={example}
              label={example}
              size="small"
              onClick={() => handleQuery(example)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Paper>

      {/* Results and History */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label="Results" />
              <Tab label="SQL View" disabled={!currentResult?.sql} />
              <Tab label="Insights" disabled={!currentResult?.suggestions} />
            </Tabs>

            <Box sx={{ p: 2 }}>
              <TabPanel value={tabValue} index={0}>
                {isLoading ? (
                  <Box>
                    <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                ) : currentResult ? (
                  <QueryResults
                    result={currentResult}
                    onExport={handleExportResults}
                    onShare={handleShareQuery}
                    onRefresh={() => handleQuery(currentResult.query)}
                  />
                ) : (
                  <Alert severity="info">
                    <Typography variant="body2">
                      Start by typing a question in the search bar above
                    </Typography>
                  </Alert>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {currentResult?.sql && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Generated SQL</Typography>
                      <Tooltip title="Copy SQL">
                        <IconButton
                          size="small"
                          onClick={() => navigator.clipboard.writeText(currentResult.sql!)}
                        >
                          <CodeIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        backgroundColor: 'grey.900',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        overflow: 'auto',
                      }}
                    >
                      <pre style={{ margin: 0, color: '#fff' }}>
                        {currentResult.sql}
                      </pre>
                    </Paper>
                    {currentResult.metadata.confidence && (
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={`Confidence: ${Math.round(currentResult.metadata.confidence * 100)}%`}
                          color={currentResult.metadata.confidence > 0.8 ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                {currentResult?.suggestions && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Related Queries
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {currentResult.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outlined"
                          fullWidth
                          sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                          onClick={() => handleQuery(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}
              </TabPanel>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <QueryHistory
            items={queryHistory}
            onReplay={handleReplayQuery}
            onDelete={handleDeleteHistory}
            onToggleFavorite={handleToggleFavorite}
            maxItems={15}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default NaturalQueryPage;