import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import '@fullcalendar/react/dist/vdom'
import '@fullcalendar/common/main.css'
import '@fullcalendar/daygrid/main.css'
import '@fullcalendar/timegrid/main.css'
import { Box, Button, Chip, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'
import { Link } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

type CalendarView = 'timeGridWeek' | 'dayGridMonth'

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function DoctorDashboard() {
  const { doctorId } = useAuth()
  const { doctors, doctorSchedules, patients, appointments, constraints, loadPatientsForDoctor } = useData()
  const [view, setView] = useState<CalendarView>('timeGridWeek')
  const calendarRef = useRef<FullCalendar | null>(null)
  const [calendarTitle, setCalendarTitle] = useState('')

  useEffect(() => {
    calendarRef.current?.getApi().changeView(view)
  }, [view])

  useEffect(() => {
    if (doctorId) {
      void loadPatientsForDoctor(doctorId)
    }
  }, [doctorId, loadPatientsForDoctor])

  const doctor = doctors.find((item) => item.id === doctorId)
  const canEditPatients = doctor?.canEditPatients ?? true
  const canManageVisits = doctor?.canManageVisits ?? true
  const doctorPatients = useMemo(
    () => patients.filter((patient) => patient.doctorId === doctorId),
    [patients, doctorId],
  )
  const selectedDoctorSchedules = useMemo(
    () => doctorSchedules.filter((schedule) => schedule.doctorId === doctorId),
    [doctorSchedules, doctorId],
  )
  const businessHours = useMemo(
    () =>
      selectedDoctorSchedules.length > 0
        ? selectedDoctorSchedules.map((schedule) => ({
            daysOfWeek: [schedule.dayOfWeek],
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          }))
        : {
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: `${constraints.startHour.toString().padStart(2, '0')}:00`,
            endTime: `${constraints.endHour.toString().padStart(2, '0')}:00`,
          },
    [constraints.endHour, constraints.startHour, selectedDoctorSchedules],
  )

  const events = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.doctorId === doctorId && appointment.status !== 'cancelled',
        )
        .map((appointment) => ({
          id: appointment.id,
          title: appointment.title,
          start: appointment.start,
          end: appointment.end,
        })),
    [appointments, doctorId],
  )
  const todayAppointments = useMemo(() => {
    const today = new Date()
    return appointments
      .filter(
        (appointment) =>
          appointment.doctorId === doctorId &&
          appointment.status !== 'cancelled' &&
          isSameDay(new Date(appointment.start), today),
      )
      .sort((first, second) => new Date(first.start).getTime() - new Date(second.start).getTime())
  }, [appointments, doctorId])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {doctor ? `Agenda de ${doctor.name}` : 'Agenda del doctor'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {doctor ? 'Consulta tus citas, pacientes y horarios disponibles.' : 'Selecciona un doctor desde el login.'}
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }} elevation={2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, next) => next && setView(next)}
            size="small"
            fullWidth
          >
            <ToggleButton value="timeGridWeek">Semana</ToggleButton>
            <ToggleButton value="dayGridMonth">Mes</ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="body2" color="text.secondary">
            Horario: {constraints.startHour}:00 - {constraints.endHour}:00
          </Typography>
          {canEditPatients && (
            <Button component={Link} to="/doctor/patients" variant="outlined" size="small" fullWidth>
              Registro de pacientes
            </Button>
          )}
          {canManageVisits && (
            <Button component={Link} to="/doctor/visits" variant="outlined" size="small" fullWidth>
              Consultas
            </Button>
          )}
          <Button component={Link} to="/doctor/schedules" variant="outlined" size="small" fullWidth>
            Mi horario
          </Button>
          <Button component={Link} to="/doctor/reports" variant="outlined" size="small" fullWidth>
            Reportes
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, display: { xs: 'block', md: 'none' } }} elevation={2}>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Hoy</Typography>
            <Chip label={`${todayAppointments.length} citas`} size="small" />
          </Stack>
          {todayAppointments.slice(0, 4).map((appointment) => (
            <Stack
              key={appointment.id}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {appointment.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(appointment.start)} - {formatTime(appointment.end)}
                </Typography>
              </Box>
              {appointment.paymentType && <Chip label={appointment.paymentType} size="small" />}
            </Stack>
          ))}
          {todayAppointments.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Sin citas para hoy.
            </Typography>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }} elevation={2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">{calendarTitle}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => calendarRef.current?.getApi().prev()}
              sx={{ flex: { xs: '1 1 45%', md: '0 0 auto' } }}
            >
              Anterior
            </Button>
            <Button
              variant="outlined"
              onClick={() => calendarRef.current?.getApi().today()}
              sx={{ flex: { xs: '1 1 45%', md: '0 0 auto' } }}
            >
              Hoy
            </Button>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => calendarRef.current?.getApi().next()}
              sx={{ flex: { xs: '1 1 100%', md: '0 0 auto' } }}
            >
              Siguiente
            </Button>
          </Stack>
        </Stack>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={esLocale}
          initialView="timeGridWeek"
          headerToolbar={false}
          height={view === 'timeGridWeek' ? 680 : 'auto'}
          editable={false}
          selectable={false}
          events={events}
          datesSet={(info) => setCalendarTitle(info.view.title)}
          slotMinTime={`${constraints.startHour.toString().padStart(2, '0')}:00:00`}
          slotMaxTime={`${constraints.endHour.toString().padStart(2, '0')}:00:00`}
          slotDuration={`00:${constraints.slotMinutes.toString().padStart(2, '0')}:00`}
          businessHours={businessHours}
        />
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Pacientes</Typography>
          {doctorPatients.map((patient) => (
            <Typography key={patient.id} variant="body2" color="text.secondary">
              {patient.name}
              {patient.phone ? ` - ${patient.phone}` : ''}
            </Typography>
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}

export default DoctorDashboard
