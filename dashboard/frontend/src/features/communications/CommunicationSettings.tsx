import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  TextField,
  Alert,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  AutoAwesome as AIIcon,
  Notifications as NotificationIcon,
  Schedule as ScheduleIcon,
  Message as MessageIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
} from '@services/api/communicationsApi';
import type { CommunicationPreferences, MessageTemplate } from './types';

interface CommunicationSettingsProps {
  open: boolean;
  onClose: () => void;
}

export const CommunicationSettings: React.FC<CommunicationSettingsProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'templates' | 'hours'>('general');
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', category: 'general' });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // API hooks
  const { data: preferences, isLoading } = useGetPreferencesQuery();
  const [updatePreferences, { isLoading: saving }] = useUpdatePreferencesMutation();
  const { data: templates } = useGetTemplatesQuery({});
  const [createTemplate] = useCreateTemplateMutation();

  // Local state for preferences
  const [localPrefs, setLocalPrefs] = useState<CommunicationPreferences | null>(null);

  React.useEffect(() => {
    if (preferences && !localPrefs) {
      setLocalPrefs(preferences);
    }
  }, [preferences, localPrefs]);

  // Handle preference changes
  const handlePreferenceChange = (path: string[], value: any) => {
    if (!localPrefs) return;

    const newPrefs = { ...localPrefs };
    let current: any = newPrefs;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    setLocalPrefs(newPrefs);
  };

  // Save preferences
  const handleSave = async () => {
    if (!localPrefs) return;

    try {
      await updatePreferences(localPrefs).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  // Create new template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) return;

    try {
      await createTemplate({
        ...newTemplate,
        platform: 'all',
        aiGenerated: false,
      }).unwrap();
      
      setNewTemplate({ name: '', content: '', category: 'general' });
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  if (!localPrefs) {
    return null;
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 500 } },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">Communication Settings</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Tabs */}
          <ToggleButtonGroup
            value={activeTab}
            exclusive
            onChange={(_, newTab) => newTab && setActiveTab(newTab)}
            fullWidth
            sx={{ mt: 2 }}
          >
            <ToggleButton value="general" size="small">
              General
            </ToggleButton>
            <ToggleButton value="ai" size="small">
              AI Features
            </ToggleButton>
            <ToggleButton value="templates" size="small">
              Templates
            </ToggleButton>
            <ToggleButton value="hours" size="small">
              Hours
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Settings saved successfully!
            </Alert>
          )}

          {/* General Settings */}
          {activeTab === 'general' && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Default Platform
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={localPrefs.defaultPlatform}
                    onChange={(e) => handlePreferenceChange(['defaultPlatform'], e.target.value)}
                  >
                    <MenuItem value="slack">Slack</MenuItem>
                    <MenuItem value="twilio">SMS</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Notifications
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localPrefs.notifications.desktop}
                        onChange={(e) => handlePreferenceChange(['notifications', 'desktop'], e.target.checked)}
                      />
                    }
                    label="Desktop Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localPrefs.notifications.mobile}
                        onChange={(e) => handlePreferenceChange(['notifications', 'mobile'], e.target.checked)}
                      />
                    }
                    label="Mobile Push Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localPrefs.notifications.email}
                        onChange={(e) => handlePreferenceChange(['notifications', 'email'], e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localPrefs.notifications.urgentOnly}
                        onChange={(e) => handlePreferenceChange(['notifications', 'urgentOnly'], e.target.checked)}
                      />
                    }
                    label="Urgent Messages Only"
                  />
                </FormGroup>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Auto Response
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localPrefs.autoResponse.enabled}
                        onChange={(e) => handlePreferenceChange(['autoResponse', 'enabled'], e.target.checked)}
                      />
                    }
                    label="Enable Auto Response"
                  />
                  {localPrefs.autoResponse.enabled && (
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localPrefs.autoResponse.useAI}
                            onChange={(e) => handlePreferenceChange(['autoResponse', 'useAI'], e.target.checked)}
                          />
                        }
                        label="Use AI for Auto Responses"
                      />
                      {!localPrefs.autoResponse.useAI && (
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Custom Auto Response"
                          value={localPrefs.autoResponse.customMessage || ''}
                          onChange={(e) => handlePreferenceChange(['autoResponse', 'customMessage'], e.target.value)}
                          sx={{ mt: 2 }}
                        />
                      )}
                    </>
                  )}
                </FormGroup>
              </Box>
            </Stack>
          )}

          {/* AI Settings */}
          {activeTab === 'ai' && (
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <AIIcon color="primary" />
                    <Typography variant="h6">AI Features</Typography>
                  </Stack>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localPrefs.ai.smartCompose}
                          onChange={(e) => handlePreferenceChange(['ai', 'smartCompose'], e.target.checked)}
                        />
                      }
                      label="Smart Compose"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                      Get AI-powered suggestions while typing messages
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={localPrefs.ai.autoSuggest}
                          onChange={(e) => handlePreferenceChange(['ai', 'autoSuggest'], e.target.checked)}
                        />
                      }
                      label="Auto Suggestions"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                      Automatically suggest responses to incoming messages
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={localPrefs.ai.sentimentAnalysis}
                          onChange={(e) => handlePreferenceChange(['ai', 'sentimentAnalysis'], e.target.checked)}
                        />
                      }
                      label="Sentiment Analysis"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                      Analyze message sentiment and urgency levels
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={localPrefs.ai.autoCategorie}
                          onChange={(e) => handlePreferenceChange(['ai', 'autoCategorie'], e.target.checked)}
                        />
                      }
                      label="Auto Categorization"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                      Automatically categorize and tag messages
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={localPrefs.ai.summarization}
                          onChange={(e) => handlePreferenceChange(['ai', 'summarization'], e.target.checked)}
                        />
                      }
                      label="Conversation Summaries"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                      Generate AI summaries of long conversations
                    </Typography>
                  </FormGroup>
                </CardContent>
              </Card>
            </Stack>
          )}

          {/* Templates */}
          {activeTab === 'templates' && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Message Templates
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Create reusable templates for common messages
                </Typography>
              </Box>

              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Template Name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Template Content"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    />
                    <FormControl size="small">
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={newTemplate.category}
                        onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                        label="Category"
                      >
                        <MenuItem value="general">General</MenuItem>
                        <MenuItem value="greeting">Greeting</MenuItem>
                        <MenuItem value="followup">Follow Up</MenuItem>
                        <MenuItem value="appointment">Appointment</MenuItem>
                        <MenuItem value="invoice">Invoice</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleCreateTemplate}
                      disabled={!newTemplate.name || !newTemplate.content}
                    >
                      Add Template
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <List>
                {templates?.map((template: any) => (
                  <ListItem key={template.id}>
                    <ListItemText
                      primary={template.name}
                      secondary={template.content.substring(0, 50) + '...'}
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`Used ${template.usageCount}x`}
                          size="small"
                          variant="outlined"
                        />
                        <IconButton size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Stack>
          )}

          {/* Working Hours */}
          {activeTab === 'hours' && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Working Hours
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Set your availability for auto-responses
                </Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={localPrefs.autoResponse.workingHours.enabled}
                    onChange={(e) => handlePreferenceChange(['autoResponse', 'workingHours', 'enabled'], e.target.checked)}
                  />
                }
                label="Enable Working Hours"
              />

              {localPrefs.autoResponse.workingHours.enabled && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={localPrefs.autoResponse.workingHours.timezone}
                      onChange={(e) => handlePreferenceChange(['autoResponse', 'workingHours', 'timezone'], e.target.value)}
                      label="Timezone"
                    >
                      <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                      <MenuItem value="America/Denver">Mountain Time</MenuItem>
                      <MenuItem value="America/Chicago">Central Time</MenuItem>
                      <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    </Select>
                  </FormControl>

                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Stack spacing={2}>
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => {
                        const schedule = localPrefs.autoResponse.workingHours.schedule.find(s => s.day === day);
                        return (
                          <Stack key={day} direction="row" spacing={2} alignItems="center">
                            <Typography sx={{ width: 100, textTransform: 'capitalize' }}>
                              {day}
                            </Typography>
                            <TextField
                              type="time"
                              size="small"
                              value={schedule?.start || '09:00'}
                              onChange={(e) => {
                                // Handle time change
                              }}
                            />
                            <Typography>to</Typography>
                            <TextField
                              type="time"
                              size="small"
                              value={schedule?.end || '17:00'}
                              onChange={(e) => {
                                // Handle time change
                              }}
                            />
                          </Stack>
                        );
                      })}
                    </Stack>
                  </LocalizationProvider>
                </>
              )}
            </Stack>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};