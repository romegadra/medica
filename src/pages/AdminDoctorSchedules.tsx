import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import DoctorScheduleManager from '../components/DoctorScheduleManager'
import { useData } from '../data/DataContext'

function AdminDoctorSchedules() {
  const { doctors } = useData()
  const { role, unitId } = useAuth()
  const visibleDoctors = useMemo(
    () =>
      role === 'admin' && unitId ? doctors.filter((doctor) => doctor.unitId === unitId) : doctors,
    [doctors, role, unitId],
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
          Horarios de doctores
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Define los rangos en los que cada doctor puede recibir citas.
        </Typography>
      </Box>

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

      {doctorId && <DoctorScheduleManager doctorId={doctorId} />}
    </Stack>
  )
}

export default AdminDoctorSchedules
