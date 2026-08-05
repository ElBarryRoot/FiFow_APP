import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './app/App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { queryClient } from './api/queryClient.js'
import { RealtimeProvider } from './realtime/RealtimeContext.jsx'
import { FavoritesProvider } from './lib/favorites.jsx'
import { ToastProvider } from './lib/toast.jsx'
import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RealtimeProvider>
            <ToastProvider>
              <FavoritesProvider>
                <App />
              </FavoritesProvider>
            </ToastProvider>
          </RealtimeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
