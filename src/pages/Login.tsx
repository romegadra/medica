import { Alert, Box, Button, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function Login() {
  const { login, mustChangePassword, role } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    const result = await login(email.trim(), password)
    if (!result.ok) {
      setError(result.error ?? 'Error de autenticación')
    }
    setSubmitting(false)
  }

  useEffect(() => {
    if (!role) return
    if (mustChangePassword) {
      navigate('/change-password', { replace: true })
      return
    }
    navigate(role === 'admin' ? '/admin' : role === 'receptionist' ? '/reception' : '/doctor', {
      replace: true,
    })
  }, [mustChangePassword, navigate, role])

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, maxWidth: 420, width: '100%' }} elevation={2}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Bienvenido
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa tus credenciales para continuar.
            </Typography>
          </Box>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Correo"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextField
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" onClick={handleSubmit} disabled={submitting || !email || !password}>
              Iniciar sesión
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}

export default Login
