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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'
import type { Appointment, DoctorBlockedTime } from '../data/types'
import DoctorTabs from '../components/DoctorTabs'
import AgendaSidebar from '../components/AgendaSidebar'

type CalendarView = 'timeGridWeek' | 'dayGridMonth'
type DialogMode = 'create' | 'edit'
type AppointmentStatus = NonNullable<Appointment['status']>

const appointmentStatuses: { value: AppointmentStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'scheduled', label: 'Agendada' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'attended', label: 'Asistió' },
  { value: 'no_show', label: 'No asistió' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'rescheduled', label: 'Reagendada' },
]

const paymentTypes = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'insurance', label: 'Seguro' },
]

function getAppointmentStatus(appointment: Appointment): AppointmentStatus {
  return appointment.attended ? 'attended' : appointment.status ?? 'scheduled'
}

function getAppointmentColor(appointment: Appointment) {
  const status = getAppointmentStatus(appointment)
  if (status === 'attended') return '#2e7d32'
  if (status === 'confirmed') return '#1976d2'
  if (status === 'pending') return '#8d6e63'
  if (status === 'cancelled') return '#9e9e9e'
  if (status === 'rescheduled') return '#6a1b9a'
  if (status === 'no_show' || new Date(appointment.end) < new Date()) return '#c65f2f'
  return undefined
}

function addMinutes(iso: string, minutes: number) {
  const next = new Date(iso)
  next.setMinutes(next.getMinutes() + minutes)
  return next.toISOString()
}

function diffMinutes(startIso: string, endIso: string) {
  return Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000))
}

