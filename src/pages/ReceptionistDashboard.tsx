import '@fullcalendar/react/dist/vdom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import '@fullcalendar/common/main.css'
import '@fullcalendar/daygrid/main.css'
import '@fullcalendar/timegrid/main.css'
import {
  Alert,
  Box,
  Button,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  Typography,
} from '@mui/material'
import { Link } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useData } from '../data/DataContext'
import { useAuth } from '../auth/AuthContext'
import type { Appointment } from '../data/types'

type CalendarView = 'timeGridWeek' | 'dayGridMonth'
type DialogMode = 'create' | 'edit'

function addMinutes(iso: string, minutes: number) {
  const next = new Date(iso)
  next.setMinutes(next.getMinutes() + minutes)
  return next.toISOString()
}

function diffMinutes(startIso: string, endIso: string) {
  return Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000))
}

function ReceptionistDashboard() {
  const { doctors, patients, appointments, constraints, addAppointment, updateAppointment, addPatient } =
    useData()
  const { unitId } = useAuth()
  const unitDoctors = useMemo(
    () => (unitId ? doctors.filter((doctor) => doctor.unitId === unitId) : doctors),
    [doctors, unitId],
  )
  const [doctorId, setDoctorId] = useState(unitDoctors[0]?.id ?? '')
  const [view, setView] = useState<CalendarView>('timeGridWeek')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [patientFilterId, setPatientFilterId] = useState('all')
  const [patientFilterText, setPatientFilterText] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(constraints.slotMinutes)
  const [appointmentStart, setAppointmentStart] = useState('')
  const [mode, setMode] = useState<DialogMode>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingPatient, setAddingPatient] = useState(false)
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientPhone, setNewPatientPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [calendarTitle, setCalendarTitle] = useState('')
  const calendarRef = useRef<FullCalendar | null>(null)

  useEffect(() => {
    calendarRef.current?.getApi().changeView(view)
  }, [view])

  useEffect(() => {
    setDoctorId(unitDoctors[0]?.id ?? '')
  }, [unitDoctors])

  useEffect(() => {
    setPatientFilterId('all')
    setPatientFilterText('')
  }, [doctorId])

  const doctorPatients = useMemo(
    () => patients.filter((patient) => patient.doctorId === doctorId),
    [patients, doctorId],
  )

  const events = useMemo(() => {
    const filtered = appointments.filter((appointment) => appointment.doctorId === doctorId)
    const byPatientId =
      patientFilterId === 'all'
        ? filtered
        : filtered.filter((appointment) => appointment.patientId === patientFilterId)
    const normalized = patientFilterText.trim().toLowerCase()
    const scoped =
      normalized.length === 0
        ? byPatientId
        : byPatientId.filter((appointment) => {
            const patientName = doctorPatients.find((patient) => patient.id === appointment.patientId)
              ?.name
            return patientName ? patientName.toLowerCase().includes(normalized) : false
          })
    return scoped.map((appointment) => ({
      id: appointment.id,
      title: appointment.title,
      start: appointment.start,
      end: appointment.end,
    }))
  }, [appointments, doctorId, patientFilterId, patientFilterText, doctorPatients])

  const handleSelect = (info: { startStr: string; endStr: string }) => {
    if (!doctorId) {
      setError('Selecciona un doctor antes de crear citas.')
      return
    }

    const nextPatient = doctorPatients[0]?.id ?? ''
    setPatientId(nextPatient)
    setAddingPatient(false)
    setNewPatientName('')
    setNewPatientPhone('')
    setAppointmentStart(info.startStr)
    setDurationMinutes(diffMinutes(info.startStr, info.endStr) || constraints.slotMinutes)
    setMode('create')
    setEditingId(null)
    setError(null)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!appointmentStart || (!addingPatient && !patientId)) {
      setError('Selecciona un paciente para esta cita.')
      return
    }

    let finalPatientId = patientId
    let finalPatientName: string | null = null
    if (addingPatient) {
      if (!newPatientName.trim()) {
        setError('Ingresa un nombre para el nuevo paciente.')
        return
      }
      finalPatientId = `pat-${Date.now()}`
      finalPatientName = newPatientName.trim()
      addPatient({
        id: finalPatientId,
        doctorId,
        name: finalPatientName,
        phone: newPatientPhone.trim() || undefined,
      })
    }

    const patientName =
      finalPatientName ?? doctorPatients.find((item) => item.id === finalPatientId)?.name
    if (!patientName) {
      setError('Paciente no encontrado para este doctor.')
      return
    }

    const end = addMinutes(appointmentStart, durationMinutes)
    const appointment: Appointment = {
      id: mode === 'edit' && editingId ? editingId : `apt-${Date.now()}`,
      doctorId,
      patientId: finalPatientId,
      title: patientName,
      start: appointmentStart,
      end,
    }

    const result =
      mode === 'edit'
        ? await updateAppointment(appointment)
        : await addAppointment(appointment)
    if (!result.ok) {
      setError(result.reason ?? 'No se pudo guardar la cita.')
      return
    }

    setDialogOpen(false)
    setError(null)
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Agenda de recepción
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Selecciona un doctor, luego agrega o mueve citas. Hay vista semanal y mensual.
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }} elevation={2}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Doctor"
              select
              value={doctorId}
              onChange={(event) => setDoctorId(event.target.value)}
              sx={{ minWidth: 220 }}
            >
            {unitDoctors.map((doctor) => (
              <MenuItem key={doctor.id} value={doctor.id}>
                {doctor.name}
              </MenuItem>
            ))}
            </TextField>
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
            <Button component={Link} to="/reception/patients" variant="outlined" size="small">
              Agregar pacientes
            </Button>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Filtrar por paciente"
              select
              value={patientFilterId}
              onChange={(event) => setPatientFilterId(event.target.value)}
              sx={{ minWidth: 240 }}
            >
              <MenuItem value="all">Todos los pacientes</MenuItem>
              {doctorPatients
                .filter((patient) =>
                  patient.name.toLowerCase().includes(patientFilterText.trim().toLowerCase()),
                )
                .map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label="Buscar paciente"
              value={patientFilterText}
              onChange={(event) => setPatientFilterText(event.target.value)}
              sx={{ minWidth: 240, flex: 1 }}
            />
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="warning">{error}</Alert>}

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
          selectable
          editable
          events={events}
          datesSet={(info) => setCalendarTitle(info.view.title)}
          select={handleSelect}
          dateClick={(info) => {
            if (view === 'dayGridMonth') {
              calendarRef.current?.getApi().changeView('timeGridWeek', info.date)
              setView('timeGridWeek')
            }
          }}
          eventDrop={async (info) => {
            const appointment = appointments.find((item) => item.id === info.event.id)
            if (!appointment) return
            const result = await updateAppointment({
              ...appointment,
              start: info.event.start?.toISOString() ?? appointment.start,
              end: info.event.end?.toISOString() ?? appointment.end,
            })
            if (!result.ok) {
              setError(result.reason ?? 'No se pudo mover la cita.')
              info.revert()
            }
          }}
          eventResize={async (info) => {
            const appointment = appointments.find((item) => item.id === info.event.id)
            if (!appointment) return
            const result = await updateAppointment({
              ...appointment,
              start: info.event.start?.toISOString() ?? appointment.start,
              end: info.event.end?.toISOString() ?? appointment.end,
            })
            if (!result.ok) {
              setError(result.reason ?? 'No se pudo ajustar la cita.')
              info.revert()
            }
          }}
          eventClick={(info) => {
            const appointment = appointments.find((item) => item.id === info.event.id)
            if (!appointment) return
            setPatientId(appointment.patientId)
            setAppointmentStart(appointment.start)
            setDurationMinutes(diffMinutes(appointment.start, appointment.end) || constraints.slotMinutes)
            setAddingPatient(false)
            setNewPatientName('')
            setNewPatientPhone('')
            setMode('edit')
            setEditingId(appointment.id)
            setError(null)
            setDialogOpen(true)
          }}
          slotMinTime={`${constraints.startHour.toString().padStart(2, '0')}:00:00`}
          slotMaxTime={`${constraints.endHour.toString().padStart(2, '0')}:00:00`}
          slotDuration={`00:${constraints.slotMinutes.toString().padStart(2, '0')}:00`}
          businessHours={{
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: `${constraints.startHour.toString().padStart(2, '0')}:00`,
            endTime: `${constraints.endHour.toString().padStart(2, '0')}:00`,
          }}
          selectConstraint="businessHours"
          eventOverlap={constraints.allowOverlap}
          selectOverlap={constraints.allowOverlap}
        />
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingId(null)
          setAddingPatient(false)
          setNewPatientName('')
          setNewPatientPhone('')
          setError(null)
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{mode === 'edit' ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {doctorPatients.length === 0 ? (
              <Alert severity="info">No hay pacientes asignados a este doctor.</Alert>
            ) : (
              <TextField
                label="Paciente"
                select
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                disabled={addingPatient}
              >
                {doctorPatients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {mode === 'create' && (
              <>
                <Divider />
                <FormControlLabel
                  control={
                    <Switch
                      checked={addingPatient}
                      onChange={(event) => setAddingPatient(event.target.checked)}
                    />
                  }
                  label="Agregar nuevo paciente"
                />
                {addingPatient && (
                  <Stack spacing={2}>
                    <TextField
                      label="Nombre del nuevo paciente"
                      value={newPatientName}
                      onChange={(event) => setNewPatientName(event.target.value)}
                    />
                    <TextField
                      label="Teléfono"
                      value={newPatientPhone}
                      onChange={(event) => setNewPatientPhone(event.target.value)}
                    />
                  </Stack>
                )}
              </>
            )}
            <TextField label="Inicio" value={appointmentStart} disabled />
            <TextField
              label="Duración (minutos)"
              type="number"
              inputProps={{ min: 10, step: 5 }}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
            />
            <TextField
              label="Fin"
              value={appointmentStart ? addMinutes(appointmentStart, durationMinutes) : ''}
              disabled
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!patientId}>
            {mode === 'edit' ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default ReceptionistDashboard
