import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Schedule as ScheduleIcon,
  Webhook as WebhookIcon,
  Event as EventIcon,
  Extension as ExtensionIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Psychology as PsychologyIcon,
  CompareArrows as CompareArrowsIcon,
  Code as CodeIcon,
  Timer as TimerIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';
import { WorkflowNode, WorkflowEdge, NODE_TEMPLATES } from '../../types/workflow';
import WorkflowNodeComponent from './WorkflowNode';
import NodePropertiesPanel from './NodePropertiesPanel';

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onRun?: () => void;
  isRunning?: boolean;
}

const nodeTypes = {
  trigger: WorkflowNodeComponent,
  action: WorkflowNodeComponent,
  condition: WorkflowNodeComponent,
  delay: WorkflowNodeComponent,
};

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#ff6060' },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#ff6060',
  },
};

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflowId,
  onSave,
  onRun,
  isRunning = false,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showProperties, setShowProperties] = useState(false);
  const [showNodeLibrary, setShowNodeLibrary] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const onInit = (rfi: ReactFlowInstance) => setReactFlowInstance(rfi);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('nodeType');
      const templateData = event.dataTransfer.getData('templateData');

      if (!type) return;

      const template = JSON.parse(templateData);
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type: template.nodeType,
        position,
        data: {
          ...template.defaultData,
          label: template.name,
          icon: template.icon,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowProperties(true);
  }, []);

  const onNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
      setShowProperties(false);
    },
    [setNodes, setEdges]
  );

  const onNodeUpdate = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Schedule: ScheduleIcon,
      Webhook: WebhookIcon,
      Event: EventIcon,
      Extension: ExtensionIcon,
      Email: EmailIcon,
      Sms: SmsIcon,
      Psychology: PsychologyIcon,
      CompareArrows: CompareArrowsIcon,
      Code: CodeIcon,
      Timer: TimerIcon,
    };
    const IconComponent = icons[iconName] || ExtensionIcon;
    return <IconComponent />;
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, template: any) => {
    event.dataTransfer.setData('nodeType', nodeType);
    event.dataTransfer.setData('templateData', JSON.stringify({ ...template, nodeType }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Workflow Builder
          </Typography>
          
          <Tooltip title="Undo">
            <IconButton size="small">
              <UndoIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Redo">
            <IconButton size="small">
              <RedoIcon />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Tooltip title="Toggle Node Library">
            <IconButton size="small" onClick={() => setShowNodeLibrary(!showNodeLibrary)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Button
            startIcon={<SaveIcon />}
            variant="outlined"
            size="small"
            onClick={() => onSave?.(nodes, edges)}
            sx={{ mr: 1 }}
          >
            Save
          </Button>

          <Button
            startIcon={isRunning ? <PauseIcon /> : <PlayIcon />}
            variant="contained"
            size="small"
            color={isRunning ? 'warning' : 'primary'}
            onClick={onRun}
          >
            {isRunning ? 'Pause' : 'Run'}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
        <Drawer
          variant="persistent"
          anchor="left"
          open={showNodeLibrary}
          sx={{
            width: showNodeLibrary ? 280 : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              position: 'relative',
              height: '100%',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Node Library
            </Typography>
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Triggers
            </Typography>
            <List dense>
              {NODE_TEMPLATES.triggers.map((template) => (
                <ListItem
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, 'trigger', template)}
                  sx={{
                    cursor: 'grab',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>{getIconComponent(template.icon)}</ListItemIcon>
                  <ListItemText
                    primary={template.name}
                    secondary={template.description}
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Actions
            </Typography>
            <List dense>
              {NODE_TEMPLATES.actions.map((template) => (
                <ListItem
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, 'action', template)}
                  sx={{
                    cursor: 'grab',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>{getIconComponent(template.icon)}</ListItemIcon>
                  <ListItemText
                    primary={template.name}
                    secondary={template.description}
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Flow Control
            </Typography>
            <List dense>
              {[...NODE_TEMPLATES.conditions, ...NODE_TEMPLATES.utilities].map((template) => (
                <ListItem
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, template.type === 'delay' ? 'delay' : 'condition', template)}
                  sx={{
                    cursor: 'grab',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>{getIconComponent(template.icon)}</ListItemIcon>
                  <ListItemText
                    primary={template.name}
                    secondary={template.description}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        <Box sx={{ flexGrow: 1 }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background variant={'dots' as any} gap={12} size={1} />
            <Controls />
          </ReactFlow>
        </Box>

        <NodePropertiesPanel
          open={showProperties}
          node={selectedNode}
          onClose={() => setShowProperties(false)}
          onUpdate={onNodeUpdate}
          onDelete={() => selectedNode && onNodeDelete(selectedNode.id)}
        />
      </Box>
    </Box>
  );
};

const WorkflowBuilderWrapper: React.FC<WorkflowBuilderProps> = (props) => (
  <ReactFlowProvider>
    <WorkflowBuilder {...props} />
  </ReactFlowProvider>
);

export default WorkflowBuilderWrapper;