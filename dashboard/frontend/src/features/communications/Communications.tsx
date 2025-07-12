import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Stack,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Tag as SlackIcon,
  Sms as SmsIcon,
  Settings as SettingsIcon,
  AutoAwesome as AIIcon,
  TrendingUp as StatsIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import { UnifiedInbox } from './UnifiedInbox';
import { SlackMessages } from './SlackMessages';
import { TwilioSMS } from './TwilioSMS';
import { MessageComposer } from './MessageComposer';
import { CommunicationStats } from './CommunicationStats';
import { CommunicationSettings } from './CommunicationSettings';
import {
  useGetCommunicationStatsQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} from '@services/api/communicationsApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`communications-tabpanel-${index}`}
      aria-labelledby={`communications-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
};

export const Communications: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // API hooks
  const { data: stats } = useGetCommunicationStatsQuery({});
  const { data: preferences } = useGetPreferencesQuery();
  const [updatePreferences] = useUpdatePreferencesMutation();

  // Calculate unread counts
  const unreadTotal = stats?.totalMessages || 0;
  const unreadSlack = 0; // Calculate from actual data
  const unreadSMS = 0; // Calculate from actual data

  // Handle notifications toggle
  const handleNotificationsToggle = async () => {
    if (preferences) {
      await updatePreferences({
        ...preferences,
        notifications: {
          ...preferences.notifications,
          desktop: !preferences.notifications.desktop,
        },
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h5" component="h1">
              Communications Hub
            </Typography>
            {preferences?.ai.smartCompose && (
              <Chip
                icon={<AIIcon />}
                label="AI Enhanced"
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Stack>

          <Stack direction="row" spacing={1}>
            {/* Quick Stats */}
            <Chip
              label={`${stats?.responseTime.average ? Math.round(stats.responseTime.average / 60) : 0}m avg response`}
              size="small"
              variant="outlined"
            />
            
            {/* Notifications Toggle */}
            <Tooltip title={preferences?.notifications.desktop ? "Disable notifications" : "Enable notifications"}>
              <IconButton onClick={handleNotificationsToggle}>
                {preferences?.notifications.desktop ? (
                  <NotificationsIcon />
                ) : (
                  <NotificationsOffIcon />
                )}
              </IconButton>
            </Tooltip>

            {/* Stats */}
            <Tooltip title="View Statistics">
              <IconButton onClick={() => setStatsOpen(true)}>
                <StatsIcon />
              </IconButton>
            </Tooltip>

            {/* Settings */}
            <Tooltip title="Settings">
              <IconButton onClick={() => setSettingsOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            {/* More Menu */}
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <Badge badgeContent={unreadTotal} color="error">
                <InboxIcon />
              </Badge>
            </IconButton>
          </Stack>
        </Stack>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{ px: 1 }}
        >
          <Tab
            icon={
              <Badge badgeContent={unreadTotal} color="error">
                <InboxIcon />
              </Badge>
            }
            iconPosition="start"
            label="Unified Inbox"
          />
          <Tab
            icon={
              <Badge badgeContent={unreadSlack} color="error">
                <SlackIcon />
              </Badge>
            }
            iconPosition="start"
            label="Slack"
          />
          <Tab
            icon={
              <Badge badgeContent={unreadSMS} color="error">
                <SmsIcon />
              </Badge>
            }
            iconPosition="start"
            label="SMS"
          />
        </Tabs>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={tabValue} index={0}>
          <UnifiedInbox />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <SlackMessages />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <TwilioSMS />
        </TabPanel>
      </Box>

      {/* Quick Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          // Open new message composer
          setMenuAnchor(null);
        }}>
          New Message
        </MenuItem>
        <MenuItem onClick={() => {
          // Mark all as read
          setMenuAnchor(null);
        }}>
          Mark All as Read
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          setStatsOpen(true);
          setMenuAnchor(null);
        }}>
          View Statistics
        </MenuItem>
        <MenuItem onClick={() => {
          setSettingsOpen(true);
          setMenuAnchor(null);
        }}>
          Settings
        </MenuItem>
      </Menu>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Button
          variant="contained"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            borderRadius: '50%',
            width: 56,
            height: 56,
            minWidth: 'unset',
          }}
          onClick={() => {
            // Open message composer
          }}
        >
          <AIIcon />
        </Button>
      )}

      {/* Stats Drawer */}
      {statsOpen && (
        <CommunicationStats
          open={statsOpen}
          onClose={() => setStatsOpen(false)}
        />
      )}

      {/* Settings Drawer */}
      {settingsOpen && (
        <CommunicationSettings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </Box>
  );
};