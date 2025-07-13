import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { store } from './store';
import { lightTheme } from './styles/theme';
import AppRouter from './components/AppRouter';
import AuthProvider from './components/AuthProvider';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
