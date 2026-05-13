import {
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useMemo, useState } from 'react'
import { useData } from '../data/DataContext'

export const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

type Props = {
  doctorId: string
}

function DoctorScheduleManager({ doctorId }: Props) {
  const { doctorSchedules, addDoctorSchedule, removeDoctorSchedule } = useData()
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('11:00')

  const schedules = useMemo(
    () =>
      doctorSchedules
        .filter((schedule) => schedule.doctorId === doctorId)
        .sort((first, second) =>
          first.dayOfWeek === second.dayOfWeek
            ? first.startTime.localeCompare(second.startTime)
            : first.dayOfWeek - second.dayOfWeek,
        ),
    [doctorSchedules, doctorId],
  )

  const handleAdd = () => {
    if (!doctorId || startTime >= endTime) return
    addDoctorSchedule({
      id: `schedule-${Date.now()}`,
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
    })
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Agregar horario disponible</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Día"
              select
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(Number(event.target.value))}
              sx={{ minWidth: 180 }}
            >
              {dayLabels.map((label, index) => (
                <MenuItem key={label} value={index}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Inicio"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fin"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={handleAdd} disabled={!doctorId || startTime >= endTime}>
              Agregar
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Si no hay horarios registrados, la agenda usa el horario general de la clínica.
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Horarios actuales</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Día</TableCell>
                <TableCell>Inicio</TableCell>
                <TableCell>Fin</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>{dayLabels[schedule.dayOfWeek]}</TableCell>
                  <TableCell>{schedule.startTime}</TableCell>
                  <TableCell>{schedule.endTime}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => removeDoctorSchedule(schedule.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">
                      Sin horarios específicos.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Stack>
      </Paper>
    </Stack>
  )
}

export default DoctorScheduleManager
