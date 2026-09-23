import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted, not linked from Google Fonts: the label voice, light and regular.
import '@fontsource/encode-sans-expanded/latin-300.css'
import '@fontsource/encode-sans-expanded/latin-400.css'
import './landing.css'
import { LandingPage } from './LandingPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
)
