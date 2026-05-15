import { Alert, Box, Stack, Typography } from '@mui/material'
import { useAuth } from '../auth/AuthContext'
import DoctorBlockedTimeManager from '../components/DoctorBlockedTimeManager'
import DoctorScheduleManager from '../components/DoctorScheduleManager'
import { useData } from '../data/DataContext'

function DoctorSchedules() {
  const { doctorId } = useAuth()
  const { doctors } = useData()
  const doctor = doctors.find((item) => item.id === doctorId)

  if (!doctorId) {
    return <Alert severity="warning">No hay doctor seleccionado.</Alert>
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Mi horario
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {doctor ? `Horarios disponibles de ${doctor.name}.` : 'Configura tus horarios disponibles.'}
        </Typography>
      </Box>

      <DoctorScheduleManager doctorId={doctorId} />
      <DoctorBlockedTimeManager doctorId={doctorId} />
    </Stack>
  )
}

export default DoctorSchedules
