import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppRouter from './app/router'
import { ShopProviders } from './app/providers'
import { ThemeProvider, useTheme } from './app/theme'
import './App.css'

function AppContent() {
  const { theme } = useTheme()

  return (
    <>
      <AppRouter />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2800,
          style: {
            border: `1px solid ${theme === 'dark' ? '#393a35' : '#e7e1d8'}`,
            borderRadius: '2px',
            background: theme === 'dark' ? '#242521' : '#fffdf9',
            color: theme === 'dark' ? '#f0eee8' : '#26261f',
            fontSize: '13px',
          },
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ShopProviders>
          <AppContent />
        </ShopProviders>
      </ThemeProvider>
    </BrowserRouter>
  )
}
