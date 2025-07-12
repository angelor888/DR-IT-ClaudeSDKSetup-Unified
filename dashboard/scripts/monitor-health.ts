#!/usr/bin/env ts-node

import axios from 'axios';
import { logger } from '../src/utils/logger';

const log = logger.child('HealthMonitor');

interface HealthCheckResult {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  responseTime: number;
  details?: any;
  error?: string;
}

async function checkEndpoint(baseUrl: string, path: string): Promise<HealthCheckResult> {
  const endpoint = `${baseUrl}${path}`;
  const startTime = Date.now();
  
  try {
    const response = await axios.get(endpoint, {
      timeout: 5000,
      validateStatus: () => true, // Don't throw on any status
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200) {
      const status = response.data.status || 'healthy';
      return {
        endpoint: path,
        status: status === 'healthy' ? 'healthy' : status === 'degraded' ? 'degraded' : 'unhealthy',
        responseTime,
        details: response.data,
      };
    } else {
      return {
        endpoint: path,
        status: 'error',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      endpoint: path,
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function monitorHealth(baseUrl: string): Promise<void> {
  log.info(`Monitoring health of ${baseUrl}`);
  
  const endpoints = [
    '/health',
    '/health/live',
    '/health/ready',
    '/health/detailed',
    '/api/health/services',
  ];
  
  const results: HealthCheckResult[] = [];
  
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(baseUrl, endpoint);
    results.push(result);
    
    if (result.status === 'healthy') {
      log.info(`✅ ${endpoint} - ${result.responseTime}ms`);
    } else if (result.status === 'degraded') {
      log.warn(`⚠️  ${endpoint} - ${result.responseTime}ms - DEGRADED`);
    } else {
      log.error(`❌ ${endpoint} - ${result.responseTime}ms - ${result.error || 'UNHEALTHY'}`);
    }
  }
  
  // Summary
  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const degradedCount = results.filter(r => r.status === 'degraded').length;
  const unhealthyCount = results.filter(r => r.status === 'unhealthy' || r.status === 'error').length;
  
  console.log('\n📊 Summary:');
  console.log(`  Healthy: ${healthyCount}/${results.length}`);
  if (degradedCount > 0) console.log(`  Degraded: ${degradedCount}`);
  if (unhealthyCount > 0) console.log(`  Unhealthy: ${unhealthyCount}`);
  
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  console.log(`  Average response time: ${avgResponseTime.toFixed(0)}ms`);
  
  // Exit with error if any endpoints are unhealthy
  if (unhealthyCount > 0) {
    process.exit(1);
  }
}

// Main execution
const baseUrl = process.argv[2] || 'http://localhost:8080';

monitorHealth(baseUrl).catch(error => {
  log.error('Health monitoring failed', error);
  process.exit(1);
});