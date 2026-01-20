import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'

function Login() {
  const { login, loginDoctor, loginReceptionist } = useAuth()
  const { doctors, units, receptionists } = useData()
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? '')
  const [receptionistId, setReceptionistId] = useState(receptionists[0]?.id ?? '')

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
            <Button variant="contained" onClick={() => login('admin')}>
              Continuar como Admin
            </Button>
            <Stack spacing={1}>
              <TextField
                label="Recepcionista"
                select
                value={receptionistId}
                onChange={(event) => setReceptionistId(event.target.value)}
              >
                {receptionists.map((receptionist) => (
                  <MenuItem key={receptionist.id} value={receptionist.id}>
                    {receptionist.name} ({units.find((unit) => unit.id === receptionist.unitId)?.name ?? 'Unidad'})
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                onClick={() => {
                  const receptionist = receptionists.find((item) => item.id === receptionistId)
                  if (receptionist) {
                    loginReceptionist(receptionist.id, receptionist.unitId)
                  }
                }}
                disabled={!receptionistId}
              >
                Continuar como Recepción
              </Button>
            </Stack>
            <Stack spacing={1}>
              <TextField
                label="Doctor"
                select
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                onClick={() => {
                  if (doctorId) {
                    loginDoctor(doctorId)
                  }
                }}
                disabled={!doctorId}
              >
                Continuar como Doctor
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}

export default Login
  useEffect(() => {
    if (!doctorId && doctors.length > 0) {
      setDoctorId(doctors[0].id)
    }
  }, [doctors, doctorId])

  useEffect(() => {
    if (!receptionistId && receptionists.length > 0) {
      setReceptionistId(receptionists[0].id)
    }
  }, [receptionists, receptionistId])
