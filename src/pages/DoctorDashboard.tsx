import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import '@fullcalendar/react/dist/vdom'
import '@fullcalendar/common/main.css'
import '@fullcalendar/daygrid/main.css'
import '@fullcalendar/timegrid/main.css'
import { Box, Button, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'
import { Link } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

type CalendarView = 'timeGridWeek' | 'dayGridMonth'

function DoctorDashboard() {
  const { doctorId } = useAuth()
  const { doctors, patients, appointments, constraints } = useData()
  const [view, setView] = useState<CalendarView>('timeGridWeek')
  const calendarRef = useRef<FullCalendar | null>(null)
  const [calendarTitle, setCalendarTitle] = useState('')

  useEffect(() => {
    calendarRef.current?.getApi().changeView(view)
  }, [view])

  const doctor = doctors.find((item) => item.id === doctorId)
  const canEditPatients = doctor?.canEditPatients ?? true
  const canManageVisits = doctor?.canManageVisits ?? true
  const doctorPatients = useMemo(
    () => patients.filter((patient) => patient.doctorId === doctorId),
    [patients, doctorId],
  )

  const events = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.doctorId === doctorId)
        .map((appointment) => ({
          id: appointment.id,
          title: appointment.title,
          start: appointment.start,
          end: appointment.end,
        })),
    [appointments, doctorId],
  )

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Vista del doctor
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {doctor ? `Agenda de ${doctor.name}.` : 'Selecciona un doctor desde el login.'}
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }} elevation={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, next) => next && setView(next)}
            size="small"
          >
            <ToggleButton value="timeGridWeek">Semana</ToggleButton>
            <ToggleButton value="dayGridMonth">Mes</ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="body2" color="text.secondary">
            Horario: {constraints.startHour}:00 - {constraints.endHour}:00
          </Typography>
          {canEditPatients && (
            <Button component={Link} to="/doctor/patients" variant="outlined" size="small">
              Registro de pacientes
            </Button>
          )}
          {canManageVisits && (
            <Button component={Link} to="/doctor/visits" variant="outlined" size="small">
              Consultas
            </Button>
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
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => calendarRef.current?.getApi().prev()}
            >
              Anterior
            </Button>
            <Button variant="outlined" onClick={() => calendarRef.current?.getApi().today()}>
              Hoy
            </Button>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => calendarRef.current?.getApi().next()}
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
          height="auto"
          editable={false}
          selectable={false}
          events={events}
          datesSet={(info) => setCalendarTitle(info.view.title)}
          slotMinTime={`${constraints.startHour.toString().padStart(2, '0')}:00:00`}
          slotMaxTime={`${constraints.endHour.toString().padStart(2, '0')}:00:00`}
          slotDuration={`00:${constraints.slotMinutes.toString().padStart(2, '0')}:00`}
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
