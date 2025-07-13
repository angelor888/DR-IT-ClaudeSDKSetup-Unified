import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Tooltip,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Email as EmailIcon,
  ContentPaste as ContentPasteIcon,
  Support as SupportIcon,
  Analytics as AnalyticsIcon,
  AutoFixHigh as AutoFixHighIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  EmojiEvents as EmojiEventsIcon,
  Share as ShareIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface AIProject {
  id: string;
  title: string;
  description: string;
  type: string;
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeInvested: number;
  timeSaved: number;
  efficiency: number;
  sharedWith: string[];
  tags: string[];
  completionDate?: string;
  lastUsed?: string;
}

const projectTypes = [
  { id: 'email_automation', label: 'Email Automation', icon: <EmailIcon /> },
  { id: 'content_creation', label: 'Content Creation', icon: <ContentPasteIcon /> },
  { id: 'customer_service', label: 'Customer Service', icon: <SupportIcon /> },
  { id: 'data_analysis', label: 'Data Analysis', icon: <AnalyticsIcon /> },
  { id: 'workflow_automation', label: 'Workflow Automation', icon: <AutoFixHighIcon /> },
];

// Mock data - replace with API calls
const mockProjects: AIProject[] = [
  {
    id: '1',
    title: 'Customer Email Responder',
    description: 'Automated responses to common customer inquiries',
    type: 'email_automation',
    status: 'completed',
    difficulty: 'beginner',
    timeInvested: 120,
    timeSaved: 45,
    efficiency: 85,
    sharedWith: ['user2', 'user3'],
    tags: ['email', 'customer-service', 'automation'],
    completionDate: '2025-01-10',
    lastUsed: '2025-01-12',
  },
  {
    id: '2',
    title: 'Job Description Generator',
    description: 'AI-powered job descriptions from templates',
    type: 'content_creation',
    status: 'in_progress',
    difficulty: 'intermediate',
    timeInvested: 60,
    timeSaved: 30,
    efficiency: 70,
    sharedWith: [],
    tags: ['jobber', 'content', 'ai'],
  },
  {
    id: '3',
    title: 'Smart Schedule Optimizer',
    description: 'AI suggestions for better job scheduling',
    type: 'workflow_automation',
    status: 'planning',
    difficulty: 'advanced',
    timeInvested: 0,
    timeSaved: 0,
    efficiency: 0,
    sharedWith: [],
    tags: ['scheduling', 'optimization', 'ai'],
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'success';
    case 'intermediate': return 'warning';
    case 'advanced': return 'error';
    default: return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircleIcon color="success" />;
    case 'in_progress': return <PlayArrowIcon color="primary" />;
    case 'paused': return <PauseIcon color="warning" />;
    default: return <SchoolIcon color="action" />;
  }
};

export const AIProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<AIProject[]>(mockProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 0) return matchesSearch; // All
    if (activeTab === 1) return matchesSearch && project.status === 'in_progress';
    if (activeTab === 2) return matchesSearch && project.status === 'completed';
    if (activeTab === 3) return matchesSearch && project.sharedWith.length > 0;
    return matchesSearch;
  });

  const totalTimeSaved = projects.reduce((acc, project) => acc + project.timeSaved, 0);
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  const speedDialActions = [
    { icon: <EmailIcon />, name: 'Email Automation', action: () => navigate('/ai-learning/new?type=email_automation') },
    { icon: <ContentPasteIcon />, name: 'Content Creation', action: () => navigate('/ai-learning/new?type=content_creation') },
    { icon: <SupportIcon />, name: 'Customer Service', action: () => navigate('/ai-learning/new?type=customer_service') },
    { icon: <AutoFixHighIcon />, name: 'Workflow Automation', action: () => navigate('/ai-learning/new?type=workflow_automation') },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          AI Learning Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Master AI skills through concrete projects that solve real business problems
        </Typography>
      </Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Time Saved</Typography>
              </Box>
              <Typography variant="h3">{totalTimeSaved}h</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                This month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PlayArrowIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Projects</Typography>
              </Box>
              <Typography variant="h3">{activeProjects}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                In progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Completed</Typography>
              </Box>
              <Typography variant="h3">{completedProjects}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Projects finished
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEventsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Achievement</Typography>
              </Box>
              <Typography variant="h3">Level 3</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                AI Practitioner
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Search and Tabs */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search projects, tags, or descriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="All Projects" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
          <Tab label="Shared" />
        </Tabs>
      </Box>
      {/* Project Cards */}
      <Grid container spacing={3}>
        {filteredProjects.map((project, index) => (
          <Grid
            key={project.id}
            size={{
              xs: 12,
              md: 6,
              lg: 4
            }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: 4,
                    transition: 'all 0.3s ease'
                  }
                }}
                onClick={() => navigate(`/ai-learning/projects/${project.id}`)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getStatusIcon(project.status)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {project.title}
                      </Typography>
                    </Box>
                    <Chip 
                      label={project.difficulty} 
                      size="small" 
                      color={getDifficultyColor(project.difficulty) as any}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {project.description}
                  </Typography>

                  {project.efficiency > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Efficiency</Typography>
                        <Typography variant="body2">{project.efficiency}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={project.efficiency} />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimerIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption">
                        {project.timeInvested}h invested
                      </Typography>
                    </Box>
                    {project.timeSaved > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">
                          {project.timeSaved}h saved
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {project.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  {project.sharedWith.length > 0 && (
                    <AvatarGroup max={3} sx={{ mr: 'auto' }}>
                      {project.sharedWith.map(userId => (
                        <Avatar key={userId} sx={{ width: 24, height: 24 }}>
                          {userId[0].toUpperCase()}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  )}
                  <Tooltip title="Share project">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); }}>
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}

        {/* Add New Project Card */}
        <Grid
          size={{
            xs: 12,
            md: 6,
            lg: 4
          }}>
          <Card 
            sx={{ 
              height: '100%', 
              minHeight: 300,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              cursor: 'pointer',
              '&:hover': { 
                borderColor: 'primary.main',
                backgroundColor: 'action.hover'
              }
            }}
            onClick={() => navigate('/ai-learning/new')}
          >
            <Box sx={{ textAlign: 'center' }}>
              <AddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Start New AI Project
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose from templates or create custom
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Create new AI project"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};