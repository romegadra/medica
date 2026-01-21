import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    const result = await login(email.trim(), password)
    if (!result.ok) {
      setError(result.error ?? 'Error de autenticación')
    }
    setSubmitting(false)
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, maxWidth: 420, width: '100%' }} elevation={2}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Bienvenido
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Elige un rol para continuar. La autenticación es simulada por ahora.
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
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
