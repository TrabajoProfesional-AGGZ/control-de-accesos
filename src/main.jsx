import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App.jsx'
import '@fontsource-variable/archivo'
import './index.css'
import './utils/pwaUpdate' // registra el service worker de la PWA (vite-plugin-pwa) al importar
import { AuthProvider } from './context/AuthContext.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { UpdateToast } from './components/UpdateToast/UpdateToast.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <App />
          <UpdateToast />
        </MotionConfig>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
