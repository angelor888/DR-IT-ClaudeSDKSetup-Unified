import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Button,
  Rating,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  ContentCopy as ContentCopyIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface PromptItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  rating: number;
  usageCount: number;
  tags: string[];
  isFavorite?: boolean;
}

const mockPrompts: PromptItem[] = [
  {
    id: '1',
    title: 'Professional Email Response',
    description: 'Generate professional responses to customer inquiries',
    prompt: 'You are a helpful customer service representative for DuetRight. Please respond to the following customer inquiry in a professional, friendly manner:\n\n[CUSTOMER MESSAGE]\n\nProvide a response that:\n1. Acknowledges their concern\n2. Provides helpful information\n3. Offers next steps\n4. Maintains a positive tone',
    category: 'email',
    rating: 4.8,
    usageCount: 234,
    tags: ['customer-service', 'email', 'professional'],
    isFavorite: true,
  },
  {
    id: '2',
    title: 'Job Description Generator',
    description: 'Create detailed job descriptions from basic requirements',
    prompt: 'Create a comprehensive job description for the following position:\n\nJob Title: [TITLE]\nDepartment: [DEPARTMENT]\nKey Requirements: [REQUIREMENTS]\n\nInclude:\n- Job summary\n- Key responsibilities\n- Required qualifications\n- Preferred qualifications\n- Company culture fit',
    category: 'content',
    rating: 4.5,
    usageCount: 156,
    tags: ['hiring', 'content', 'job-description'],
  },
  {
    id: '3',
    title: 'Customer Sentiment Analyzer',
    description: 'Analyze customer message sentiment and suggest appropriate response tone',
    prompt: 'Analyze the sentiment of the following customer message and provide:\n1. Overall sentiment (positive/neutral/negative)\n2. Key emotions detected\n3. Urgency level (1-5)\n4. Recommended response approach\n\nCustomer Message: [MESSAGE]',
    category: 'analysis',
    rating: 4.7,
    usageCount: 189,
    tags: ['sentiment', 'analysis', 'customer-service'],
  },
];

const categories = [
  { id: 'all', label: 'All Prompts' },
  { id: 'email', label: 'Email' },
  { id: 'content', label: 'Content Creation' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'customer_service', label: 'Customer Service' },
];

export const PromptLibrary = () => {
  const [prompts] = useState<PromptItem[]>(mockPrompts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyPrompt = (prompt: PromptItem) => {
    navigator.clipboard.writeText(prompt.prompt);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Prompt Library
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Save and share effective prompts with your team
        </Typography>
      </Box>
      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid
            size={{
              xs: 12,
              md: 8
            }}>
            <TextField
              fullWidth
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 4
            }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ height: '56px' }}
            >
              Create New Prompt
            </Button>
          </Grid>
        </Grid>
        
        <Tabs 
          value={selectedCategory} 
          onChange={(_, value) => setSelectedCategory(value)}
          sx={{ mt: 2 }}
        >
          {categories.map(cat => (
            <Tab key={cat.id} label={cat.label} value={cat.id} />
          ))}
        </Tabs>
      </Box>
      {/* Prompt Cards */}
      <Grid container spacing={3}>
        {filteredPrompts.map(prompt => (
          <Grid
            key={prompt.id}
            size={{
              xs: 12,
              md: 6
            }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6">
                    {prompt.title}
                  </Typography>
                  <IconButton size="small">
                    {prompt.isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {prompt.description}
                </Typography>

                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1, 
                  mb: 2,
                  maxHeight: 150,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {prompt.prompt}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating value={prompt.rating} precision={0.1} size="small" readOnly />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({prompt.rating})
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Used {prompt.usageCount} times
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                  {prompt.tags.map(tag => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopyPrompt(prompt)}
                  color={copiedId === prompt.id ? 'success' : 'primary'}
                >
                  {copiedId === prompt.id ? 'Copied!' : 'Copy Prompt'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};