import React, { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Badge,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Monitor as MonitorIcon,
  Shield as ShieldIcon,
  Assignment as AuditIcon,
  BugReport as ThreatIcon,
  Assessment as ReportIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { securityService } from '../../services/security/SecurityService';
import { monitoringService } from '../../services/monitoring/MonitoringService';
import { SecurityDashboard } from '../../types/security';
import SecurityOverview from '../../components/security/SecurityOverview';
import SecurityEvents from '../../components/security/SecurityEvents';
import ThreatDetection from '../../components/security/ThreatDetection';
import AuditLogs from '../../components/security/AuditLogs';
import ComplianceReport from '../../components/security/ComplianceReport';
import SystemMonitoring from '../../components/security/SystemMonitoring';

const SecurityMonitoringPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSecurityDashboard();
  }, []);

  const loadSecurityDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await securityService.getSecurityDashboard();
      setDashboard(data);

      // Record monitoring metrics
      monitoringService.recordMetric('security_dashboard_load', 1, 'count');
    } catch (err: any) {
      setError('Failed to load security dashboard');
      console.error('Error loading security dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityDashboard();
    setRefreshing(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Record tab view
    const tabNames = ['overview', 'events', 'threats', 'audit', 'compliance', 'monitoring'];
    monitoringService.recordMetric('security_tab_view', 1, 'count', {
      tab: tabNames[newValue],
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadSecurityDashboard}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!dashboard) {
    return null;
  }

  const hasActiveThreats = dashboard.overview.activeThreats > 0;
  const hasOpenFindings = dashboard.overview.openFindings > 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Security & Monitoring
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time security monitoring and compliance management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh dashboard">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Security settings">
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerts */}
      {(hasActiveThreats || hasOpenFindings) && (
        <Alert 
          severity={hasActiveThreats ? 'error' : 'warning'}
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={() => setActiveTab(hasActiveThreats ? 2 : 4)}>
              View Details
            </Button>
          }
        >
          <Typography variant="subtitle2" fontWeight="medium">
            {hasActiveThreats && `${dashboard.overview.activeThreats} active threats detected. `}
            {hasOpenFindings && `${dashboard.overview.openFindings} compliance findings require attention.`}
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Overview" 
            icon={<SecurityIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Security Events" 
            icon={<ShieldIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Threat Detection
                {hasActiveThreats && (
                  <Badge badgeContent={dashboard.overview.activeThreats} color="error" />
                )}
              </Box>
            }
            icon={<ThreatIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Audit Logs" 
            icon={<AuditIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Compliance
                {hasOpenFindings && (
                  <Badge badgeContent={dashboard.overview.openFindings} color="warning" />
                )}
              </Box>
            }
            icon={<ReportIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="System Monitoring" 
            icon={<MonitorIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <SecurityOverview 
          dashboard={dashboard}
          onViewDetails={(section) => {
            // Navigate to specific section
            switch (section) {
              case 'threats':
                setActiveTab(2);
                break;
              case 'compliance':
                setActiveTab(4);
                break;
              case 'report':
                // Generate detailed report
                break;
            }
          }}
        />
      )}

      {activeTab === 1 && (
        <SecurityEvents 
          events={dashboard.recentEvents}
          onEventClick={(event) => {
            // View event details
            console.log('Event clicked:', event);
          }}
        />
      )}

      {activeTab === 2 && (
        <ThreatDetection 
          threats={dashboard.threatAlerts}
          onMitigate={(threatId) => {
            // Implement threat mitigation
            console.log('Mitigate threat:', threatId);
          }}
        />
      )}

      {activeTab === 3 && (
        <AuditLogs 
          onExport={() => {
            // Export audit logs
            console.log('Export audit logs');
          }}
        />
      )}

      {activeTab === 4 && (
        <ComplianceReport 
          onRemediate={(findingId) => {
            // Implement remediation
            console.log('Remediate finding:', findingId);
          }}
        />
      )}

      {activeTab === 5 && (
        <SystemMonitoring 
          metrics={dashboard.metrics}
          healthChecks={monitoringService.getHealthStatus()}
          alerts={monitoringService.getActiveAlerts()}
          onAcknowledgeAlert={(alertId) => {
            monitoringService.acknowledgeAlert(alertId);
            handleRefresh();
          }}
        />
      )}
    </Box>
  );
};

export default SecurityMonitoringPage;