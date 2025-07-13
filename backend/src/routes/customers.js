const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Mock customer data
let customers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    address: {
      street1: '123 Main St',
      city: 'New York',
      province: 'NY',
      postalCode: '10001',
    },
    isArchived: false,
    tags: ['VIP', 'Residential'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    companyName: 'ABC Corporation',
    email: 'contact@abc.com',
    phone: '(555) 987-6543',
    address: {
      street1: '456 Business Ave',
      city: 'Los Angeles',
      province: 'CA',
      postalCode: '90001',
    },
    isArchived: false,
    tags: ['Commercial'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '(555) 456-7890',
    isArchived: false,
    tags: ['Residential'],
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
];

// Get all customers with filtering and pagination
router.get('/', authenticateToken, (req, res) => {
  const {
    search,
    isArchived,
    page = 1,
    limit = 25,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = req.query;

  let filteredCustomers = [...customers];

  // Apply filters
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCustomers = filteredCustomers.filter(
      (customer) =>
        customer.firstName?.toLowerCase().includes(searchLower) ||
        customer.lastName?.toLowerCase().includes(searchLower) ||
        customer.companyName?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower)
    );
  }

  if (isArchived !== undefined) {
    filteredCustomers = filteredCustomers.filter(
      (customer) => customer.isArchived === (isArchived === 'true')
    );
  }

  // Sort
  filteredCustomers.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const order = sortOrder === 'asc' ? 1 : -1;
    return aVal > bVal ? order : -order;
  });

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  res.json({
    customers: paginatedCustomers,
    total: filteredCustomers.length,
    page: parseInt(page),
    limit: parseInt(limit),
    hasMore: endIndex < filteredCustomers.length,
  });
});

// Get single customer
router.get('/:id', authenticateToken, (req, res) => {
  const customer = customers.find((c) => c.id === req.params.id);
  
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  res.json(customer);
});

// Create customer
router.post('/', authenticateToken, (req, res) => {
  const newCustomer = {
    id: Date.now().toString(),
    ...req.body,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

// Update customer
router.put('/:id', authenticateToken, (req, res) => {
  const index = customers.findIndex((c) => c.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  customers[index] = {
    ...customers[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };

  res.json(customers[index]);
});

// Archive/unarchive customer
router.patch('/:id/archive', authenticateToken, (req, res) => {
  const index = customers.findIndex((c) => c.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  customers[index].isArchived = req.body.isArchived;
  customers[index].updatedAt = new Date().toISOString();

  res.json(customers[index]);
});

// Delete customer
router.delete('/:id', authenticateToken, (req, res) => {
  const index = customers.findIndex((c) => c.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  customers.splice(index, 1);
  res.status(204).send();
});

// Customer sync status (mock)
router.get('/sync-status', authenticateToken, (req, res) => {
  res.json({
    isRunning: false,
    lastSync: new Date().toISOString(),
    totalCustomers: customers.length,
    syncedCustomers: customers.length,
    pendingCustomers: 0,
    errorCustomers: 0,
  });
});

// Get customer tags
router.get('/tags', authenticateToken, (req, res) => {
  const allTags = new Set();
  customers.forEach((customer) => {
    if (customer.tags) {
      customer.tags.forEach((tag) => allTags.add(tag));
    }
  });
  res.json(Array.from(allTags));
});

module.exports = router;