import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'

function ChangePassword() {
  const { role, markPasswordChanged } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError(null)
    setSuccess(false)
    if (newPassword !== confirmPassword) {
      setError('La nueva contraseña no coincide.')
      return
    }
    setSubmitting(true)
    try {
      await apiRequest('/auth/change-password', 'POST', {
        currentPassword,
        newPassword,
      })
      markPasswordChanged()
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      navigate(role === 'admin' ? '/admin' : role === 'receptionist' ? '/reception' : '/doctor', {
        replace: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, maxWidth: 520, width: '100%' }} elevation={2}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              Cambiar contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.
            </Typography>
          </Box>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">Contraseña actualizada.</Alert>}
            <TextField
              label="Contraseña actual"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrent((prev) => !prev)}
                      edge="end"
                      aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showCurrent ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Nueva contraseña"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNew((prev) => !prev)}
                      edge="end"
                      aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showNew ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirmar nueva contraseña"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm((prev) => !prev)}
                      edge="end"
                      aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
            >
              Guardar contraseña
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}

export default ChangePassword
