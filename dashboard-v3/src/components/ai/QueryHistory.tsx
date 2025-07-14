import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Paper,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  History as HistoryIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Replay as ReplayIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultCount?: number;
  executionTime?: number;
  dataSource?: string;
  isFavorite?: boolean;
  tags?: string[];
}

interface QueryHistoryProps {
  items: QueryHistoryItem[];
  onReplay: (item: QueryHistoryItem) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onExport?: (item: QueryHistoryItem) => void;
  onShare?: (item: QueryHistoryItem) => void;
  maxItems?: number;
  showActions?: boolean;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({
  items,
  onReplay,
  onDelete,
  onToggleFavorite,
  onExport,
  onShare,
  maxItems = 20,
  showActions = true,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = React.useState<QueryHistoryItem | null>(null);

  const displayItems = items.slice(0, maxItems);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: QueryHistoryItem) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleAction = (action: 'export' | 'share' | 'delete') => {
    if (!selectedItem) return;

    switch (action) {
      case 'export':
        onExport?.(selectedItem);
        break;
      case 'share':
        onShare?.(selectedItem);
        break;
      case 'delete':
        onDelete?.(selectedItem.id);
        break;
    }
    handleMenuClose();
  };

  if (items.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="body2">
            No query history yet. Start by asking questions about your data!
          </Typography>
        </Alert>
      </Paper>
    );
  }

  // Group items by date
  const groupedItems = displayItems.reduce((groups, item) => {
    const date = format(item.timestamp, 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, QueryHistoryItem[]>);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          Query History
        </Typography>
      </Box>

      <List sx={{ maxHeight: 600, overflow: 'auto' }}>
        {Object.entries(groupedItems).map(([date, dateItems]) => (
          <React.Fragment key={date}>
            <ListItem>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 'medium' }}
              >
                {getDateLabel(date)}
              </Typography>
            </ListItem>

            {dateItems.map((item) => (
              <ListItem
                key={item.id}
                disablePadding
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemButton onClick={() => onReplay(item)}>
                  <ListItemIcon>
                    <ReplayIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {item.query}
                        </Typography>
                        {item.isFavorite && (
                          <StarIcon fontSize="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                        </Typography>
                        {item.resultCount !== undefined && (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.resultCount} results
                            </Typography>
                          </>
                        )}
                        {item.executionTime !== undefined && (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.executionTime}ms
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                  {showActions && (
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {onToggleFavorite && (
                          <Tooltip title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(item.id);
                              }}
                            >
                              {item.isFavorite ? (
                                <StarIcon fontSize="small" />
                              ) : (
                                <StarBorderIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, item)}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  )}
                </ListItemButton>
              </ListItem>
            ))}

            <Divider sx={{ my: 1 }} />
          </React.Fragment>
        ))}
      </List>

      {items.length > maxItems && (
        <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {maxItems} of {items.length} queries
          </Typography>
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {onExport && (
          <MenuItem onClick={() => handleAction('export')}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export Results</ListItemText>
          </MenuItem>
        )}
        {onShare && (
          <MenuItem onClick={() => handleAction('share')}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share Query</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => handleAction('delete')}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
};

export default QueryHistory;