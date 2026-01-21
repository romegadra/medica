import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type Role } from '../auth/AuthContext'

type Props = {
  allowed: Role[]
  children: React.ReactElement
}

function ProtectedRoute({ allowed, children }: Props) {
  const { role, mustChangePassword } = useAuth()
  const location = useLocation()

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (!allowed.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : role === 'receptionist' ? '/reception' : '/doctor'} replace />
  }

  return children
}

export default ProtectedRoute
