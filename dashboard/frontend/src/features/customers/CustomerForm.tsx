import React, { useEffect } from 'react';
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
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
  Autocomplete,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetCustomerDetailsQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useGetCustomerTagsQuery,
} from '@services/api/customerApi';
import type { CustomerFormData } from '@/types/customer.types';

const schema: yup.ObjectSchema<CustomerFormData> = yup.object({
  firstName: yup.string().optional(),
  lastName: yup.string().optional(),
  companyName: yup.string().optional(),
  email: yup.string().email('Invalid email address').required('Email is required'),
  phone: yup.string().optional().matches(/^[\d\s\-\(\)\+]*$/, 'Invalid phone number'),
  address: yup.object({
    street1: yup.string().optional(),
    street2: yup.string().optional(),
    city: yup.string().optional(),
    province: yup.string().optional(),
    postalCode: yup.string().optional(),
    country: yup.string().optional().default('Canada'),
  }).optional(),
  tags: yup.array().of(yup.string().required()).optional(),
  notes: yup.string().optional(),
  preferredContactMethod: yup.string().oneOf(['email', 'phone', 'text']).optional(),
}).test('name-required', 'Either company name or first name is required', function(values) {
  return !!(values.companyName || values.firstName);
});

export const CustomerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const { data: customer, isLoading: isLoadingCustomer } = useGetCustomerDetailsQuery(id!, {
    skip: !isEditMode,
  });
  const { data: availableTags } = useGetCustomerTagsQuery();
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CustomerFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      address: {
        street1: '',
        street2: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'Canada',
      },
      tags: [],
      notes: '',
      preferredContactMethod: 'email',
    },
  });

  useEffect(() => {
    if (customer && isEditMode) {
      reset({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        companyName: customer.companyName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || {
          street1: '',
          street2: '',
          city: '',
          province: '',
          postalCode: '',
          country: 'Canada',
        },
        tags: customer.tags || [],
        notes: customer.notes || '',
        preferredContactMethod: customer.preferredContactMethod || 'email',
      });
    }
  }, [customer, isEditMode, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (isEditMode) {
        await updateCustomer({ id: id!, data }).unwrap();
      } else {
        await createCustomer(data).unwrap();
      }
      navigate('/customers');
    } catch (error) {
      console.error('Failed to save customer:', error);
    }
  };

  const provinces = [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' },
    { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'NS', name: 'Nova Scotia' },
    { code: 'NT', name: 'Northwest Territories' },
    { code: 'NU', name: 'Nunavut' },
    { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'Prince Edward Island' },
    { code: 'QC', name: 'Quebec' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'YT', name: 'Yukon' },
  ];

  if (isLoadingCustomer) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Edit Customer' : 'Add New Customer'}
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          <Card>
            <CardHeader title="Basic Information" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid xs={12}>
                  <Controller
                    name="companyName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Company Name"
                        error={!!errors.companyName}
                        helperText={errors.companyName?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="First Name"
                        error={!!errors.firstName}
                        helperText={errors.firstName?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Last Name"
                        error={!!errors.lastName}
                        helperText={errors.lastName?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Contact Information" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email"
                        type="email"
                        error={!!errors.email}
                        helperText={errors.email?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Phone"
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12}>
                  <Controller
                    name="preferredContactMethod"
                    control={control}
                    render={({ field }) => (
                      <FormControl>
                        <RadioGroup {...field} row>
                          <FormControlLabel value="email" control={<Radio />} label="Email" />
                          <FormControlLabel value="phone" control={<Radio />} label="Phone" />
                          <FormControlLabel value="text" control={<Radio />} label="Text" />
                        </RadioGroup>
                        <FormHelperText>Preferred Contact Method</FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Address" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid xs={12}>
                  <Controller
                    name="address.street1"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Street Address"
                        error={!!errors.address?.street1}
                        helperText={errors.address?.street1?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12}>
                  <Controller
                    name="address.street2"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Apartment, Suite, etc."
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    name="address.city"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="City"
                        error={!!errors.address?.city}
                        helperText={errors.address?.city?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={3}>
                  <Controller
                    name="address.province"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.address?.province}>
                        <InputLabel>Province</InputLabel>
                        <Select {...field} label="Province">
                          <MenuItem value="">Select Province</MenuItem>
                          {provinces.map(prov => (
                            <MenuItem key={prov.code} value={prov.code}>
                              {prov.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.address?.province && (
                          <FormHelperText>{errors.address.province.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={3}>
                  <Controller
                    name="address.postalCode"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Postal Code"
                        error={!!errors.address?.postalCode}
                        helperText={errors.address?.postalCode?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
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
                <Grid xs={12}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={4}
                        label="Notes"
                        error={!!errors.notes}
                        helperText={errors.notes?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate('/customers')}
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
                isEditMode ? 'Update Customer' : 'Create Customer'
              )}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
};