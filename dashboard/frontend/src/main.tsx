import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { register } from './utils/registerServiceWorker'

// Register service worker for PWA functionality
register({
  onSuccess: (registration) => {
    console.log('Service worker registered successfully:', registration)
  },
  onUpdate: (registration) => {
    console.log('New content available, please refresh:', registration)
    // You could show a snackbar here to prompt user to refresh
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
