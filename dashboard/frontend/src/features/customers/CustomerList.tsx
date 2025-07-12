import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Sync as SyncIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetCustomerListQuery, useArchiveCustomerMutation } from '@services/api/customerApi';
import { getCustomerName, formatAddress } from '@/types/customer.types';
import type { Customer, CustomerFilters } from '@/types/customer.types';

export const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: 25,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetCustomerListQuery(filters);
  const [archiveCustomer] = useArchiveCustomerMutation();

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  }, [searchTerm]);

  const handleArchiveToggle = useCallback(async (customerId: string, isArchived: boolean) => {
    try {
      await archiveCustomer({ id: customerId, isArchived: !isArchived }).unwrap();
    } catch (error) {
      console.error('Failed to toggle archive status:', error);
    }
  }, [archiveCustomer]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, customerId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomerId(customerId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomerId(null);
  };

  const getSyncStatusChip = (status?: Customer['jobberSyncStatus']) => {
    switch (status) {
      case 'synced':
        return <Chip label="Synced" color="success" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'error':
        return <Chip label="Error" color="error" size="small" />;
      default:
        return <Chip label="Not Synced" color="default" size="small" />;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {getCustomerName(params.row)}
          </Typography>
          {params.row.companyName && params.row.firstName && (
            <Typography variant="caption" color="text.secondary">
              {params.row.firstName} {params.row.lastName}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Typography variant="body2" noWrap>
          {formatAddress(params.row.address)}
        </Typography>
      ),
    },
    {
      field: 'jobberSyncStatus',
      headerName: 'Sync Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<Customer>) => 
        getSyncStatusChip(params.row.jobberSyncStatus),
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 200,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Stack direction="row" spacing={0.5}>
          {params.row.tags?.map((tag, index) => (
            <Chip key={index} label={tag} size="small" variant="outlined" />
          ))}
        </Stack>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => navigate(`/customers/${params.row.id}/edit`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.isArchived ? 'Unarchive' : 'Archive'}>
            <IconButton
              size="small"
              onClick={() => handleArchiveToggle(params.row.id, params.row.isArchived)}
            >
              {params.row.isArchived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, params.row.id)}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Customers
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<UploadIcon />}
            variant="outlined"
            onClick={() => navigate('/customers/import')}
          >
            Import
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={() => navigate('/customers/export')}
          >
            Export
          </Button>
          <Button
            startIcon={<SyncIcon />}
            variant="outlined"
            onClick={() => navigate('/customers/sync')}
          >
            Sync
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => navigate('/customers/new')}
          >
            Add Customer
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
          <Button
            startIcon={<FilterIcon />}
            variant="outlined"
            size="small"
            onClick={() => navigate('/customers/filters')}
          >
            Filters
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <DataGrid
          rows={data?.customers || []}
          columns={columns}
          rowCount={data?.total || 0}
          loading={isLoading || isFetching}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationModel={{
            page: filters.page ? filters.page - 1 : 0,
            pageSize: filters.limit || 25,
          }}
          onPaginationModelChange={(model) => {
            setFilters(prev => ({
              ...prev,
              page: model.page + 1,
              limit: model.pageSize,
            }));
          }}
          onSortModelChange={(model) => {
            if (model.length > 0) {
              setFilters(prev => ({
                ...prev,
                sortBy: model[0].field as any,
                sortOrder: model[0].sort || 'asc',
              }));
            }
          }}
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/customers/${params.row.id}`)}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
          }}
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/customers/${selectedCustomerId}`);
          handleMenuClose();
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/customers/${selectedCustomerId}/jobs`);
          handleMenuClose();
        }}>
          View Jobs
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/customers/${selectedCustomerId}/sync`);
          handleMenuClose();
        }}>
          Sync with Jobber
        </MenuItem>
      </Menu>
    </Box>
  );
};