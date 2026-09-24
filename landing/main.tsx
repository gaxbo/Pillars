import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted, not linked from Google Fonts: the label voice, light and regular.
import '@fontsource/encode-sans-expanded/latin-300.css'
import '@fontsource/encode-sans-expanded/latin-400.css'
import './landing.css'
import { LandingPage } from './LandingPage'
import { ROADMAP_PATH } from './links'
import { RoadmapPage } from './RoadmapPage'

// Two pages don't need a router. Every path is served index.html (Vite's dev
// server does it, and vercel.json rewrites to it), so the path picks the page.
const path = window.location.pathname.replace(/\/+$/, '')
const Page = path === ROADMAP_PATH ? RoadmapPage : LandingPage

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
