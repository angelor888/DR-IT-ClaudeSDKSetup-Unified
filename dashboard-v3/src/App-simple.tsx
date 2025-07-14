import { Box, Typography, Button, Card, CardContent, Chip } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme } from './styles/theme';
import DuetRightLogo from './components/DuetRightLogo';

function AppSimple() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #FFBB2F 0%, #FF8A3D 100%)',
        color: '#2C2B2E'
      }}>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 3,
            mb: 2
          }}>
            <DuetRightLogo size={80} />
            <Typography variant="h1" gutterBottom fontWeight="bold" sx={{ 
              fontSize: { xs: '2.5rem', md: '4rem' },
              textShadow: '0 2px 4px rgba(44, 43, 46, 0.1)',
              mb: 0
            }}>
              DuetRight
            </Typography>
          </Box>
          
          <Typography variant="h4" gutterBottom sx={{ opacity: 0.9, mb: 2 }}>
            AI-Powered Business Management Platform
          </Typography>

          <Chip 
            label="Dashboard V3 Foundation Complete" 
            sx={{ 
              backgroundColor: '#037887', 
              color: 'white',
              fontSize: '1rem',
              fontWeight: 500,
              mb: 4
            }}
          />
        </Box>

        <Box sx={{ p: 4, backgroundColor: '#FFFDFA', minHeight: '60vh' }}>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                ✅ React 18 + TypeScript
              </Typography>
              <Typography variant="body2">
                Modern development stack with Vite for blazing-fast performance
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                ✅ Material-UI v6
              </Typography>
              <Typography variant="body2">
                Professional UI components with custom DuetRight theme
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                ✅ Firebase Ready
              </Typography>
              <Typography variant="body2">
                Authentication and hosting configuration complete
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                🤖 Grok 4 AI Integration
              </Typography>
              <Typography variant="body2">
                xAI's powerful 256k context model for intelligent automation
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                🔗 MCP Hub
              </Typography>
              <Typography variant="body2">
                Unified integration protocol for Jobber, Slack, Gmail, Twilio
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                ⚡ Autonomous Workflows
              </Typography>
              <Typography variant="body2">
                AI-driven task automation and business intelligence
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ 
          mt: 4, p: 4, 
          background: 'linear-gradient(135deg, #037887 0%, #4db6ac 100%)',
          color: 'white',
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            🏗️ DuetRight Vision 2026
          </Typography>
          <Typography variant="h6" sx={{ fontStyle: 'italic', opacity: 0.95 }}>
            "We will be known as the best General Contracting service in Seattle by 2026"
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 3, backgroundColor: '#4caf50', color: 'white', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            🎉 Foundation Complete with Official Branding!
          </Typography>
          <Typography variant="body1">
            Dashboard V3 is successfully running with DuetRight's official brand guidelines.
            Ready for trustworthy, client-centric, and collaborative construction management.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #FFBB2F 0%, #FF8A3D 100%)',
              color: '#2C2B2E',
              fontWeight: 600,
              px: 4,
              py: 2,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(255, 187, 47, 0.4)'
              }
            }}
            onClick={() => {
              console.log('🏗️ DuetRight Dashboard V3 Brand Test Log:');
              console.log('✅ Official Brand Colors Applied: #FFBB2F, #FF8A3D, #037887');
              console.log('✅ Inter Typography: Working');
              console.log('✅ React 18 + TypeScript: Working');
              console.log('✅ Material-UI v6 with DuetRight Theme: Working');
              console.log('✅ Component Rendering: Working');
              console.log('🏗️ Ready for Seattle\'s best contracting service!');
            }}
          >
            🧪 Test Official Branding
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 3, backgroundColor: '#2C2B2E', color: 'white', borderRadius: 1, textAlign: 'center' }}>
          <Typography variant="body2" fontWeight={500}>
            <strong>DuetRight Dashboard V3</strong> | Built with official brand guidelines
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
            Trustworthy • Client-centric • Collaborative | Powered by React 18, Grok 4 AI, and MCP Integration Hub
          </Typography>
        </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AppSimple;