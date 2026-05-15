import {
  Alert,
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
import { useToast } from './ToastProvider'

const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

type Props = {
  doctorId: string
}

function todayValue() {
  const date = new Date()
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString()
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DoctorBlockedTimeManager({ doctorId }: Props) {
  const { doctorBlockedTimes, addDoctorBlockedTime, removeDoctorBlockedTime } = useData()
  const { showToast } = useToast()
  const [mode, setMode] = useState<'weekly' | 'date'>('weekly')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [date, setDate] = useState(todayValue())
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const blocks = useMemo(
    () =>
      doctorBlockedTimes
        .filter((block) => block.doctorId === doctorId)
        .sort((first, second) => {
          if (first.recurrenceType === 'weekly' || second.recurrenceType === 'weekly') {
            return (first.dayOfWeek ?? 9) - (second.dayOfWeek ?? 9)
          }
          return new Date(first.start).getTime() - new Date(second.start).getTime()
        }),
    [doctorBlockedTimes, doctorId],
  )

  const handleAdd = async () => {
    if (!doctorId) {
      setError('Selecciona un doctor antes de bloquear horarios.')
      return
    }
    if (startTime >= endTime) {
      setError('La hora de inicio debe ser menor a la hora de fin.')
      return
    }

    const result = await addDoctorBlockedTime({
      id: `block-${Date.now()}`,
      doctorId,
      start: toIso(date, startTime),
      end: toIso(date, endTime),
      reason: reason.trim() || undefined,
      recurrenceType: mode,
      dayOfWeek: mode === 'weekly' ? dayOfWeek : undefined,
      startTime: mode === 'weekly' ? startTime : undefined,
      endTime: mode === 'weekly' ? endTime : undefined,
    })

    if (!result.ok) {
      setError(result.reason ?? 'No se pudo bloquear el horario.')
      return
    }

    setReason('')
    setError(null)
    showToast('Horario bloqueado correctamente.')
  }

  const handleRemove = async (id: string) => {
    const result = await removeDoctorBlockedTime(id)
    if (!result.ok) {
      setError(result.reason ?? 'No se pudo desbloquear el horario.')
      return
    }
    setError(null)
    showToast('Horario desbloqueado correctamente.')
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Bloquear horario del doctor</Typography>
          {error && <Alert severity="warning">{error}</Alert>}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Tipo"
              select
              value={mode}
              onChange={(event) => setMode(event.target.value as 'weekly' | 'date')}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="weekly">Día recurrente</MenuItem>
              <MenuItem value="date">Fecha específica</MenuItem>
            </TextField>
            {mode === 'date' ? (
              <TextField
                label="Fecha"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            ) : (
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
            )}
            <TextField
              label="Inicio"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
            <TextField
              label="Fin"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
            <TextField
              label="Motivo"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              sx={{ minWidth: { md: 240 }, flex: 1 }}
            />
            <Button
              variant="contained"
              color="warning"
              onClick={handleAdd}
              disabled={!doctorId || startTime >= endTime}
            >
              Bloquear
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Funciona igual que los horarios disponibles: selecciona el tipo, el día o fecha, el rango y agrégalo a la lista.
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Horarios bloqueados</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Fecha / día</TableCell>
                <TableCell>Inicio</TableCell>
                <TableCell>Fin</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blocks.map((block) => (
                <TableRow key={block.id}>
                  <TableCell>{block.recurrenceType === 'weekly' ? 'Recurrente' : 'Fecha específica'}</TableCell>
                  <TableCell>
                    {block.recurrenceType === 'weekly'
                      ? dayLabels[block.dayOfWeek ?? 0]
                      : formatDate(block.start)}
                  </TableCell>
                  <TableCell>
                    {block.recurrenceType === 'weekly' && block.startTime
                      ? block.startTime
                      : formatTime(block.start)}
                  </TableCell>
                  <TableCell>
                    {block.recurrenceType === 'weekly' && block.endTime ? block.endTime : formatTime(block.end)}
                  </TableCell>
                  <TableCell>{block.reason ?? 'Sin motivo'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleRemove(block.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {blocks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sin horarios bloqueados para este doctor.
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

export default DoctorBlockedTimeManager
