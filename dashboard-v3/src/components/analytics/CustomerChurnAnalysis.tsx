import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  TrendingDown as TrendingDownIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CardGiftcard as GiftIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';
import { CustomerChurnRisk } from '../../types/analytics';

interface CustomerChurnAnalysisProps {
  risks: CustomerChurnRisk[];
  onRetentionAction?: (customerId: string, strategy: string) => void;
}

const CustomerChurnAnalysis: React.FC<CustomerChurnAnalysisProps> = ({
  risks,
  onRetentionAction,
}) => {
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <WarningIcon sx={{ color: 'error.main' }} />;
      case 'medium':
        return <TrendingDownIcon sx={{ color: 'warning.main' }} />;
      case 'low':
        return <CheckIcon sx={{ color: 'success.main' }} />;
      default:
        return null;
    }
  };

  const getStrategyIcon = (strategy: string) => {
    if (strategy.includes('email') || strategy.includes('Email')) return <EmailIcon />;
    if (strategy.includes('call') || strategy.includes('phone')) return <PhoneIcon />;
    if (strategy.includes('discount') || strategy.includes('offer')) return <OfferIcon />;
    if (strategy.includes('loyalty') || strategy.includes('reward')) return <GiftIcon />;
    return <EmailIcon />;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Summary statistics
  const totalCustomers = risks.length;
  const highRiskCount = risks.filter(r => r.riskLevel === 'high').length;
  const mediumRiskCount = risks.filter(r => r.riskLevel === 'medium').length;
  const averageChurnRate = risks.reduce((sum, r) => sum + r.churnProbability, 0) / totalCustomers;

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Customers Analyzed
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalCustomers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderColor: 'error.main', borderWidth: 2, borderStyle: 'solid' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                High Risk Customers
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {highRiskCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Require immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Average Churn Risk
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {(averageChurnRate * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Retention Budget
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                $12,500
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available for retention efforts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customer Risk List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Customer Churn Risk Analysis
        </Typography>

        <List>
          {risks.map((risk) => (
            <ListItem
              key={risk.customerId}
              sx={{
                border: '1px solid',
                borderColor: risk.riskLevel === 'high' ? 'error.main' : 'divider',
                borderRadius: 1,
                mb: 2,
                display: 'block',
                p: 2,
                backgroundColor: risk.riskLevel === 'high' ? 'error.light' : 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56 }}>
                  <PersonIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Customer #{risk.customerId.split('_')[1]}
                    </Typography>
                    {getRiskIcon(risk.riskLevel)}
                    <Chip
                      label={risk.riskLevel}
                      size="small"
                      color={getRiskColor(risk.riskLevel) as any}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Churn probability: {(risk.churnProbability * 100).toFixed(0)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={risk.churnProbability * 100}
                    sx={{
                      mt: 1,
                      height: 6,
                      borderRadius: 1,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor:
                          risk.riskLevel === 'high' ? 'error.main' :
                          risk.riskLevel === 'medium' ? 'warning.main' : 'success.main',
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Risk Factors */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Risk Factors
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {risk.factors.map((factor, idx) => (
                    <Tooltip key={idx} title={`Weight: ${(factor.weight * 100).toFixed(0)}%`}>
                      <Chip
                        label={`${factor.factor}: ${factor.value}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: factor.weight > 0.5 ? 'error.main' : 'text.secondary',
                          color: factor.weight > 0.5 ? 'error.main' : 'text.secondary',
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>

              {/* Retention Strategies */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Recommended Retention Strategies
                </Typography>
                <Grid container spacing={1}>
                  {risk.retentionStrategies.slice(0, 3).map((strategy, idx) => (
                    <Grid item xs={12} sm={4} key={idx}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {getStrategyIcon(strategy.strategy)}
                            <Typography variant="caption" fontWeight="medium">
                              {strategy.strategy}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip
                              label={`${(strategy.effectiveness * 100).toFixed(0)}% effective`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              ${strategy.cost}
                            </Typography>
                          </Box>
                          {onRetentionAction && (
                            <Button
                              size="small"
                              fullWidth
                              sx={{ mt: 1 }}
                              onClick={() => onRetentionAction(risk.customerId, strategy.strategy)}
                            >
                              Execute
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default CustomerChurnAnalysis;