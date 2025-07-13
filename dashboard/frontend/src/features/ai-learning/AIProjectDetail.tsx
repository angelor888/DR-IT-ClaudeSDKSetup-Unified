import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

export const AIProjectDetail = () => {
  const { id } = useParams();
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Project Detail
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Project ID: {id}
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Detailed project view coming soon...
      </Typography>
    </Box>
  );
};