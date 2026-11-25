import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import "./theme.css"
import { DATA_SOURCE } from './config.js'

if (import.meta.env.DEV) console.log(`Data source: ${DATA_SOURCE}`)


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
