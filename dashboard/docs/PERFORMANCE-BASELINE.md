# Performance Baseline Documentation

## Executive Summary

This document establishes performance baselines for the DuetRight IT Dashboard application. These baselines serve as reference points for monitoring application health, identifying performance degradation, and capacity planning.

## Performance Targets

### Response Time SLAs

| Endpoint Category | Target (95th percentile) | Maximum Acceptable |
|------------------|-------------------------|-------------------|
| Static Assets | < 100ms | 200ms |
| API Health Checks | < 50ms | 100ms |
| Authentication | < 200ms | 500ms |
| Data Queries | < 300ms | 1000ms |
| Search Operations | < 500ms | 2000ms |
| File Uploads | < 2000ms | 5000ms |
| WebSocket Events | < 100ms | 300ms |

### Throughput Targets

| Metric | Target | Maximum |
|--------|---------|----------|
| Concurrent Users | 500 | 1000 |
| Requests/Second | 1000 | 2500 |
| WebSocket Connections | 200 | 500 |
| API Calls/Minute | 10,000 | 25,000 |

### Resource Utilization

| Resource | Normal Operation | Alert Threshold | Critical Threshold |
|----------|-----------------|-----------------|-------------------|
| CPU Usage | 20-40% | 70% | 90% |
| Memory Usage | 512MB-1GB | 2GB | 3GB |
| Redis Memory | 100-200MB | 400MB | 500MB |
| Disk I/O | < 50 MB/s | 100 MB/s | 150 MB/s |
| Network I/O | < 10 Mbps | 50 Mbps | 100 Mbps |

## Baseline Measurements

### Application Startup

```bash
# Cold start time
Docker: 45-60 seconds
Node.js: 5-10 seconds

# Warm start time
Docker: 5-10 seconds
Node.js: 2-3 seconds

# Time to ready
Health check passing: 10-15 seconds after start
```

### API Performance

#### Authentication Endpoints
```
POST /api/auth/login
- Average: 150ms
- 95th percentile: 180ms
- 99th percentile: 250ms

POST /api/auth/register  
- Average: 200ms
- 95th percentile: 280ms
- 99th percentile: 400ms

GET /api/auth/user
- Average: 50ms
- 95th percentile: 80ms
- 99th percentile: 120ms
```

#### Data Endpoints
```
GET /api/customers
- Average: 180ms
- 95th percentile: 250ms
- 99th percentile: 400ms
- Payload size: 50-200KB

GET /api/jobs
- Average: 200ms
- 95th percentile: 300ms
- 99th percentile: 500ms
- Payload size: 100-500KB

GET /api/communications/messages
- Average: 250ms
- 95th percentile: 400ms
- 99th percentile: 800ms
- Payload size: 200KB-1MB
```

### Database Performance

#### Redis Operations
```
GET operations: < 1ms
SET operations: < 2ms
Complex queries: < 10ms
Memory usage: 150MB average
Connection pool: 10-20 active
```

#### Firestore Operations
```
Document reads: 20-50ms
Document writes: 50-100ms
Query operations: 100-300ms
Batch operations: 200-500ms
Real-time listeners: < 100ms latency
```

### Frontend Performance

#### Page Load Times
```
Dashboard: 1.2s (First Contentful Paint)
Customer List: 1.5s (Time to Interactive)
Communications: 2.0s (Largest Contentful Paint)
Calendar View: 1.8s (Time to Interactive)
```

#### Bundle Sizes
```
Initial JS: 420KB (gzipped: 127KB)
Initial CSS: 45KB (gzipped: 12KB)
Lazy-loaded chunks: 50-450KB each
Total application size: ~2MB
```

#### Lighthouse Scores
```
Performance: 92
Accessibility: 98
Best Practices: 95
SEO: 100
PWA: 95
```

## Load Testing Results

### Test Configuration
```yaml
Tool: Apache JMeter / k6
Duration: 30 minutes
Ramp-up: 5 minutes
Steady state: 20 minutes
Cool-down: 5 minutes
```

### Load Test Scenarios

#### Scenario 1: Normal Load
```
Users: 100 concurrent
Request rate: 500 req/s
Results:
- Average response time: 120ms
- 95th percentile: 200ms
- Error rate: 0.01%
- CPU usage: 35%
- Memory usage: 800MB
```

