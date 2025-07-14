import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';

interface ComplianceFinding {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedResources: string[];
  remediation?: string;
  deadline?: Date;
  status: 'open' | 'in_progress' | 'resolved';
}

interface ComplianceReportProps {
  onRemediate?: (findingId: string) => void;
}

const ComplianceReport: React.FC<ComplianceReportProps> = ({ onRemediate }) => {
  // Mock compliance data
  const complianceStatus = 'partial' as const;
  const overallScore = 78;
  
  const findings: ComplianceFinding[] = [
    {
      id: 'finding_1',
      category: 'Data Retention',
      severity: 'medium',
      description: 'Customer data retention period exceeds policy requirements. Some records are older than 2 years without active consent.',
      affectedResources: ['customers', 'communications'],
      remediation: 'Archive or delete data older than 2 years, or obtain renewed consent',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'open',
    },
    {
      id: 'finding_2',
      category: 'Access Control',
      severity: 'high',
      description: 'Multiple users have excessive permissions that exceed their role requirements.',
      affectedResources: ['user_roles', 'permissions'],
      remediation: 'Review and reduce user permissions to minimum required levels',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
    },
    {
      id: 'finding_3',
      category: 'Audit Logging',
      severity: 'low',
      description: 'Some system activities are not being logged for audit purposes.',
      affectedResources: ['audit_logs', 'system_events'],
      remediation: 'Enable comprehensive audit logging for all user activities',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: 'open',
    },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'medium':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'low':
        return <CheckIcon sx={{ color: 'info.main' }} />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'open':
        return 'error';
      default:
        return 'default';
    }
  };

  const openFindings = findings.filter(f => f.status === 'open');
  const inProgressFindings = findings.filter(f => f.status === 'in_progress');
  const resolvedFindings = findings.filter(f => f.status === 'resolved');

  const complianceCategories = [
    { name: 'Data Protection', score: 85, status: 'compliant' },
    { name: 'Access Control', score: 70, status: 'at_risk' },
    { name: 'Audit & Monitoring', score: 75, status: 'at_risk' },
    { name: 'Incident Response', score: 90, status: 'compliant' },
    { name: 'Business Continuity', score: 80, status: 'compliant' },
  ];

  return (
    <Box>
      {/* Compliance Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold">
                    {overallScore}%
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Compliance Score
                  </Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={overallScore}
                sx={{ mt: 2 }}
                color={overallScore >= 80 ? 'success' : 'warning'}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold" color="error.main">
                {openFindings.length}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Open Findings
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Require immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {inProgressFindings.length}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                In Progress
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Being actively remediated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance Categories */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Compliance by Category
        </Typography>
        <Grid container spacing={2}>
          {complianceCategories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.name}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{category.name}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {category.score}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={category.score}
                  color={category.score >= 80 ? 'success' : category.score >= 70 ? 'warning' : 'error'}
                  sx={{ height: 6, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {category.status.replace('_', ' ')}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Active Findings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Compliance Findings
        </Typography>

        {findings.length === 0 ? (
          <Alert severity="success">
            <Typography variant="subtitle1" fontWeight="medium">
              All Compliance Requirements Met
            </Typography>
            <Typography variant="body2">
              Your system meets all current compliance requirements.
            </Typography>
          </Alert>
        ) : (
          <List>
            {findings.map((finding, index) => {
              const daysUntilDeadline = finding.deadline ? differenceInDays(finding.deadline, new Date()) : null;
              
              return (
                <React.Fragment key={finding.id}>
                  <ListItem
                    sx={{
                      display: 'block',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        {getSeverityIcon(finding.severity)}
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {finding.category}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={finding.severity}
                              size="small"
                              color={getSeverityColor(finding.severity) as any}
                            />
                            <Chip
                              label={finding.status.replace('_', ' ')}
                              size="small"
                              color={getStatusColor(finding.status) as any}
                              variant="outlined"
                            />
                            {daysUntilDeadline !== null && (
                              <Chip
                                label={`${daysUntilDeadline} days`}
                                size="small"
                                icon={<ScheduleIcon />}
                                color={daysUntilDeadline < 7 ? 'error' : daysUntilDeadline < 14 ? 'warning' : 'default'}
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    <Typography variant="body2" paragraph>
                      {finding.description}
                    </Typography>

                    {finding.remediation && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BuildIcon fontSize="small" />
                          Recommended Remediation
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {finding.remediation}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Affected Resources
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {finding.affectedResources.map((resource) => (
                          <Chip
                            key={resource}
                            label={resource}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>

                    {finding.deadline && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        Deadline: {format(finding.deadline, 'MMM dd, yyyy')}
                      </Typography>
                    )}

                    {finding.status === 'open' && onRemediate && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => onRemediate(finding.id)}
                      >
                        Start Remediation
                      </Button>
                    )}
                  </ListItem>
                  {index < findings.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default ComplianceReport;