const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Mock job data
let jobs = [
  {
    id: '1',
    jobNumber: 'JOB-001',
    title: 'Network Setup',
    description: 'Complete network infrastructure setup',
    status: 'active',
    priority: 'high',
    customerId: '1',
    customer: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      isArchived: false,
    },
    startAt: '2024-01-20T09:00:00Z',
    endAt: '2024-01-20T17:00:00Z',
    estimatedDuration: 480,
    total: 2500,
    progressPercentage: 35,
    tags: ['Network', 'Installation'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    jobNumber: 'JOB-002',
    title: 'Server Maintenance',
    description: 'Monthly server maintenance and updates',
    status: 'completed',
    priority: 'medium',
    customerId: '2',
    customer: {
      id: '2',
      companyName: 'ABC Corporation',
      email: 'contact@abc.com',
      isArchived: false,
    },
    startAt: '2024-01-18T10:00:00Z',
    endAt: '2024-01-18T14:00:00Z',
    estimatedDuration: 240,
    total: 800,
    progressPercentage: 100,
    tags: ['Maintenance', 'Server'],
    completedAt: '2024-01-18T13:30:00Z',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-18T13:30:00Z',
  },
];

// Get all jobs with filtering and pagination
router.get('/', authenticateToken, (req, res) => {
  const {
    search,
    status,
    priority,
    customerId,
    page = 1,
    limit = 25,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = req.query;

  let filteredJobs = [...jobs];

  // Apply filters
  if (search) {
    const searchLower = search.toLowerCase();
    filteredJobs = filteredJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchLower) ||
        job.jobNumber.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower)
    );
  }

  if (status) {
    const statusArray = Array.isArray(status) ? status : [status];
    filteredJobs = filteredJobs.filter((job) => statusArray.includes(job.status));
  }

  if (priority) {
    const priorityArray = Array.isArray(priority) ? priority : [priority];
    filteredJobs = filteredJobs.filter((job) => priorityArray.includes(job.priority));
  }

  if (customerId) {
    filteredJobs = filteredJobs.filter((job) => job.customerId === customerId);
  }

  // Sort
  filteredJobs.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const order = sortOrder === 'asc' ? 1 : -1;
    return aVal > bVal ? order : -order;
  });

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  res.json({
    jobs: paginatedJobs,
    total: filteredJobs.length,
    page: parseInt(page),
    limit: parseInt(limit),
    hasMore: endIndex < filteredJobs.length,
  });
});

// Get single job
router.get('/:id', authenticateToken, (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.json(job);
});

// Create job
router.post('/', authenticateToken, (req, res) => {
  const jobCount = jobs.length + 1;
  const newJob = {
    id: Date.now().toString(),
    jobNumber: `JOB-${String(jobCount).padStart(3, '0')}`,
    ...req.body,
    status: 'active',
    progressPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  jobs.push(newJob);
  res.status(201).json(newJob);
});

// Update job
router.put('/:id', authenticateToken, (req, res) => {
  const index = jobs.findIndex((j) => j.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }

  jobs[index] = {
    ...jobs[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };

  res.json(jobs[index]);
});

// Update job status
router.patch('/:id/status', authenticateToken, (req, res) => {
  const index = jobs.findIndex((j) => j.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }

  jobs[index].status = req.body.status;
  jobs[index].updatedAt = new Date().toISOString();

  if (req.body.status === 'completed') {
    jobs[index].completedAt = new Date().toISOString();
    jobs[index].progressPercentage = 100;
  }

  res.json(jobs[index]);
});

// Archive job
router.post('/:id/archive', authenticateToken, (req, res) => {
  const index = jobs.findIndex((j) => j.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }

  jobs[index].status = 'archived';
  jobs[index].updatedAt = new Date().toISOString();

  res.json(jobs[index]);
});

// Delete job
router.delete('/:id', authenticateToken, (req, res) => {
  const index = jobs.findIndex((j) => j.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }

  jobs.splice(index, 1);
  res.status(204).send();
});

// Get job statistics
router.get('/stats', authenticateToken, (req, res) => {
  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((j) => j.status === 'active').length,
    completedJobs: jobs.filter((j) => j.status === 'completed').length,
    totalRevenue: jobs.reduce((sum, job) => sum + job.total, 0),
    statusBreakdown: {
      active: jobs.filter((j) => j.status === 'active').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      cancelled: jobs.filter((j) => j.status === 'cancelled').length,
      on_hold: jobs.filter((j) => j.status === 'on_hold').length,
      archived: jobs.filter((j) => j.status === 'archived').length,
    },
  };

  res.json(stats);
});

module.exports = router;