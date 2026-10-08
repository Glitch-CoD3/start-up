import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers'

export default function RequireAdmin({ children }) {
  const { user, profile, loading, error } = useAuth()
  const location = useLocation()

  if (loading) return <div className="detail-loading" aria-label="Checking admin access"><span /></div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (error) {
    return (
      <main className="page-message">
        <h1>Admin access is unavailable.</h1>
        <p role="alert">{error}</p>
        <Link className="button button--dark" to="/">Return to the shop</Link>
      </main>
    )
  }
  if (profile?.user_roles?.role_name !== 'admin') return <Navigate to="/" replace />
  return children
}