import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import DoctorBlockedTimeManager from '../components/DoctorBlockedTimeManager'
import { useData } from '../data/DataContext'

function AdminDoctorBlocks() {
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
          Bloqueos de horarios
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Define horarios no disponibles por doctor, ya sea por fecha específica o por día recurrente.
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

      {doctorId && <DoctorBlockedTimeManager doctorId={doctorId} />}
    </Stack>
  )
}

export default AdminDoctorBlocks
