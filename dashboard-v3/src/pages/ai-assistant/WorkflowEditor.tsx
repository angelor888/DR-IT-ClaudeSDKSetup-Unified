import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import WorkflowBuilder from '../../components/workflow/WorkflowBuilder';
import { workflowService } from '../../services/workflow/WorkflowService';
import { Workflow } from '../../types/workflow';
import { Node, Edge } from 'reactflow';

const WorkflowEditor: React.FC = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Partial<Workflow>>({
    name: 'New Workflow',
    description: '',
    status: 'draft',
    nodes: [],
    edges: [],
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (workflowId && workflowId !== 'new') {
      loadWorkflow();
    }
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflow(workflowId!);
      if (data) {
        setWorkflow(data);
      } else {
        setError('Workflow not found');
      }
    } catch (err: any) {
      setError('Failed to load workflow');
      console.error('Error loading workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    try {
      setSaving(true);
      const workflowData = {
        ...workflow,
        nodes: nodes as any,
        edges: edges as any,
      };

      if (workflowId && workflowId !== 'new') {
        await workflowService.updateWorkflow(workflowId, workflowData);
      } else {
        const newWorkflow = await workflowService.createWorkflow(workflowData as any);
        navigate(`/ai-assistant/workflows/${newWorkflow.id}/edit`, { replace: true });
      }

      setError(null);
    } catch (err: any) {
      setError('Failed to save workflow');
      console.error('Error saving workflow:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    if (!workflowId || workflowId === 'new') {
      setError('Please save the workflow before running');
      return;
    }

    try {
      setIsRunning(true);
      await workflowService.executeWorkflow(workflowId);
      // You might want to navigate to execution details or show a success message
    } catch (err: any) {
      setError('Failed to run workflow');
      console.error('Error running workflow:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTags = [...(workflow.tags || []), tagInput.trim()];
      setWorkflow({ ...workflow, tags: newTags });
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    const newTags = (workflow.tags || []).filter(tag => tag !== tagToDelete);
    setWorkflow({ ...workflow, tags: newTags });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading workflow...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/ai-assistant/workflows')}>
            <BackIcon />
          </IconButton>
          
          <TextField
            value={workflow.name}
            onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
            variant="standard"
            sx={{ 
              flexGrow: 1,
              '& .MuiInput-root': {
                fontSize: '1.5rem',
                fontWeight: 'bold',
              },
            }}
          />

          <IconButton onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>

          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => handleSave(workflow.nodes as any || [], workflow.edges as any || [])}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>

          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={handleRun}
            disabled={isRunning || workflow.status === 'active'}
          >
            {isRunning ? 'Running...' : 'Run'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1 }}>
        <WorkflowBuilder
          workflowId={workflowId}
          onSave={handleSave}
          onRun={handleRun}
          isRunning={isRunning}
        />
      </Box>

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Workflow Settings</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Workflow Name"
            value={workflow.name}
            onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={workflow.description || ''}
            onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
              {(workflow.tags || []).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                  size="small"
                />
              ))}
            </Stack>
            <TextField
              fullWidth
              size="small"
              placeholder="Add tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleAddTag}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowEditor;