import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  AvatarGroup,
  IconButton,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Share as ShareIcon,
  PlayCircleOutline as PlayIcon,
  Article as ArticleIcon,
  VideoLibrary as VideoIcon,
  Lightbulb as LightbulbIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface LearningResource {
  id: string;
  type: 'lesson' | 'best_practice' | 'mistake' | 'insight' | 'video';
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  thumbnail?: string;
  videoUrl?: string;
  helpful: number;
  views: number;
  tags: string[];
  createdAt: string;
  isHelpful?: boolean;
}

const mockResources: LearningResource[] = [
  {
    id: '1',
    type: 'best_practice',
    title: 'How I Reduced Email Response Time by 80%',
    content: 'By implementing a smart categorization system with AI, I was able to automatically route and draft responses for common inquiries. Here\'s the exact workflow I used...',
    author: 'Sarah Chen',
    authorAvatar: 'SC',
    helpful: 45,
    views: 234,
    tags: ['email', 'automation', 'customer-service'],
    createdAt: '2 days ago',
    isHelpful: true,
  },
  {
    id: '2',
    type: 'video',
    title: 'Building Your First Slack Bot Integration',
    content: 'Step-by-step video tutorial on creating a Slack bot that responds to customer inquiries and syncs with Jobber.',
    author: 'Mike Johnson',
    authorAvatar: 'MJ',
    thumbnail: '/api/placeholder/400/225',
    videoUrl: '#',
    helpful: 38,
    views: 189,
    tags: ['slack', 'integration', 'tutorial'],
    createdAt: '5 days ago',
  },
  {
    id: '3',
    type: 'mistake',
    title: 'Don\'t Make This Prompt Engineering Mistake',
    content: 'I learned the hard way that being too specific in prompts can actually limit AI effectiveness. Here\'s what happened and how to avoid it...',
    author: 'Alex Rivera',
    authorAvatar: 'AR',
    helpful: 52,
    views: 312,
    tags: ['prompts', 'mistakes', 'learning'],
    createdAt: '1 week ago',
  },
  {
    id: '4',
    type: 'insight',
    title: 'The Power of Iterative AI Implementation',
    content: 'Start small, measure results, and iterate. My journey from simple email templates to full customer service automation.',
    author: 'Emma Watson',
    authorAvatar: 'EW',
    helpful: 67,
    views: 445,
    tags: ['strategy', 'implementation', 'growth'],
    createdAt: '1 week ago',
  },
];

const topContributors = [
  { name: 'Sarah Chen', avatar: 'SC', contributions: 15, helpful: 234 },
  { name: 'Mike Johnson', avatar: 'MJ', contributions: 12, helpful: 189 },
  { name: 'Emma Watson', avatar: 'EW', contributions: 10, helpful: 156 },
  { name: 'Alex Rivera', avatar: 'AR', contributions: 8, helpful: 123 },
];

export const KnowledgeSharing = () => {
  const [resources] = useState<LearningResource[]>(mockResources);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 0) return matchesSearch; // All
    if (activeTab === 1) return matchesSearch && resource.type === 'best_practice';
    if (activeTab === 2) return matchesSearch && resource.type === 'video';
    if (activeTab === 3) return matchesSearch && resource.type === 'insight';
    return matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'best_practice': return <LightbulbIcon color="primary" />;
      case 'video': return <VideoIcon color="secondary" />;
      case 'mistake': return <TrendingUpIcon color="error" />;
      case 'insight': return <ArticleIcon color="info" />;
      default: return <ArticleIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'best_practice': return 'Best Practice';
      case 'video': return 'Video Tutorial';
      case 'mistake': return 'Lesson Learned';
      case 'insight': return 'Insight';
      default: return type;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Knowledge Sharing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Learn from your team's AI implementation experiences
        </Typography>
      </Box>
      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid
          size={{
            xs: 12,
            md: 8
          }}>
          {/* Search and Filters */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search knowledge base..."
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
              <Tab label="All" />
              <Tab label="Best Practices" />
              <Tab label="Videos" />
              <Tab label="Insights" />
            </Tabs>
          </Box>

          {/* Resource Cards */}
          <Grid container spacing={2}>
            {filteredResources.map(resource => (
              <Grid key={resource.id} size={12}>
                <Card>
                  {resource.type === 'video' && resource.thumbnail && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={resource.thumbnail}
                      alt={resource.title}
                      sx={{ cursor: 'pointer' }}
                    />
                  )}
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {resource.authorAvatar || resource.author[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTypeIcon(resource.type)}
                          <Typography variant="h6">
                            {resource.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          by {resource.author} • {resource.createdAt}
                        </Typography>
                      </Box>
                      <Chip 
                        label={getTypeLabel(resource.type)} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="body1" paragraph>
                      {resource.content}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                      {resource.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size="small">
                          {resource.isHelpful ? <ThumbUpIcon color="primary" /> : <ThumbUpOutlinedIcon />}
                        </IconButton>
                        <Typography variant="body2">
                          {resource.helpful} helpful
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {resource.views} views
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    {resource.type === 'video' && (
                      <Button startIcon={<PlayIcon />}>
                        Watch Video
                      </Button>
                    )}
                    <Button startIcon={<ShareIcon />}>
                      Share
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Add Resource Button */}
          <Box sx={{ mt: 3 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<AddIcon />}
              sx={{ py: 2 }}
            >
              Share Your Learning
            </Button>
          </Box>
        </Grid>

        {/* Sidebar */}
        <Grid
          size={{
            xs: 12,
            md: 4
          }}>
          {/* Top Contributors */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Contributors
              </Typography>
              <List>
                {topContributors.map((contributor, index) => (
                  <Box key={contributor.name}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar>{contributor.avatar}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={contributor.name}
                        secondary={`${contributor.contributions} posts • ${contributor.helpful} helpful votes`}
                      />
                    </ListItem>
                    {index < topContributors.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Popular Tags */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Popular Topics
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['automation', 'email', 'prompts', 'slack', 'customer-service', 'integration', 'workflow', 'ai-tips'].map(tag => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    clickable
                    onClick={() => setSearchTerm(tag)}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Learning Path Suggestion */}
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Suggested Next Step
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Based on your progress, we recommend exploring "Advanced Prompt Engineering Techniques"
              </Typography>
              <Button variant="contained" size="small" fullWidth>
                Start Learning
              </Button>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};