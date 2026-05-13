import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import DoctorScheduleManager from '../components/DoctorScheduleManager'
import { useData } from '../data/DataContext'

function AdminDoctorSchedules() {
  const { doctors } = useData()
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? '')

  useEffect(() => {
    if (!doctorId && doctors.length > 0) {
      setDoctorId(doctors[0].id)
    }
  }, [doctorId, doctors])

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
        {doctors.map((doctor) => (
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
