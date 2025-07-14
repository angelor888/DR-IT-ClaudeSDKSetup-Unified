import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Popper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Typography,
  CircularProgress,
  Fade,
  ClickAwayListener,
} from '@mui/material';
import {
  Search as SearchIcon,
  Psychology as AIIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  Group as CustomerIcon,
  Work as JobIcon,
  AttachMoney as RevenueIcon,
  Event as ScheduleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

interface QuerySuggestion {
  id: string;
  query: string;
  category: 'customers' | 'jobs' | 'revenue' | 'schedule' | 'trending';
  icon: React.ReactNode;
  description?: string;
}

interface NaturalQueryBarProps {
  onQuery: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  fullWidth?: boolean;
  recentQueries?: string[];
  onClose?: () => void;
}

const defaultSuggestions: QuerySuggestion[] = [
  {
    id: 'customers-active',
    query: 'Show me all active customers',
    category: 'customers',
    icon: <CustomerIcon />,
    description: 'List customers with active status',
  },
  {
    id: 'jobs-pending',
    query: 'What jobs are scheduled this week?',
    category: 'jobs',
    icon: <JobIcon />,
    description: 'View upcoming scheduled jobs',
  },
  {
    id: 'revenue-month',
    query: 'How much revenue this month?',
    category: 'revenue',
    icon: <RevenueIcon />,
    description: 'Current month revenue summary',
  },
  {
    id: 'customers-new',
    query: 'New customers in the last 30 days',
    category: 'customers',
    icon: <CustomerIcon />,
    description: 'Recently added customers',
  },
  {
    id: 'jobs-overdue',
    query: 'Show overdue jobs',
    category: 'jobs',
    icon: <JobIcon />,
    description: 'Jobs past their scheduled date',
  },
  {
    id: 'revenue-compare',
    query: 'Compare revenue this month vs last month',
    category: 'revenue',
    icon: <TrendingIcon />,
    description: 'Month-over-month comparison',
  },
];

const NaturalQueryBar: React.FC<NaturalQueryBarProps> = ({
  onQuery,
  placeholder = 'Ask anything about your business data...',
  autoFocus = false,
  fullWidth = true,
  recentQueries = [],
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const open = Boolean(anchorEl) && (query.length > 0 || isFocused);

  // Filter suggestions based on query
  const filteredSuggestions = query
    ? defaultSuggestions.filter(
        (s) =>
          s.query.toLowerCase().includes(query.toLowerCase()) ||
          s.description?.toLowerCase().includes(query.toLowerCase())
      )
    : defaultSuggestions;

  // Combined list of recent queries and suggestions
  const allSuggestions = [
    ...recentQueries.slice(0, 3).map((q, i) => ({
      id: `recent-${i}`,
      query: q,
      category: 'trending' as const,
      icon: <HistoryIcon />,
      description: 'Recent query',
    })),
    ...filteredSuggestions,
  ];

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim() && !isLoading) {
      setIsLoading(true);
      onQuery(query.trim());
      setQuery('');
      setAnchorEl(null);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    setQuery(suggestion.query);
    handleSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < allSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex > -1) {
      e.preventDefault();
      handleSuggestionClick(allSuggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setAnchorEl(null);
      inputRef.current?.blur();
      if (onClose) {
        onClose();
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setAnchorEl(e.currentTarget);
  };

  const handleClickAway = () => {
    setIsFocused(false);
    setAnchorEl(null);
    setSelectedIndex(-1);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
        <form onSubmit={handleSubmit}>
          <TextField
            ref={inputRef}
            fullWidth={fullWidth}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!anchorEl) {
                setAnchorEl(e.currentTarget);
              }
            }}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            variant="outlined"
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
                borderRadius: 3,
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AIIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {isLoading ? (
                    <CircularProgress size={20} />
                  ) : query ? (
                    <IconButton
                      size="small"
                      onClick={() => setQuery('')}
                      edge="end"
                    >
                      <CloseIcon />
                    </IconButton>
                  ) : (
                    <IconButton size="small" edge="end" onClick={handleSubmit}>
                      <SearchIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
        </form>

        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-start"
          transition
          sx={{ zIndex: 1400, width: anchorEl?.clientWidth }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={200}>
              <Paper
                elevation={8}
                sx={{
                  mt: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                  borderRadius: 2,
                }}
              >
                {query && (
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">
                      Press Enter to search for "{query}"
                    </Typography>
                  </Box>
                )}

                <List>
                  {allSuggestions.map((suggestion, index) => (
                    <ListItem key={suggestion.id} disablePadding>
                      <ListItemButton
                        selected={index === selectedIndex}
                        onClick={() => handleSuggestionClick(suggestion)}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon>{suggestion.icon}</ListItemIcon>
                        <ListItemText
                          primary={suggestion.query}
                          secondary={suggestion.description}
                          primaryTypographyProps={{
                            fontWeight: index === selectedIndex ? 'medium' : 'normal',
                          }}
                        />
                        {suggestion.category !== 'trending' && (
                          <Chip
                            label={suggestion.category}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>

                {allSuggestions.length === 0 && (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No suggestions found. Try a different query.
                    </Typography>
                  </Box>
                )}

                <Box
                  sx={{
                    p: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.default',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Tip: Use natural language like "Show me revenue trends" or "List pending jobs"
                  </Typography>
                </Box>
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default NaturalQueryBar;