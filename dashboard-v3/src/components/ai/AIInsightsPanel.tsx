import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import {
  Psychology as AIIcon,
  Email as EmailIcon,
  Assessment as AnalysisIcon,
  AttachMoney as EstimateIcon,
} from '@mui/icons-material';
import { openAIService } from '../../services/ai/OpenAIService';

interface AIInsightsPanelProps {
  className?: string;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'estimation' | 'email' | 'schedule'>('analysis');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Form states
  const [customerData, setCustomerData] = useState('');
  const [projectData, setProjectData] = useState({
    type: '',
    scope: '',
    location: '',
    timeline: '',
  });
  const [emailData, setEmailData] = useState({
    type: 'quote_follow_up' as const,
    customerName: '',
    tone: 'professional' as const,
  });

  useEffect(() => {
    setIsConfigured(openAIService.isConfigured());
  }, []);

  const handleAnalyzeCustomer = async () => {
    if (!customerData.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = JSON.parse(customerData);
      const analysis = await openAIService.analyzeCustomerData(data);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateEstimate = async () => {
    const { type, scope, location, timeline } = projectData;
    if (!type || !scope || !location || !timeline) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const estimate = await openAIService.generateJobEstimate({
        projectType: type,
        scope,
        location,
        timeline,
      });
      setResult(estimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    const { customerName, type, tone } = emailData;
    if (!customerName) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const email = await openAIService.generateEmail({
        type,
        customerName,
        projectDetails: projectData,
        tone,
      });
      setResult({ email });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analysis':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Customer Data Analysis
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Customer Data (JSON format)"
              value={customerData}
              onChange={(e) => setCustomerData(e.target.value)}
              placeholder={`{
  "name": "John Smith",
  "address": "Seattle, WA",
  "budget": "$50,000",
  "projects": ["deck", "kitchen remodel"],
  "preferences": "email contact, weekday calls"
}`}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<AnalysisIcon />}
              onClick={handleAnalyzeCustomer}
              disabled={isLoading || !customerData.trim()}
              sx={{
                backgroundColor: '#FFBB2F',
                color: '#2C2B2E',
                '&:hover': {
                  backgroundColor: '#FF8A3D',
                },
              }}
            >
              {isLoading ? <CircularProgress size={20} /> : 'Analyze Customer'}
            </Button>
          </Box>
        );

      case 'estimation':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Project Estimation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Project Type"
                  value={projectData.type}
                  onChange={(e) => setProjectData({ ...projectData, type: e.target.value })}
                  placeholder="Kitchen remodel, deck installation, etc."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={projectData.location}
                  onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                  placeholder="Seattle, WA"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Project Scope"
                  value={projectData.scope}
                  onChange={(e) => setProjectData({ ...projectData, scope: e.target.value })}
                  placeholder="Detailed description of work to be done..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Timeline"
                  value={projectData.timeline}
                  onChange={(e) => setProjectData({ ...projectData, timeline: e.target.value })}
                  placeholder="3 weeks, 2 months, etc."
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              startIcon={<EstimateIcon />}
              onClick={handleGenerateEstimate}
              disabled={isLoading || !projectData.type || !projectData.scope}
              sx={{
                mt: 2,
                backgroundColor: '#FFBB2F',
                color: '#2C2B2E',
                '&:hover': {
                  backgroundColor: '#FF8A3D',
                },
              }}
            >
              {isLoading ? <CircularProgress size={20} /> : 'Generate Estimate'}
            </Button>
          </Box>
        );

      case 'email':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Email Generation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  value={emailData.customerName}
                  onChange={(e) => setEmailData({ ...emailData, customerName: e.target.value })}
                  placeholder="John Smith"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Email Type</InputLabel>
                  <Select
                    value={emailData.type}
                    onChange={(e) => setEmailData({ ...emailData, type: e.target.value as any })}
                  >
                    <MenuItem value="quote_follow_up">Quote Follow-up</MenuItem>
                    <MenuItem value="project_update">Project Update</MenuItem>
                    <MenuItem value="completion_notice">Completion Notice</MenuItem>
                    <MenuItem value="payment_reminder">Payment Reminder</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tone</InputLabel>
                  <Select
                    value={emailData.tone}
                    onChange={(e) => setEmailData({ ...emailData, tone: e.target.value as any })}
                  >
                    <MenuItem value="professional">Professional</MenuItem>
                    <MenuItem value="friendly">Friendly</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={handleGenerateEmail}
              disabled={isLoading || !emailData.customerName}
              sx={{
                mt: 2,
                backgroundColor: '#FFBB2F',
                color: '#2C2B2E',
                '&:hover': {
                  backgroundColor: '#FF8A3D',
                },
              }}
            >
              {isLoading ? <CircularProgress size={20} /> : 'Generate Email'}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  const renderResult = () => {
    if (!result) return null;

    if (result.email) {
      return (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generated Email
            </Typography>
            <Box
              sx={{
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
              }}
            >
              {result.email}
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI Analysis Results
          </Typography>
          
          {result.confidence && (
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={`Confidence: ${Math.round(result.confidence * 100)}%`}
                color={result.confidence > 0.8 ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          )}

          <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {result.analysis}
          </Typography>

          {result.suggestions && result.suggestions.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Suggestions:
              </Typography>
              {result.suggestions.map((suggestion: string, index: number) => (
                <Chip
                  key={index}
                  label={suggestion}
                  variant="outlined"
                  size="small"
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Warnings:
              </Typography>
              {result.warnings.map((warning: string, index: number) => (
                <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                  {warning}
                </Alert>
              ))}
            </Box>
          )}

          {(result.estimatedCost || result.estimatedTime) && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {result.estimatedCost && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Estimated Cost:</Typography>
                    <Typography variant="h6" color="primary">
                      ${result.estimatedCost.toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {result.estimatedTime && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Estimated Time:</Typography>
                    <Typography variant="h6" color="primary">
                      {result.estimatedTime} hours
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!isConfigured) {
    return (
      <Card className={className}>
        <CardContent>
          <Alert severity="warning">
            OpenAI integration not configured. Add VITE_OPENAI_API_KEY to enable AI features.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AIIcon sx={{ mr: 1, color: '#FFBB2F' }} />
          <Typography variant="h5" fontWeight="bold">
            AI Insights & Automation
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tab Navigation */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant={activeTab === 'analysis' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setActiveTab('analysis')}
          >
            Customer Analysis
          </Button>
          <Button
            variant={activeTab === 'estimation' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setActiveTab('estimation')}
          >
            Job Estimation
          </Button>
          <Button
            variant={activeTab === 'email' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setActiveTab('email')}
          >
            Email Generation
          </Button>
        </Box>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Results */}
        {renderResult()}
      </CardContent>
    </Card>
  );
};

export default AIInsightsPanel;