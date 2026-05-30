import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import DoctorBlockedTimeManager from '../components/DoctorBlockedTimeManager'
import ReceptionistTabs from '../components/ReceptionistTabs'
import { useData } from '../data/DataContext'

function ReceptionistDoctorBlocks() {
  const { doctors } = useData()
  const { unitId } = useAuth()
  const visibleDoctors = useMemo(
    () => (unitId ? doctors.filter((doctor) => doctor.unitId === unitId) : doctors),
    [doctors, unitId],
  )
  const [doctorId, setDoctorId] = useState(visibleDoctors[0]?.id ?? '')

  useEffect(() => {
    if (!doctorId && visibleDoctors.length > 0) {
      setDoctorId(visibleDoctors[0].id)
    }
  }, [doctorId, visibleDoctors])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Bloqueos de horarios
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bloquea horarios no disponibles para los doctores de tu unidad.
        </Typography>
      </Box>

      <ReceptionistTabs />

      <TextField
        label="Doctor"
        select
        value={doctorId}
        onChange={(event) => setDoctorId(event.target.value)}
        sx={{ maxWidth: 360 }}
      >
        {visibleDoctors.map((doctor) => (
          <MenuItem key={doctor.id} value={doctor.id}>
            {doctor.name}
          </MenuItem>
        ))}
      </TextField>

      {doctorId && <DoctorBlockedTimeManager doctorId={doctorId} />}
    </Stack>
  )
}

export default ReceptionistDoctorBlocks
