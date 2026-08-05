import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App.jsx'
import { FavoritesProvider } from './lib/favorites.jsx'
import { ToastProvider } from './lib/toast.jsx'
import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
