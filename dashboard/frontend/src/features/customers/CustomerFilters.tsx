import React, { useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  FilterListOff as ClearIcon,
} from '@mui/icons-material';
import { useGetCustomerTagsQuery } from '@services/api/customerApi';
import type { CustomerFilters } from '@/types/customer.types';

interface CustomerFiltersDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
}

export const CustomerFiltersDrawer: React.FC<CustomerFiltersDrawerProps> = ({
  open,
  onClose,
  filters,
  onFiltersChange,
}) => {
  const [localFilters, setLocalFilters] = useState<CustomerFilters>(filters);
  const { data: availableTags } = useGetCustomerTagsQuery();

  const handleChange = (field: keyof CustomerFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: CustomerFilters = {
      page: 1,
      limit: filters.limit || 25,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const provinces = [
    'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 400, p: 3 } }}
    >
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Filter Customers</Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={localFilters.isArchived || false}
              onChange={(e) => handleChange('isArchived', e.target.checked)}
            />
          }
          label="Show Archived Customers"
        />

        <FormControl fullWidth>
          <InputLabel>Sync Status</InputLabel>
          <Select
            value={localFilters.jobberSyncStatus || ''}
            onChange={(e) => handleChange('jobberSyncStatus', e.target.value || undefined)}
            label="Sync Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="synced">Synced</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="not_synced">Not Synced</MenuItem>
          </Select>
        </FormControl>

        <Autocomplete
          multiple
          options={availableTags || []}
          value={localFilters.tags || []}
          onChange={(_, value) => handleChange('tags', value)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              placeholder="Select tags"
            />
          )}
        />

        <TextField
          fullWidth
          label="City"
          value={localFilters.city || ''}
          onChange={(e) => handleChange('city', e.target.value || undefined)}
        />

        <FormControl fullWidth>
          <InputLabel>Province</InputLabel>
          <Select
            value={localFilters.province || ''}
            onChange={(e) => handleChange('province', e.target.value || undefined)}
            label="Province"
          >
            <MenuItem value="">All</MenuItem>
            {provinces.map(prov => (
              <MenuItem key={prov} value={prov}>{prov}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={localFilters.sortBy || 'updatedAt'}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            label="Sort By"
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="createdAt">Created Date</MenuItem>
            <MenuItem value="updatedAt">Updated Date</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Sort Order</InputLabel>
          <Select
            value={localFilters.sortOrder || 'desc'}
            onChange={(e) => handleChange('sortOrder', e.target.value)}
            label="Sort Order"
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClear}
          >
            Clear Filters
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleApply}
          >
            Apply Filters
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
};