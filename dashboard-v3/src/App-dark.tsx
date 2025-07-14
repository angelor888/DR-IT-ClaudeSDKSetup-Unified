import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography, Button, Card, CardContent, Grid } from '@mui/material';
import DuetRightLogo from './components/DuetRightLogo';

// DuetRight Dark Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFBB2F', // DuetRight Primary Yellow
    },
    secondary: {
      main: '#037887', // DuetRight Accent Teal
    },
    background: {
      default: '#2C2B2E', // DuetRight Darkest
      paper: '#3A3939',
    },
    text: {
      primary: '#FFFDFA', // DuetRight Lightest
      secondary: '#B8B8B8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Arial", sans-serif',
  },
});

function AppDark() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <DuetRightLogo 
            size={80} 
            showText={true}
            sx={{ 
              color: '#FFFDFA',  // White text like in the authentic logo
              filter: 'drop-shadow(0 2px 4px rgba(255, 187, 47, 0.3))' 
            }} 
          />
        </Box>
        
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>
          Dashboard V3 - Dark Theme
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          AI-Powered Business Management Platform
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  ✅ React 18 + Material-UI v6
                </Typography>
                <Typography variant="body2">
                  Stable foundation with dark DuetRight theme applied
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="secondary" gutterBottom>
                  🎨 Dark Brand Theme
                </Typography>
                <Typography variant="body2">
                  Professional dark UI using official DuetRight colors
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  🏗️ Construction Ready
                </Typography>
                <Typography variant="body2">
                  Ready for Seattle's best contracting service
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => {
              console.log('🏗️ DuetRight Dark Theme Test');
              alert('DuetRight Dashboard V3 - Dark theme is working!');
            }}
            sx={{ mr: 2 }}
          >
            Test Dark Theme
          </Button>
          
          <Button 
            variant="outlined" 
            size="large"
            color="secondary"
            onClick={() => console.log('Navigation test')}
          >
            Dashboard Navigation
          </Button>
        </Box>

        <Box sx={{ 
          mt: 4, 
          p: 3, 
          backgroundColor: 'secondary.main', 
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <Typography variant="h6" gutterBottom>
            🏆 DuetRight Vision 2026
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            "We will be known as the best General Contracting service in Seattle by 2026"
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AppDark;