#### Scenario 2: Peak Load
```
Users: 500 concurrent
Request rate: 1500 req/s
Results:
- Average response time: 250ms
- 95th percentile: 450ms
- Error rate: 0.1%
- CPU usage: 65%
- Memory usage: 1.5GB
```

#### Scenario 3: Stress Test
```
Users: 1000 concurrent
Request rate: 3000 req/s
Results:
- Average response time: 800ms
- 95th percentile: 2000ms
- Error rate: 2.5%
- CPU usage: 95%
- Memory usage: 2.8GB
```

## Performance Optimization Recommendations

### Quick Wins
1. Enable Redis query caching for frequent operations
2. Implement pagination for large data sets
3. Add CDN for static assets
4. Enable HTTP/2 server push
5. Optimize database indexes

### Medium-term Improvements
1. Implement GraphQL for efficient data fetching
2. Add read replicas for database scaling
3. Implement request batching
4. Add service worker for offline caching
5. Optimize bundle splitting strategy

### Long-term Enhancements
1. Migrate to microservices architecture
2. Implement edge computing for global users
3. Add machine learning for predictive caching
4. Implement WebAssembly for compute-intensive tasks
5. Consider serverless for variable workloads

## Monitoring Setup

### Key Metrics to Track
```
# Application Metrics
- Request rate (req/s)
- Response time (ms)
- Error rate (%)
- Active users
- WebSocket connections

# System Metrics
- CPU usage (%)
- Memory usage (MB)
- Disk I/O (MB/s)
- Network I/O (Mbps)
- Container restarts

# Business Metrics
- API calls per customer
- Message processing time
- Job sync latency
- Search query performance
```

### Alerting Thresholds
```yaml
# Critical Alerts
- Response time > 1s for 5 minutes
- Error rate > 5% for 2 minutes
- CPU > 90% for 10 minutes
- Memory > 90% for 5 minutes
- Service down for 1 minute

# Warning Alerts
- Response time > 500ms for 10 minutes
- Error rate > 1% for 5 minutes
- CPU > 70% for 15 minutes
- Memory > 70% for 10 minutes
- Queue depth > 1000 messages
```

## Performance Testing Commands

### API Load Testing
```bash
# Using Apache Bench
ab -n 10000 -c 100 -H "Authorization: Bearer TOKEN" \
   https://dashboard.duetright.com/api/health

# Using k6
k6 run --vus 100 --duration 30m performance-test.js

# Using JMeter
jmeter -n -t dashboard-load-test.jmx -l results.jtl
```

### Frontend Performance Testing
```bash
# Lighthouse CLI
lighthouse https://dashboard.duetright.com \
  --output html --output-path ./lighthouse-report.html

# WebPageTest API
curl -X POST "https://www.webpagetest.org/runtest.php?url=https://dashboard.duetright.com&k=API_KEY"
```

### Database Performance Testing
```bash
# Redis benchmark
redis-benchmark -h localhost -p 6379 -n 100000 -c 50

# Firestore performance (custom script)
node scripts/firestore-benchmark.js --operations 10000 --concurrent 50
```

## Capacity Planning

### Growth Projections
```
Current State (July 2025):
- Users: 100
- Requests/day: 500,000
- Data storage: 10GB

6-Month Projection:
- Users: 500 (+400%)
- Requests/day: 2,500,000
- Data storage: 50GB

1-Year Projection:
- Users: 1,000 (+900%)
- Requests/day: 5,000,000
- Data storage: 150GB
```

### Scaling Recommendations
```
At 500 users:
- Add Redis cluster (3 nodes)
- Increase to 2 application instances
- Enable CDN for all regions

At 1,000 users:
- Implement horizontal pod autoscaling
- Add read replicas for Firestore
- Consider multi-region deployment
- Implement queue-based architecture
```

## Conclusion

These performance baselines provide a foundation for maintaining and improving the DuetRight Dashboard's performance. Regular monitoring against these baselines will help identify issues before they impact users and guide capacity planning decisions.

---

**Baseline Established**: July 2025
**Next Review**: October 2025
**Owner**: DevOps Team