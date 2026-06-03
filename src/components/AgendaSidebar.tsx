import { Box, Button, Chip, IconButton, Paper, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import type { Appointment, Patient } from '../data/types'

type Props = {
  appointments: Appointment[]
  patients: Patient[]
  selectedDate: Date
  onDateChange: (date: Date) => void
}

const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  attended: 'Asistió',
  no_show: 'No asistió',
  cancelled: 'Cancelada',
  rescheduled: 'Reagendada',
}
const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'secondary'> = {
  pending: 'warning',
  scheduled: 'default',
  confirmed: 'primary',
  attended: 'success',
  no_show: 'error',
  cancelled: 'default',
  rescheduled: 'secondary',
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfMonthGrid(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const mondayBasedDay = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - mondayBasedDay)
  return start
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatPhone(value?: string | null) {
  if (!value) return 'Sin teléfono'
  const digits = value.replace(/\D/g, '')
  const local =
    digits.length === 12 && digits.startsWith('52')
      ? digits.slice(2)
      : digits.length === 13 && digits.startsWith('521')
        ? digits.slice(3)
        : digits
  if (local.length === 10) {
    return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6, 8)}-${local.slice(8)}`
  }
  return value
}

function AgendaSidebar({ appointments, patients, selectedDate, onDateChange }: Props) {
  const monthName = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(selectedDate)
  const monthLabel = `${monthName} ${selectedDate.getFullYear()}`
  const selectedKey = getDateKey(selectedDate)
  const todayKey = getDateKey(new Date())
  const patientById = new Map(patients.map((patient) => [patient.id, patient]))
  const appointmentsByDate = appointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
    const key = getDateKey(new Date(appointment.start))
    acc[key] = [...(acc[key] ?? []), appointment]
    return acc
  }, {})
  const selectedAppointments = (appointmentsByDate[selectedKey] ?? []).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )
  const gridStart = startOfMonthGrid(selectedDate)
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })

  const moveMonth = (amount: number) => {
    onDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + amount, 1))
  }

  return (
    <Paper sx={{ p: 2, height: 'fit-content' }} elevation={2}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton size="small" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
            {monthLabel}
          </Typography>
          <IconButton size="small" onClick={() => moveMonth(1)} aria-label="Mes siguiente">
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 0.5,
          }}
        >
          {weekDays.map((day, index) => (
            <Typography key={`${day}-${index}`} variant="caption" align="center" color="text.secondary">
              {day}
            </Typography>
          ))}
          {days.map((day) => {
            const key = getDateKey(day)
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth()
            const count = appointmentsByDate[key]?.length ?? 0
            return (
              <Button
                key={key}
                size="small"
                variant={key === selectedKey ? 'contained' : 'text'}
                onClick={() => onDateChange(day)}
                sx={{
                  minWidth: 0,
                  height: 36,
                  p: 0,
                  color: isCurrentMonth ? undefined : 'text.disabled',
                  border: key === todayKey && key !== selectedKey ? 1 : 0,
                  borderColor: 'primary.main',
                  position: 'relative',
                }}
              >
                {day.getDate()}
                {count > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 3,
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      bgcolor: key === selectedKey ? 'common.white' : 'primary.main',
                    }}
                  />
                )}
              </Button>
            )
          })}
        </Box>

        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2">Citas del día</Typography>
            <Chip label={selectedAppointments.length} size="small" />
          </Stack>
          {selectedAppointments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay citas registradas.
            </Typography>
          ) : (
            selectedAppointments.map((appointment) => {
              const patient = patientById.get(appointment.patientId)
              const status = appointment.attended ? 'attended' : appointment.status ?? 'scheduled'
              return (
                <Paper key={appointment.id} sx={{ p: 1.25 }} elevation={0}>
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatTime(appointment.start)} · {appointment.title}
                      </Typography>
                      <Chip
                        label={statusLabels[status] ?? status}
                        size="small"
                        color={statusColors[status] ?? 'default'}
                      />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {formatPhone(patient?.phone)}
                  </Typography>
                  </Stack>
                </Paper>
              )
            })
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

export default AgendaSidebar
