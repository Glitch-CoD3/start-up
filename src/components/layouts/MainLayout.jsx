import { Outlet } from 'react-router-dom'
import { useAuth, useCatalog } from '../../app/providers'
import Footer from './Footer'
import Navbar from './Navbar'

export default function MainLayout() {
  const { error: authError } = useAuth()
  const { pricingWarning } = useCatalog()

  return (
    <div className="app-shell">
      <Navbar />
      {authError && <div className="notice notice--error" role="alert">{authError}</div>}
      {pricingWarning && <div className="notice notice--warning" role="status">{pricingWarning}</div>}
      <main className="page-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}