import { Box, Stack, Typography } from '@mui/material'
import { useAuth } from '../auth/AuthContext'
import DoctorBlockedTimeManager from '../components/DoctorBlockedTimeManager'
import DoctorTabs from '../components/DoctorTabs'

function DoctorBlocks() {
  const { doctorId } = useAuth()

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Horarios bloqueados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bloquea horarios en los que no estás disponible para consulta.
        </Typography>
      </Box>

      <DoctorTabs />

      {doctorId && <DoctorBlockedTimeManager doctorId={doctorId} />}
    </Stack>
  )
}

export default DoctorBlocks
