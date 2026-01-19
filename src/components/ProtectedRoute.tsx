import { Navigate } from 'react-router-dom'
import { useAuth, type Role } from '../auth/AuthContext'

type Props = {
  allowed: Role[]
  children: React.ReactElement
}

function ProtectedRoute({ allowed, children }: Props) {
  const { role } = useAuth()

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (!allowed.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : '/reception'} replace />
  }

  return children
}

export default ProtectedRoute
