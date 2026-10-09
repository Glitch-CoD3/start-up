import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers'

export default function RequireAuth({ children }) {
  const { user, loading, sessionExpired } = useAuth()
  const location = useLocation()

  if (loading) return <div className="detail-loading" aria-label="Loading account"><span /></div>
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, sessionExpired: sessionExpired || location.state?.sessionExpired }}
      />
    )
  }
  return children
}