import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WorkflowList from '../../components/workflow/WorkflowList';
import WorkflowEditor from './WorkflowEditor';

const WorkflowsPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<WorkflowList />} />
      <Route path="new" element={<WorkflowEditor />} />
      <Route path=":workflowId/edit" element={<WorkflowEditor />} />
    </Routes>
  );
};

export default WorkflowsPage;