function toDateTimeLocalValue(iso: string) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function fromDateTimeLocalValue(value: string) {
  if (!value) return ''
  return new Date(value).toISOString()
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function isWithinSchedule(
  start: Date,
  end: Date,
  schedules: { dayOfWeek: number; startTime: string; endTime: string }[],
) {
  if (schedules.length === 0) return true
  if (start.getDay() !== end.getDay()) return false
  const startMinutes = start.getHours() * 60 + start.getMinutes()
  const endMinutes = end.getHours() * 60 + end.getMinutes()
  return schedules.some(
    (schedule) =>
      schedule.dayOfWeek === start.getDay() &&
      startMinutes >= timeToMinutes(schedule.startTime) &&
      endMinutes <= timeToMinutes(schedule.endTime),
  )
}

function overlapsBlockedTime(start: Date, end: Date, block: DoctorBlockedTime) {
  if (block.recurrenceType === 'weekly') {
    if (block.dayOfWeek === undefined || !block.startTime || !block.endTime) return false
    if (start.getDay() !== block.dayOfWeek || end.getDay() !== block.dayOfWeek) return false
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    return startMinutes < timeToMinutes(block.endTime) && timeToMinutes(block.startTime) < endMinutes
  }

  return start < new Date(block.end) && new Date(block.start) < end
}

function DoctorDashboard() {
  const { doctorId } = useAuth()
  const {
    doctors,
    doctorSchedules,
    doctorBlockedTimes,
    patients,
    appointments,
    constraints,
    addAppointment,
    updateAppointment,
    addPatient,
  } = useData()
  const [view, setView] = useState<CalendarView>('timeGridWeek')
  const calendarRef = useRef<FullCalendar | null>(null)
  const [calendarTitle, setCalendarTitle] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<DialogMode>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [patientId, setPatientId] = useState('')
  const [addingPatient, setAddingPatient] = useState(false)
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientPhone, setNewPatientPhone] = useState('')
  const [appointmentStart, setAppointmentStart] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(constraints.slotMinutes)
  const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatus>('scheduled')
  const [paymentType, setPaymentType] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(new Date())

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
  const selectedPatient = useMemo(
    () => doctorPatients.find((patient) => patient.id === patientId),
    [doctorPatients, patientId],
  )
  const selectedDoctorSchedules = useMemo(
    () => doctorSchedules.filter((schedule) => schedule.doctorId === doctorId),
    [doctorSchedules, doctorId],
  )
  const selectedDoctorBlocks = useMemo(
    () => doctorBlockedTimes.filter((block) => block.doctorId === doctorId),
    [doctorBlockedTimes, doctorId],
  )
  const isBlocked = useCallback(
    (start: Date, end: Date) => selectedDoctorBlocks.some((block) => overlapsBlockedTime(start, end, block)),
    [selectedDoctorBlocks],
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
  const activeAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.doctorId === doctorId && appointment.status !== 'cancelled'),
    [appointments, doctorId],
  )

  const handleAgendaDateChange = (date: Date) => {
    setSelectedAgendaDate(date)
    calendarRef.current?.getApi().gotoDate(date)
  }

  const events = useMemo(() => {
    const appointmentEvents = activeAppointments
      .map((appointment) => {
        const patient = doctorPatients.find((item) => item.id === appointment.patientId)
        const color = getAppointmentColor(appointment)
        return {
          id: appointment.id,
          title: patient?.phone ? `${appointment.title} · ${patient.phone}` : appointment.title,
          start: appointment.start,
          end: appointment.end,
          extendedProps: {
            patientName: appointment.title,
            patientPhone: patient?.phone ?? '',
          },
          backgroundColor: color,
          borderColor: color,
          textColor: color ? '#fff' : undefined,
        }
      })
    const blockedEvents = selectedDoctorBlocks.map((block) => {
      const title = block.reason ? `Bloqueado: ${block.reason}` : 'Bloqueado'
      if (block.recurrenceType === 'weekly') {
        return {
          id: `blocked-${block.id}`,
          title,
          daysOfWeek: block.dayOfWeek === undefined ? [] : [block.dayOfWeek],
          startTime: block.startTime,
          endTime: block.endTime,
          display: 'background',
          color: '#ef9a9a',
        }
      }

      return {
        id: `blocked-${block.id}`,
        title,
        start: block.start,
        end: block.end,
        display: 'background',
        color: '#ef9a9a',
      }
    })
    return [...appointmentEvents, ...blockedEvents]
  }, [activeAppointments, doctorPatients, selectedDoctorBlocks])

  const resetDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setAddingPatient(false)
    setNewPatientName('')
    setNewPatientPhone('')
    setAppointmentStatus('scheduled')
    setPaymentType('')
    setNotes('')
    setError(null)
  }

  const openAppointmentDialog = (startIso: string, endIso?: string) => {
    if (!doctorId || !canManageVisits) return
    const end = endIso ?? addMinutes(startIso, constraints.slotMinutes)
    const startDate = new Date(startIso)
    const endDate = new Date(end)
    if (!isWithinSchedule(startDate, endDate, selectedDoctorSchedules)) {
      setError('La cita está fuera de tu horario disponible.')
      return
    }
    if (isBlocked(startDate, endDate)) {
      setError('La cita se cruza con un horario bloqueado.')
      return
    }

    setPatientId(doctorPatients[0]?.id ?? '')
    setAddingPatient(false)
    setNewPatientName('')
    setNewPatientPhone('')
    setAppointmentStatus('scheduled')
    setPaymentType('')
    setNotes('')
    setAppointmentStart(startIso)
    setDurationMinutes(diffMinutes(startIso, end) || constraints.slotMinutes)
    setMode('create')
    setEditingId(null)
    setError(null)
    setDialogOpen(true)
  }

  const handleSelect = (info: { startStr: string; endStr: string }) => {
    openAppointmentDialog(info.startStr, info.endStr)
  }

  const handleSave = async () => {
    if (!doctorId || !canManageVisits) {
      setError('No tienes permiso para administrar citas.')
      return
    }
    if (!appointmentStart || (!addingPatient && !patientId)) {
      setError('Selecciona un paciente para esta cita.')
      return
    }

    let finalPatientId = patientId
    let finalPatientName: string | null = null
    if (addingPatient) {
      if (!canEditPatients) {
        setError('No tienes permiso para agregar pacientes.')
        return
      }
      if (!newPatientName.trim()) {
        setError('Ingresa un nombre para el nuevo paciente.')
        return
      }
      const createdPatient = await addPatient({
        id: `pat-${Date.now()}`,
        doctorId,
        name: newPatientName.trim(),
        phone: newPatientPhone.trim() || undefined,
      })
      finalPatientId = createdPatient.id
      finalPatientName = createdPatient.name
    }

    const patientName =
      finalPatientName ?? doctorPatients.find((item) => item.id === finalPatientId)?.name
    if (!patientName) {
      setError('Paciente no encontrado para este doctor.')
      return
    }

    const end = addMinutes(appointmentStart, durationMinutes)
    const startDate = new Date(appointmentStart)
    const endDate = new Date(end)
    if (!isWithinSchedule(startDate, endDate, selectedDoctorSchedules)) {
      setError('La cita está fuera de tu horario disponible.')
      return
    }
    if (isBlocked(startDate, endDate)) {
      setError('La cita se cruza con un horario bloqueado.')
      return
    }

    const appointment: Appointment = {
      id: mode === 'edit' && editingId ? editingId : `apt-${Date.now()}`,
      doctorId,
      patientId: finalPatientId,
      title: patientName,
      start: appointmentStart,
      end,
      status: appointmentStatus,
      attended: appointmentStatus === 'attended',
      paymentType: paymentType || undefined,
      notes: notes.trim() || undefined,
    }

    const result = mode === 'edit' ? await updateAppointment(appointment) : await addAppointment(appointment)
    if (!result.ok) {
      setError(result.reason ?? 'No se pudo guardar la cita.')
      return
    }

    resetDialog()
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {doctor ? `Agenda de ${doctor.name}` : 'Agenda del doctor'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Consulta tu agenda y administra citas si tienes permisos activos.
        </Typography>
      </Box>

      <DoctorTabs />

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
          {!canManageVisits && (
            <Typography variant="body2" color="text.secondary">
              Solo lectura. No tienes permiso para administrar citas.
            </Typography>
          )}
        </Stack>
      </Paper>

      {error && <Alert severity="warning">{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <AgendaSidebar
          appointments={activeAppointments}
          patients={doctorPatients}
          selectedDate={selectedAgendaDate}
          onDateChange={handleAgendaDateChange}
        />
        <Paper sx={{ p: 2, minWidth: 0 }} elevation={2}>
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
          editable={canManageVisits}
          selectable={canManageVisits}
          longPressDelay={250}
          selectLongPressDelay={250}
          events={events}
          eventContent={(info) => {
            const patientName = String(info.event.extendedProps.patientName || info.event.title)
            const patientPhone = String(info.event.extendedProps.patientPhone || '')
            return (
              <Box sx={{ lineHeight: 1.15, overflow: 'hidden' }}>
                <Typography component="div" variant="caption" sx={{ fontWeight: 700, color: 'inherit', whiteSpace: 'normal' }}>
                  {patientName}
                </Typography>
                {patientPhone && (
                  <Typography component="div" variant="caption" sx={{ color: 'inherit', whiteSpace: 'normal' }}>
                    {patientPhone}
                  </Typography>
                )}
              </Box>
            )
          }}
          datesSet={(info) => setCalendarTitle(info.view.title)}
          select={handleSelect}
          dateClick={(info) => {
            if (view === 'dayGridMonth') {
              calendarRef.current?.getApi().changeView('timeGridWeek', info.date)
              setView('timeGridWeek')
              return
            }
            openAppointmentDialog(info.date.toISOString())
          }}
          eventDrop={async (info) => {
            const appointment = appointments.find((item) => item.id === info.event.id)
            if (!appointment) return
            const result = await updateAppointment({
              ...appointment,
              start: info.event.start?.toISOString() ?? appointment.start,
              end: info.event.end?.toISOString() ?? appointment.end,
              status: 'rescheduled',
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
            if (!canManageVisits) return
            const appointment = appointments.find((item) => item.id === info.event.id)
            if (!appointment) return
            setPatientId(appointment.patientId)
            setAppointmentStart(appointment.start)
            setDurationMinutes(diffMinutes(appointment.start, appointment.end) || constraints.slotMinutes)
            setAddingPatient(false)
            setNewPatientName('')
            setNewPatientPhone('')
            setAppointmentStatus(getAppointmentStatus(appointment))
            setPaymentType(appointment.paymentType ?? '')
            setNotes(appointment.notes ?? '')
            setMode('edit')
            setEditingId(appointment.id)
            setError(null)
            setDialogOpen(true)
          }}
          slotMinTime={`${constraints.startHour.toString().padStart(2, '0')}:00:00`}
          slotMaxTime={`${constraints.endHour.toString().padStart(2, '0')}:00:00`}
          slotDuration={`00:${constraints.slotMinutes.toString().padStart(2, '0')}:00`}
          businessHours={businessHours}
          selectConstraint="businessHours"
          eventConstraint="businessHours"
          selectAllow={(info) =>
            isWithinSchedule(info.start, info.end, selectedDoctorSchedules) &&
            !isBlocked(info.start, info.end)
          }
          eventAllow={(dropInfo) =>
            isWithinSchedule(dropInfo.start, dropInfo.end, selectedDoctorSchedules) &&
            !isBlocked(dropInfo.start, dropInfo.end)
          }
          eventOverlap={constraints.allowOverlap}
          selectOverlap={constraints.allowOverlap}
        />
        </Paper>
      </Box>

      <Dialog open={dialogOpen} onClose={resetDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{mode === 'edit' ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {doctorPatients.length === 0 ? (
              <Alert severity="info">No tienes pacientes registrados.</Alert>
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
            {!addingPatient && selectedPatient && (
              <Paper sx={{ p: 1.5 }} elevation={0}>
                <Typography variant="caption" color="text.secondary">
                  Teléfono del paciente
                </Typography>
                {selectedPatient.phone ? (
                  <Typography
                    component="a"
                    href={`tel:${selectedPatient.phone}`}
                    variant="body1"
                    sx={{ display: 'block', fontWeight: 700, color: 'primary.main', textDecoration: 'none' }}
                  >
                    {selectedPatient.phone}
                  </Typography>
                ) : (
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Sin teléfono registrado
                  </Typography>
                )}
              </Paper>
            )}
            {mode === 'create' && canEditPatients && (
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
            <TextField
              label="Inicio"
              type="datetime-local"
              value={toDateTimeLocalValue(appointmentStart)}
              onChange={(event) => {
                const nextStart = fromDateTimeLocalValue(event.target.value)
                setAppointmentStart(nextStart)
                if (mode === 'edit') {
                  setAppointmentStatus('rescheduled')
                }
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
            <TextField
              label="Duración (minutos)"
              type="number"
              inputProps={{ min: 10, step: 5 }}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
            />
            <TextField
              label="Fin"
              type="datetime-local"
              value={appointmentStart ? toDateTimeLocalValue(addMinutes(appointmentStart, durationMinutes)) : ''}
              onChange={(event) => {
                const nextEnd = fromDateTimeLocalValue(event.target.value)
                if (appointmentStart && nextEnd) {
                  setDurationMinutes(diffMinutes(appointmentStart, nextEnd))
                  if (mode === 'edit') {
                    setAppointmentStatus('rescheduled')
                  }
                }
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
            <TextField
              label="Estado"
              select
              value={appointmentStatus}
              onChange={(event) => setAppointmentStatus(event.target.value as AppointmentStatus)}
            >
              {appointmentStatuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Tipo de pago"
              select
              value={paymentType}
              onChange={(event) => setPaymentType(event.target.value)}
            >
              <MenuItem value="">Sin definir</MenuItem>
              {paymentTypes.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Notas"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={addingPatient ? !newPatientName.trim() : !patientId}
          >
            {mode === 'edit' ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default DoctorDashboard
