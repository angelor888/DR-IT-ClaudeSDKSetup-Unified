import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Tabs,
  Tab,
  Rating,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface WorkflowStep {
  order: number;
  title: string;
  description: string;
  type: 'manual' | 'automated' | 'ai_assisted';
  estimatedTime?: number;
}

interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  estimatedSavings: number;
  steps: WorkflowStep[];
  rating: number;
  implementationCount: number;
  successRate: number;
  tags: string[];
}

const mockTemplates: WorkflowTemplate[] = [
  {
    id: '1',
    title: 'Customer Onboarding Automation',
    description: 'Streamline new customer setup with automated welcome emails and data collection',
    category: 'customer_onboarding',
    difficulty: 'beginner',
    estimatedTime: 45,
    estimatedSavings: 20,
    steps: [
      {
        order: 1,
        title: 'Set up welcome email template',
        description: 'Create a personalized welcome email with company information',
        type: 'manual',
        estimatedTime: 15,
      },
      {
        order: 2,
        title: 'Configure auto-responder',
        description: 'Set up automated email trigger for new customers',
        type: 'automated',
        estimatedTime: 10,
      },
      {
        order: 3,
        title: 'Create intake form',
        description: 'Build customer information collection form',
        type: 'manual',
        estimatedTime: 20,
      },
    ],
    rating: 4.8,
    implementationCount: 156,
    successRate: 92,
    tags: ['onboarding', 'email', 'automation'],
  },
  {
    id: '2',
    title: 'Smart Job Scheduling System',
    description: 'AI-powered job scheduling that optimizes routes and technician availability',
    category: 'job_management',
    difficulty: 'advanced',
    estimatedTime: 120,
    estimatedSavings: 60,
    steps: [
      {
        order: 1,
        title: 'Analyze current scheduling patterns',
        description: 'Review existing job data to identify optimization opportunities',
        type: 'ai_assisted',
        estimatedTime: 30,
      },
      {
        order: 2,
        title: 'Configure AI parameters',
        description: 'Set up constraints and preferences for scheduling algorithm',
        type: 'manual',
        estimatedTime: 45,
      },
      {
        order: 3,
        title: 'Implement automated scheduling',
        description: 'Deploy AI scheduler with Jobber integration',
        type: 'automated',
        estimatedTime: 45,
      },
    ],
    rating: 4.6,
    implementationCount: 89,
    successRate: 85,
    tags: ['scheduling', 'ai', 'optimization'],
  },
];

const categories = [
  { id: 'all', label: 'All Templates' },
  { id: 'customer_onboarding', label: 'Customer Onboarding' },
  { id: 'job_management', label: 'Job Management' },
  { id: 'communication', label: 'Communication' },
  { id: 'reporting', label: 'Reporting' },
];

export const WorkflowTemplates = () => {
  const [templates] = useState<WorkflowTemplate[]>(mockTemplates);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'manual': return '👤';
      case 'automated': return '🤖';
      case 'ai_assisted': return '✨';
      default: return '📝';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Workflow Templates
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pre-built automations to jumpstart your AI journey
        </Typography>
      </Box>
      {/* Category Tabs */}
      <Tabs 
        value={selectedCategory} 
        onChange={(_, value) => setSelectedCategory(value)}
        sx={{ mb: 3 }}
      >
        {categories.map(cat => (
          <Tab key={cat.id} label={cat.label} value={cat.id} />
        ))}
      </Tabs>
      {/* Template Cards */}
      <Grid container spacing={3}>
        {filteredTemplates.map(template => (
          <Grid key={template.id} size={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12,
                      md: 8
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6">
                        {template.title}
                      </Typography>
                      <Chip 
                        label={template.difficulty} 
                        size="small" 
                        color={getDifficultyColor(template.difficulty) as any}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                      {template.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid
                    size={{
                      xs: 12,
                      md: 4
                    }}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Grid container spacing={2}>
                        <Grid size={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <ScheduleIcon color="action" />
                            <Typography variant="h6">{template.estimatedTime}m</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Setup time
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <TrendingUpIcon color="success" />
                            <Typography variant="h6">{template.estimatedSavings}m</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Saved per use
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={12}>
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption">Success Rate</Typography>
                              <Typography variant="caption">{template.successRate}%</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={template.successRate} 
                              color="success"
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Expandable Steps */}
                {expandedTemplate === template.id && (
                  <Box sx={{ mt: 3 }}>
                    <Stepper orientation="vertical">
                      {template.steps.map((step, index) => (
                        <Step key={index} active>
                          <StepLabel
                            icon={<Box sx={{ fontSize: '1.5rem' }}>{getStepIcon(step.type)}</Box>}
                          >
                            {step.title}
                          </StepLabel>
                          <StepContent>
                            <Typography variant="body2" color="text.secondary">
                              {step.description}
                            </Typography>
                            {step.estimatedTime && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                Estimated time: {step.estimatedTime} minutes
                              </Typography>
                            )}
                          </StepContent>
                        </Step>
                      ))}
                    </Stepper>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <Rating value={template.rating} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" color="text.secondary">
                    {template.rating} • {template.implementationCount} implementations
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button
                  variant="text"
                  onClick={() => setExpandedTemplate(
                    expandedTemplate === template.id ? null : template.id
                  )}
                >
                  {expandedTemplate === template.id ? 'Hide Steps' : 'View Steps'}
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<PlayArrowIcon />}
                  sx={{ ml: 'auto' }}
                >
                  Start Implementation
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Coming Soon Card */}
      <Box sx={{ mt: 3 }}>
        <Card sx={{ bgcolor: 'primary.50', borderStyle: 'dashed' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <BuildIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" color="primary">
              More Templates Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We're constantly adding new workflow templates based on user feedback
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};