import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'lead';
  totalProjects: number;
  totalValue: string;
  lastContact: string;
  avatar?: string;
}

const CustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const customers: Customer[] = [
    {
      id: '1',
      name: 'John & Sarah Miller',
      email: 'john.miller@email.com',
      phone: '(206) 555-0123',
      address: '1234 Green Lake Ave, Seattle, WA',
      status: 'active',
      totalProjects: 3,
      totalValue: '$85,000',
      lastContact: '2 days ago',
    },
    {
      id: '2',
      name: 'Capital Hill Properties LLC',
      email: 'contact@chproperties.com',
      phone: '(206) 555-0456',
      address: '567 Capitol Hill St, Seattle, WA',
      status: 'active',
      totalProjects: 1,
      totalValue: '$45,000',
      lastContact: '1 week ago',
    },
    {
      id: '3',
      name: 'Maria Rodriguez',
      email: 'maria.r@email.com',
      phone: '(206) 555-0789',
      address: '890 Ballard Ave, Seattle, WA',
      status: 'lead',
      totalProjects: 0,
      totalValue: '$0',
      lastContact: '3 days ago',
    },
    {
      id: '4',
      name: 'David & Lisa Chen',
      email: 'dchen@email.com',
      phone: '(206) 555-0321',
      address: '432 Queen Anne St, Seattle, WA',
      status: 'active',
      totalProjects: 2,
      totalValue: '$62,000',
      lastContact: '5 days ago',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'lead': return 'warning';
      default: return 'default';
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Customer Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
          sx={{
            backgroundColor: '#FFBB2F',
            color: '#2C2B2E',
            '&:hover': {
              backgroundColor: '#FF8A3D',
            },
          }}
        >
          Add Customer
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {customers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {customers.filter(c => c.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {customers.filter(c => c.status === 'lead').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Leads
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                $192K
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Grid container spacing={2}>
          {filteredCustomers.map((customer) => (
            <Grid xs={12} md={6} lg={4} key={customer.id}>
              <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {customer.name}
                        </Typography>
                        <Chip 
                          label={customer.status} 
                          size="small" 
                          color={getStatusColor(customer.status)}
                        />
                      </Box>
                    </Box>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {customer.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {customer.phone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {customer.address}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {customer.totalProjects} Projects
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Value: {customer.totalValue}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Last Contact
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {customer.lastContact}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    fullWidth
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Customer Name"
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone"
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Address"
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setIsAddDialogOpen(false)}
            sx={{
              backgroundColor: '#FFBB2F',
              color: '#2C2B2E',
              '&:hover': {
                backgroundColor: '#FF8A3D',
              },
            }}
          >
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;