import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  PhoneIphone as PhoneIcon,
  Computer as ComputerIcon
} from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after 30 seconds or on 3rd visit
      const visitCount = parseInt(localStorage.getItem('visitCount') || '0') + 1;
      localStorage.setItem('visitCount', visitCount.toString());
      
      if (visitCount >= 3) {
        setTimeout(() => setShowInstallDialog(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS && !isInstalled) {
      const lastPrompt = localStorage.getItem('lastIOSPrompt');
      const daysSinceLastPrompt = lastPrompt 
        ? (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24)
        : Infinity;
      
      if (daysSinceLastPrompt > 7) {
        setTimeout(() => setShowIOSInstructions(true), 5000);
      }
    }

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallDialog(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallDialog(false);
  };

  const handleIOSClose = () => {
    setShowIOSInstructions(false);
    localStorage.setItem('lastIOSPrompt', Date.now().toString());
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Dialog for Android/Desktop Chrome */}
      <Dialog
        open={showInstallDialog && !!deferredPrompt}
        onClose={() => setShowInstallDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <InstallIcon color="primary" />
            Install DuetRight Dashboard
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Install the DuetRight Dashboard app for quick access from your {isMobile ? 'home screen' : 'desktop'}.
            Get offline support, push notifications, and a native app experience!
          </DialogContentText>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
            {isMobile ? <PhoneIcon fontSize="large" /> : <ComputerIcon fontSize="large" />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstallDialog(false)}>
            Maybe Later
          </Button>
          <Button onClick={handleInstallClick} variant="contained" startIcon={<InstallIcon />}>
            Install App
          </Button>
        </DialogActions>
      </Dialog>

      {/* iOS Instructions */}
      <Dialog
        open={showIOSInstructions}
        onClose={handleIOSClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <span>Install DuetRight Dashboard</span>
            <IconButton onClick={handleIOSClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Box>
              <p>To install DuetRight Dashboard on your iPhone or iPad:</p>
              <ol>
                <li>Tap the <strong>Share</strong> button (square with arrow) in Safari</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> in the top right corner</li>
              </ol>
              <p>You'll then have quick access to the dashboard from your home screen!</p>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleIOSClose} variant="contained">
            Got It
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Install Button (shown after dialog dismissed) */}
      {deferredPrompt && !showInstallDialog && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1000
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<InstallIcon />}
            onClick={() => setShowInstallDialog(true)}
            sx={{
              borderRadius: 8,
              boxShadow: 3
            }}
          >
            Install App
          </Button>
        </Box>
      )}
    </>
  );
};