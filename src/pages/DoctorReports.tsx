import {
  Box,
  Button,
  Chip,
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
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  insurance: 'Seguro',
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function startOfWeek(date: Date) {
  const next = new Date(date)
  next.setDate(date.getDate() - date.getDay())
  return next
}

function endOfWeek(date: Date) {
  const next = startOfWeek(date)
  next.setDate(next.getDate() + 6)
  return next
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value))
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining ? `${hours} h ${remaining} min` : `${hours} h`
}

function getDateKey(value: string) {
  return value.slice(0, 10)
}

function DoctorReports() {
  const { doctorId } = useAuth()
  const { doctors, patients, appointments, visits } = useData()
  const today = new Date()
  const [startDate, setStartDate] = useState(toDateInput(startOfMonth(today)))
  const [endDate, setEndDate] = useState(toDateInput(endOfMonth(today)))
  const doctor = doctors.find((item) => item.id === doctorId)

  const rangeStart = useMemo(() => new Date(`${startDate}T00:00:00`), [startDate])
  const rangeEnd = useMemo(() => new Date(`${endDate}T23:59:59`), [endDate])

  const scopedAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const start = new Date(appointment.start)
        return appointment.doctorId === doctorId && start >= rangeStart && start <= rangeEnd
      }),
    [appointments, doctorId, rangeEnd, rangeStart],
  )

  const scopedVisits = useMemo(
    () =>
      visits.filter((visit) => {
        const date = new Date(visit.date)
        return visit.doctorId === doctorId && date >= rangeStart && date <= rangeEnd
      }),
    [doctorId, rangeEnd, rangeStart, visits],
  )

  const scopedPatients = useMemo(
    () => patients.filter((patient) => patient.doctorId === doctorId),
    [doctorId, patients],
  )

  const metrics = useMemo(() => {
    const scheduled = scopedAppointments.filter((appointment) => appointment.status !== 'cancelled')
    const cancelled = scopedAppointments.filter((appointment) => appointment.status === 'cancelled')
    const occupiedMinutes = scheduled.reduce((total, appointment) => {
      return total + Math.max(0, Math.round((new Date(appointment.end).getTime() - new Date(appointment.start).getTime()) / 60000))
    }, 0)
    const newPatients = scopedPatients.filter((patient) => {
      if (!patient.historyDate) return false
      const date = new Date(`${patient.historyDate}T00:00:00`)
      return date >= rangeStart && date <= rangeEnd
    })
    return {
      scheduledCount: scheduled.length,
      cancelledCount: cancelled.length,
      cancellationRate:
        scopedAppointments.length === 0
          ? 0
          : Math.round((cancelled.length / scopedAppointments.length) * 100),
      occupiedMinutes,
      newPatients: newPatients.length,
      visits: scopedVisits.length,
    }
  }, [rangeEnd, rangeStart, scopedAppointments, scopedPatients, scopedVisits.length])

  const appointmentsByDay = useMemo(() => {
    const grouped = new Map<string, { scheduled: number; cancelled: number }>()
    scopedAppointments.forEach((appointment) => {
      const key = getDateKey(appointment.start)
      const current = grouped.get(key) ?? { scheduled: 0, cancelled: 0 }
      if (appointment.status === 'cancelled') {
        current.cancelled += 1
      } else {
        current.scheduled += 1
      }
      grouped.set(key, current)
    })
    return [...grouped.entries()].sort(([first], [second]) => first.localeCompare(second))
  }, [scopedAppointments])

  const paymentCounts = useMemo(() => {
    const grouped = new Map<string, number>()
    scopedAppointments
      .filter((appointment) => appointment.status !== 'cancelled')
      .forEach((appointment) => {
        const key = appointment.paymentType || 'undefined'
        grouped.set(key, (grouped.get(key) ?? 0) + 1)
      })
    return [...grouped.entries()]
  }, [scopedAppointments])

  const cancellationReasons = useMemo(() => {
    const grouped = new Map<string, number>()
    scopedAppointments
      .filter((appointment) => appointment.status === 'cancelled')
      .forEach((appointment) => {
        const key = appointment.cancellationReason || 'Sin motivo'
        grouped.set(key, (grouped.get(key) ?? 0) + 1)
      })
    return [...grouped.entries()]
  }, [scopedAppointments])

  const setCurrentMonth = () => {
    setStartDate(toDateInput(startOfMonth(today)))
    setEndDate(toDateInput(endOfMonth(today)))
  }

  const setPreviousMonth = () => {
    const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    setStartDate(toDateInput(startOfMonth(previous)))
    setEndDate(toDateInput(endOfMonth(previous)))
  }

  const setCurrentWeek = () => {
    setStartDate(toDateInput(startOfWeek(today)))
    setEndDate(toDateInput(endOfWeek(today)))
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Reportes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {doctor ? `Resumen de ${doctor.name}` : 'Resumen de agenda y actividad.'}
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }} elevation={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            label="Inicio"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Fin"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="outlined" onClick={setCurrentWeek}>
            Esta semana
          </Button>
          <Button variant="outlined" onClick={setCurrentMonth}>
            Este mes
          </Button>
          <Button variant="outlined" onClick={setPreviousMonth}>
            Mes anterior
          </Button>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(6, 1fr)' },
          gap: 2,
        }}
      >
        {[
          ['Citas', metrics.scheduledCount],
          ['Canceladas', metrics.cancelledCount],
          ['Cancelación', `${metrics.cancellationRate}%`],
          ['Horas ocupadas', formatHours(metrics.occupiedMinutes)],
          ['Pacientes nuevos', metrics.newPatients],
          ['Consultas', metrics.visits],
        ].map(([label, value]) => (
          <Paper key={label} sx={{ p: 2 }} elevation={2}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Citas por día</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Día</TableCell>
                <TableCell>Agendadas</TableCell>
                <TableCell>Canceladas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointmentsByDay.map(([day, counts]) => (
                <TableRow key={day}>
                  <TableCell>{formatDate(day)}</TableCell>
                  <TableCell>{counts.scheduled}</TableCell>
                  <TableCell>{counts.cancelled}</TableCell>
                </TableRow>
              ))}
              {appointmentsByDay.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>Sin citas en el periodo.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper sx={{ p: 3, flex: 1 }} elevation={2}>
          <Stack spacing={2}>
            <Typography variant="h6">Tipos de pago</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              {paymentCounts.map(([type, count]) => (
                <Chip key={type} label={`${paymentLabels[type] ?? 'Sin definir'}: ${count}`} />
              ))}
              {paymentCounts.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Sin pagos registrados.
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, flex: 1 }} elevation={2}>
          <Stack spacing={2}>
            <Typography variant="h6">Motivos de cancelación</Typography>
            <Stack spacing={1}>
              {cancellationReasons.map(([reason, count]) => (
                <Typography key={reason} variant="body2" color="text.secondary">
                  {reason}: {count}
                </Typography>
              ))}
              {cancellationReasons.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Sin cancelaciones.
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  )
}

export default DoctorReports
