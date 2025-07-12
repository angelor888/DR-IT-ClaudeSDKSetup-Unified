import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Autocomplete,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetJobDetailsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useGetJobTemplatesQuery,
  useGetJobCategoriesQuery,
  useGetJobTagsQuery,
} from '@services/api/jobApi';
import { useGetCustomerListQuery } from '@services/api/customerApi';
import type { JobFormData, JobLineItem } from '@/types/job.types';
import { getCustomerName } from '@/types/customer.types';

const schema: yup.ObjectSchema<JobFormData> = yup.object({
  title: yup.string().required('Job title is required'),
  description: yup.string().optional(),
  customerId: yup.string().required('Customer is required'),
  propertyId: yup.string().optional(),
  priority: yup.string().oneOf(['low', 'medium', 'high', 'urgent']).required('Priority is required'),
  category: yup.string().optional(),
  startAt: yup.string().optional(),
  endAt: yup.string().optional(),
  estimatedDuration: yup.number().optional().min(0, 'Duration must be positive'),
  allDay: yup.boolean().optional(),
  lineItems: yup.array().of(
    yup.object({
      name: yup.string().required('Item name is required'),
      description: yup.string().optional(),
      quantity: yup.number().required('Quantity is required').min(1, 'Quantity must be at least 1'),
      unitPrice: yup.number().required('Unit price is required').min(0, 'Price must be positive'),
      total: yup.number().required(),
    })
  ).optional(),
  taxRate: yup.number().optional().min(0, 'Tax rate must be positive').max(100, 'Tax rate cannot exceed 100%'),
  tags: yup.array().of(yup.string().required()).optional(),
  notes: yup.string().optional(),
  internalNotes: yup.string().optional(),
  source: yup.string().oneOf(['website', 'phone', 'referral', 'jobber', 'manual']).optional(),
  visits: yup.array().optional(),
});

