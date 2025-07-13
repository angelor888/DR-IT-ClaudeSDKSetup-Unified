import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiTrend = new Trend('api_response_time');
const authTrend = new Trend('auth_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    errors: ['rate<0.05'],                           // Error rate under 5%
    http_req_failed: ['rate<0.05'],                  // HTTP failure rate under 5%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'https://staging.dashboard.duetright.com';
const TEST_USER = __ENV.TEST_USER || 'test@duetright.com';
const TEST_PASS = __ENV.TEST_PASS || 'TestPassword123!';

// Helper function to handle responses
function handleResponse(res, name) {
  const success = check(res, {
    [`${name} - status is 200`]: (r) => r.status === 200,
    [`${name} - response time < 500ms`]: (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  
  if (name.includes('auth')) {
    authTrend.add(res.timings.duration);
  } else {
    apiTrend.add(res.timings.duration);
  }
  
  return success;
}

// Test scenarios
export default function () {
  // Scenario weights
  const scenario = Math.random();
  
  if (scenario < 0.1) {
    // 10% - New user registration flow
    registrationFlow();
  } else if (scenario < 0.3) {
    // 20% - Authentication flow
    authenticationFlow();
  } else if (scenario < 0.6) {
    // 30% - Dashboard browsing
    dashboardFlow();
  } else if (scenario < 0.8) {
    // 20% - API interactions
    apiFlow();
  } else {
    // 20% - Heavy operations
    heavyOperationsFlow();
  }
  
  sleep(Math.random() * 3 + 1); // Random think time between 1-4 seconds
}

// Test flows
function registrationFlow() {
  const uniqueEmail = `test_${Date.now()}_${Math.random()}@example.com`;
  
  const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    email: uniqueEmail,
    password: 'TestPassword123!',
    displayName: 'Load Test User',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  handleResponse(registerRes, 'registration');
}

function authenticationFlow() {
  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: TEST_USER,
    password: TEST_PASS,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (handleResponse(loginRes, 'auth/login')) {
    const token = loginRes.json('token');
    
    // Get user profile
    const profileRes = http.get(`${BASE_URL}/api/auth/user`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
    });
    handleResponse(profileRes, 'auth/profile');
    
    // Logout
    const logoutRes = http.post(`${BASE_URL}/api/auth/logout`, null, {
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
    });
    handleResponse(logoutRes, 'auth/logout');
  }
}

function dashboardFlow() {
  // Simulate authenticated user
  const token = authenticateUser();
  if (!token) return;
  
  const headers = { 
    'Authorization': `Bearer ${token}`,
  };
  
  // Load dashboard
  const dashboardRes = http.get(`${BASE_URL}/api/dashboard/summary`, { headers });
  handleResponse(dashboardRes, 'dashboard/summary');
  
  // Load customers
  const customersRes = http.get(`${BASE_URL}/api/customers?limit=20`, { headers });
  handleResponse(customersRes, 'customers/list');
  
  // Load jobs
  const jobsRes = http.get(`${BASE_URL}/api/jobs?limit=20`, { headers });
  handleResponse(jobsRes, 'jobs/list');
  
  // Load communications
  const messagesRes = http.get(`${BASE_URL}/api/communications/messages?limit=50`, { headers });
  handleResponse(messagesRes, 'communications/messages');
}

function apiFlow() {
  const token = authenticateUser();
  if (!token) return;
  
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Search customers
  const searchRes = http.get(`${BASE_URL}/api/customers/search?q=test`, { headers });
  handleResponse(searchRes, 'customers/search');
  
  // Get customer details
  const customerRes = http.get(`${BASE_URL}/api/customers/cust_123`, { headers });
  handleResponse(customerRes, 'customers/detail');
  
  // Create a note
  const noteRes = http.post(`${BASE_URL}/api/notes`, JSON.stringify({
    customerId: 'cust_123',
    content: 'Load test note',
    type: 'general',
  }), { headers });
  handleResponse(noteRes, 'notes/create');
  
  // Get calendar events
  const calendarRes = http.get(`${BASE_URL}/api/calendar/events?start=2025-01-01&end=2025-01-31`, { headers });
  handleResponse(calendarRes, 'calendar/events');
}

function heavyOperationsFlow() {
  const token = authenticateUser();
  if (!token) return;
  
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Export data
  const exportRes = http.post(`${BASE_URL}/api/reports/export`, JSON.stringify({
    type: 'customers',
    format: 'csv',
    dateRange: 'last_30_days',
  }), { headers });
  handleResponse(exportRes, 'reports/export');
  
  // Sync external service
  const syncRes = http.post(`${BASE_URL}/api/sync/jobber`, null, { headers });
  handleResponse(syncRes, 'sync/jobber');
  
  // Generate report
  const reportRes = http.post(`${BASE_URL}/api/reports/generate`, JSON.stringify({
    type: 'monthly_summary',
    month: '2025-01',
  }), { headers });
  handleResponse(reportRes, 'reports/generate');
}

// Helper to authenticate and get token
function authenticateUser() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: TEST_USER,
    password: TEST_PASS,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginRes.status === 200) {
    return loginRes.json('token');
  }
  
  errorRate.add(1);
  return null;
}

// Handle test summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
    'summary.html': htmlReport(data),
  };
}

// Generate text summary
function textSummary(data, options) {
  const { metrics } = data;
  const duration = metrics.iteration_duration;
  const requests = metrics.http_reqs;
  const errors = metrics.errors;
  
  return `
Load Test Results
=================
Duration: ${duration.avg}ms avg (${duration.p(95)}ms p95)
Requests: ${requests.count} total (${requests.rate}/s)
Errors: ${errors.rate * 100}%
Success Rate: ${(1 - errors.rate) * 100}%

Thresholds:
${Object.entries(data.thresholds || {}).map(([key, value]) => 
  `  ${key}: ${value.passes ? '✓' : '✗'}`
).join('\n')}
  `;
}

// Generate HTML report
function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { margin: 10px 0; padding: 10px; background: #f0f0f0; }
    .pass { color: green; }
    .fail { color: red; }
  </style>
</head>
<body>
  <h1>Load Test Report</h1>
  <div class="metric">
    <h3>Summary</h3>
    <p>Total Requests: ${data.metrics.http_reqs.count}</p>
    <p>Error Rate: ${(data.metrics.errors.rate * 100).toFixed(2)}%</p>
    <p>Avg Response Time: ${data.metrics.http_req_duration.avg.toFixed(2)}ms</p>
  </div>
</body>
</html>
  `;
}