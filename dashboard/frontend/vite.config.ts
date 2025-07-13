import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  build: {
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          // Redux
          if (id.includes('node_modules/@reduxjs/') || 
              id.includes('node_modules/react-redux/')) {
            return 'redux-vendor';
          }
          // Material UI
          if (id.includes('node_modules/@mui/material/') ||
              id.includes('node_modules/@mui/icons-material/')) {
            return 'mui-core';
          }
          // Date pickers and data grid
          if (id.includes('node_modules/@mui/x-date-pickers/') ||
              id.includes('node_modules/dayjs/')) {
            return 'date-vendor';
          }
          if (id.includes('node_modules/@mui/x-data-grid/')) {
            return 'data-grid';
          }
          // Forms
          if (id.includes('node_modules/react-hook-form/')) {
            return 'forms';
          }
          // Charts
          if (id.includes('node_modules/recharts/')) {
            return 'charts';
          }
          // Firebase
          if (id.includes('node_modules/firebase/')) {
            return 'firebase';
          }
          // Socket.io
          if (id.includes('node_modules/socket.io-client/')) {
            return 'websocket';
          }
        },
        // Use content hash for better caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize deps
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
      },
    },
  },
})