export const JobForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');

  const { data: job, isLoading: isLoadingJob } = useGetJobDetailsQuery(id!, {
    skip: !isEditMode,
  });
  const { data: customers } = useGetCustomerListQuery({ limit: 100 });
  const { data: templates } = useGetJobTemplatesQuery();
  const { data: categories } = useGetJobCategoriesQuery();
  const { data: availableTags } = useGetJobTagsQuery();
  const [createJob, { isLoading: isCreating }] = useCreateJobMutation();
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<JobFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      customerId: '',
      priority: 'medium',
      category: '',
      estimatedDuration: 0,
      allDay: false,
      lineItems: [],
      taxRate: 0,
      tags: [],
      notes: '',
      internalNotes: '',
      source: 'manual',
      visits: [],
    },
  });

  const { fields: lineItemFields, append: appendLineItem, remove: removeLineItem } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const watchedLineItems = watch('lineItems');
  const watchedTaxRate = watch('taxRate');

  useEffect(() => {
    if (job && isEditMode) {
      reset({
        title: job.title,
        description: job.description || '',
        customerId: job.customerId,
        propertyId: job.property?.id || '',
        priority: job.priority,
        category: job.category || '',
        startAt: job.startAt || '',
        endAt: job.endAt || '',
        estimatedDuration: job.estimatedDuration || 0,
        allDay: false,
        lineItems: job.lineItems || [],
        taxRate: job.taxAmount && job.subtotal ? (job.taxAmount / job.subtotal) * 100 : 0,
        tags: job.tags || [],
        notes: job.notes || '',
        internalNotes: job.internalNotes || '',
        source: job.source || 'manual',
        visits: job.visits || [],
      });
      setSelectedCustomer(job.customerId);
    }
  }, [job, isEditMode, reset]);

  // Calculate totals when line items or tax rate changes
  useEffect(() => {
    if (watchedLineItems) {
      watchedLineItems.forEach((item, index) => {
        if (item && typeof item.quantity === 'number' && typeof item.unitPrice === 'number') {
          const total = item.quantity * item.unitPrice;
          setValue(`lineItems.${index}.total`, total);
        }
      });
    }
  }, [watchedLineItems, setValue]);

  const calculateSubtotal = () => {
    return watchedLineItems?.reduce((sum, item) => {
      return sum + (item?.total || 0);
    }, 0) || 0;
  };

  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    return subtotal * ((watchedTaxRate || 0) / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  const onSubmit = async (data: JobFormData) => {
    try {
      const jobData = {
        ...data,
        estimatedDuration: data.estimatedDuration || undefined,
        startAt: data.startAt || undefined,
        endAt: data.endAt || undefined,
      };

      if (isEditMode) {
        await updateJob({ id: id!, data: jobData }).unwrap();
      } else {
        await createJob(jobData).unwrap();
      }
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const handleAddLineItem = () => {
    appendLineItem({
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setValue('title', template.name);
      setValue('category', template.category);
      setValue('estimatedDuration', template.estimatedDuration);
      setValue('tags', template.tags);
      setValue('lineItems', template.defaultLineItems);
    }
  };

  if (isLoadingJob) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Edit Job' : 'Create New Job'}
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          {!isEditMode && templates && templates.length > 0 && (
            <Card>
              <CardHeader title="Job Templates" />
              <CardContent>
                <Autocomplete
                  options={templates}
                  getOptionLabel={(template) => template.name}
                  onChange={(_, template) => template && handleTemplateSelect(template.id)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Start from template"
                      placeholder="Select a template to prefill job details"
                    />
                  )}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title="Basic Information" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid xs={12}>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Job Title"
                        error={!!errors.title}
                        helperText={errors.title?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        error={!!errors.description}
                        helperText={errors.description?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="customerId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.customerId}>
                        <InputLabel>Customer</InputLabel>
                        <Select 
                          {...field} 
                          label="Customer"
                          startAdornment={<PersonIcon />}
                        >
                          {customers?.customers.map(customer => (
                            <MenuItem key={customer.id} value={customer.id}>
                              {getCustomerName(customer)}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.customerId && (
                          <FormHelperText>{errors.customerId.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={3}>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.priority}>
                        <InputLabel>Priority</InputLabel>
                        <Select {...field} label="Priority">
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="urgent">Urgent</MenuItem>
                        </Select>
                        {errors.priority && (
                          <FormHelperText>{errors.priority.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={3}>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={categories || []}
                        freeSolo
                        onChange={(_, value) => field.onChange(value)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Category"
                            error={!!errors.category}
                            helperText={errors.category?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Scheduling" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="startAt"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        {...field}
                        label="Start Date & Time"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date?.toISOString())}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.startAt,
                            helperText: errors.startAt?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="endAt"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        {...field}
                        label="End Date & Time"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date?.toISOString())}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.endAt,
                            helperText: errors.endAt?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="estimatedDuration"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Estimated Duration (minutes)"
                        InputProps={{
                          startAdornment: <ScheduleIcon />,
                        }}
                        error={!!errors.estimatedDuration}
                        helperText={errors.estimatedDuration?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="allDay"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="All Day Event"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader 
              title="Line Items" 
              action={
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddLineItem}
                  variant="outlined"
                  size="small"
                >
                  Add Item
                </Button>
              }
            />
            <CardContent>
              <Stack spacing={2}>
                {lineItemFields.map((field, index) => (
                  <Card key={field.id} variant="outlined">
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid xs={12} sm={3}>
                          <Controller
                            name={`lineItems.${index}.name`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Item Name"
                                size="small"
                                error={!!errors.lineItems?.[index]?.name}
                                helperText={errors.lineItems?.[index]?.name?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid xs={12} sm={2}>
                          <Controller
                            name={`lineItems.${index}.quantity`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                type="number"
                                label="Quantity"
                                size="small"
                                error={!!errors.lineItems?.[index]?.quantity}
                                helperText={errors.lineItems?.[index]?.quantity?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid xs={12} sm={2}>
                          <Controller
                            name={`lineItems.${index}.unitPrice`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                type="number"
                                label="Unit Price"
                                size="small"
                                InputProps={{
                                  startAdornment: '$',
                                }}
                                error={!!errors.lineItems?.[index]?.unitPrice}
                                helperText={errors.lineItems?.[index]?.unitPrice?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Total"
                            size="small"
                            value={`$${(watchedLineItems?.[index]?.total || 0).toFixed(2)}`}
                            InputProps={{
                              readOnly: true,
                            }}
                          />
                        </Grid>
                        <Grid xs={12} sm={3}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Controller
                              name={`lineItems.${index}.description`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Description"
                                  size="small"
                                  placeholder="Optional"
                                />
                              )}
                            />
                            <IconButton
                              color="error"
                              onClick={() => removeLineItem(index)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                
                {lineItemFields.length > 0 && (
                  <>
                    <Divider />
                    <Grid container spacing={2}>
                      <Grid xs={12} sm={6}>
                        <Controller
                          name="taxRate"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              type="number"
                              label="Tax Rate (%)"
                              size="small"
                              error={!!errors.taxRate}
                              helperText={errors.taxRate?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid xs={12} sm={6}>
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Subtotal:</Typography>
                            <Typography variant="body2">${calculateSubtotal().toFixed(2)}</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Tax:</Typography>
                            <Typography variant="body2">${calculateTaxAmount().toFixed(2)}</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="h6">Total:</Typography>
                            <Typography variant="h6">${calculateTotal().toFixed(2)}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Additional Information" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid xs={12}>
                  <Controller
                    name="tags"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        multiple
                        options={availableTags || []}
                        freeSolo
                        onChange={(_, value) => field.onChange(value)}
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
                            placeholder="Add tags"
                            helperText="Press Enter to add custom tags"
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={4}
                        label="Customer Notes"
                        helperText="Visible to customers"
                        error={!!errors.notes}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="internalNotes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={4}
                        label="Internal Notes"
                        helperText="Internal use only"
                        error={!!errors.internalNotes}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="source"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Lead Source</InputLabel>
                        <Select {...field} label="Lead Source">
                          <MenuItem value="website">Website</MenuItem>
                          <MenuItem value="phone">Phone Call</MenuItem>
                          <MenuItem value="referral">Referral</MenuItem>
                          <MenuItem value="jobber">Jobber</MenuItem>
                          <MenuItem value="manual">Manual Entry</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate('/jobs')}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!isDirty || isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <CircularProgress size={24} />
              ) : (
                isEditMode ? 'Update Job' : 'Create Job'
              )}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
};