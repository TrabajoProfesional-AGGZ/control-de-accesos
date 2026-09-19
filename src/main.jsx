import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App.jsx'
import '@fontsource-variable/archivo'
import './index.css'
import './utils/pwaUpdate' // registra el service worker de la PWA (vite-plugin-pwa) al importar
import { AuthProvider } from './context/AuthContext.jsx'
import { ClubProvider } from './context/ClubContext.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { UpdateToast } from './components/UpdateToast/UpdateToast.jsx'

// El ClubProvider va por encima del AuthProvider: el club de este dominio existe antes de que
// haya sesión, y es lo que las pantallas pre-login necesitan para saber a qué tenant le hablan.
ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
    <ErrorBoundary>
      <ClubProvider>
        <AuthProvider>
          <MotionConfig reducedMotion="user">
            <App />
            <UpdateToast />
          </MotionConfig>
        </AuthProvider>
      </ClubProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
