import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import './utils/testHelpers' // Load test helpers for console testing
import AppTest from './App-test.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppTest />
  </StrictMode>,
)
