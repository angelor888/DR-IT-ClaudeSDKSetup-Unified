import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  LinearProgress,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  EmojiEvents as EmojiEventsIcon,
  LocalFireDepartment as FireIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  WorkspacePremium as BadgeIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

// Mock data for charts
const progressData = [
  { month: 'Jan', projects: 2, timeSaved: 10, skills: 20 },
  { month: 'Feb', projects: 3, timeSaved: 18, skills: 35 },
  { month: 'Mar', projects: 5, timeSaved: 32, skills: 48 },
  { month: 'Apr', projects: 7, timeSaved: 45, skills: 62 },
  { month: 'May', projects: 9, timeSaved: 68, skills: 75 },
  { month: 'Jun', projects: 12, timeSaved: 95, skills: 85 },
];

const skillsData = [
  { skill: 'Prompt Engineering', value: 85, fullMark: 100 },
  { skill: 'Workflow Design', value: 72, fullMark: 100 },
  { skill: 'Tool Integration', value: 68, fullMark: 100 },
  { skill: 'Data Analysis', value: 55, fullMark: 100 },
  { skill: 'Content Creation', value: 78, fullMark: 100 },
  { skill: 'Customer Service', value: 90, fullMark: 100 },
];

const achievements = [
  { id: '1', title: 'First AI Project', description: 'Complete your first AI automation', icon: '🎯', unlocked: true, date: '2025-01-05' },
  { id: '2', title: 'Time Saver', description: 'Save 10 hours with automation', icon: '⏰', unlocked: true, date: '2025-01-15' },
  { id: '3', title: 'Prompt Master', description: 'Create 10 effective prompts', icon: '💡', unlocked: true, date: '2025-01-20' },
  { id: '4', title: 'Team Player', description: 'Share 5 workflows with team', icon: '🤝', unlocked: true, date: '2025-01-25' },
  { id: '5', title: 'Efficiency Expert', description: 'Achieve 80% efficiency on a project', icon: '🚀', unlocked: false },
  { id: '6', title: 'AI Innovator', description: 'Create a custom AI workflow', icon: '🌟', unlocked: false },
];

const recentMilestones = [
  { date: '2025-01-28', event: 'Completed Email Automation project', type: 'project' },
  { date: '2025-01-26', event: 'Shared Customer Response Template', type: 'share' },
  { date: '2025-01-24', event: 'Achieved 85% prompt engineering skill', type: 'skill' },
  { date: '2025-01-22', event: 'Saved 100th hour with automation', type: 'milestone' },
];

export const AIProgress = () => {
  const currentLevel = 3;
  const currentXP = 720;
  const xpForNextLevel = 1000;
  const streak = 15;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          AI Learning Progress
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your growth and celebrate achievements
        </Typography>
      </Box>
      {/* Level and Streak */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid
          size={{
            xs: 12,
            md: 8
          }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', mr: 2 }}>
                  <Typography variant="h5">{currentLevel}</Typography>
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">Level {currentLevel} - AI Practitioner</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentXP} / {xpForNextLevel} XP
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FireIcon sx={{ color: 'orange', mr: 1 }} />
                  <Typography variant="h6">{streak} day streak</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(currentXP / xpForNextLevel) * 100} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 4
          }}>
          <Card sx={{ bgcolor: 'success.50', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEventsIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">Next Achievement</Typography>
              <Typography variant="body2" color="text.secondary">
                5 more projects to unlock "Efficiency Expert"
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Progress Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Growth Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="timeSaved" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Hours Saved"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="projects" 
                    stackId="1"
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    name="Projects"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skills Radar
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Skill Level" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Achievements and Milestones */}
      <Grid container spacing={3}>
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Achievements
              </Typography>
              <Grid container spacing={2}>
                {achievements.map(achievement => (
                  <Grid key={achievement.id} size={6}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        opacity: achievement.unlocked ? 1 : 0.5,
                        filter: achievement.unlocked ? 'none' : 'grayscale(100%)',
                      }}
                    >
                      <Typography variant="h2">{achievement.icon}</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {achievement.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {achievement.description}
                      </Typography>
                      {achievement.unlocked && (
                        <Typography variant="caption" display="block" color="success.main">
                          {achievement.date}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Milestones
              </Typography>
              <List>
                {recentMilestones.map((milestone, index) => (
                  <Box key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {milestone.type === 'project' && <CheckCircleIcon color="primary" />}
                        {milestone.type === 'share' && <StarIcon color="warning" />}
                        {milestone.type === 'skill' && <TrendingUpIcon color="success" />}
                        {milestone.type === 'milestone' && <BadgeIcon color="secondary" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={milestone.event}
                        secondary={milestone.date}
                      />
                    </ListItem>
                    {index < recentMilestones.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Skill Progress */}
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Skill Development
            </Typography>
            {skillsData.map(skill => (
              <Box key={skill.skill} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{skill.skill}</Typography>
                  <Typography variant="body2">{skill.value}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={skill.value} 
                  sx={{ height: 8, borderRadius: 4 }}
                  color={skill.value > 80 ? 'success' : skill.value > 60 ? 'primary' : 'warning'}
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};