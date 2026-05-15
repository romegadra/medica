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
  Chip,
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
import { useToast } from '../components/ToastProvider'

type CalendarView = 'timeGridWeek' | 'dayGridMonth'
type DialogMode = 'create' | 'edit'

const paymentTypes = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'insurance', label: 'Seguro' },
]

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

function ReceptionistDashboard() {
  const {
    doctors,
    doctorSchedules,
    doctorBlockedTimes,
    patients,
    appointments,
    constraints,
    addAppointment,
    updateAppointment,
    cancelAppointment,
    addPatient,
    loadPatientsForDoctor,
    addDoctorBlockedTime,
    removeDoctorBlockedTime,
  } = useData()
  const { unitId } = useAuth()
  const { showToast } = useToast()
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
  const [notes, setNotes] = useState('')
  const [paymentType, setPaymentType] = useState('')
  const [attended, setAttended] = useState(false)
  const [mode, setMode] = useState<DialogMode>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [addingPatient, setAddingPatient] = useState(false)
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientPhone, setNewPatientPhone] = useState('')
  const [blockReason, setBlockReason] = useState('')
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
    void loadPatientsForDoctor(doctorId)
  }, [doctorId, loadPatientsForDoctor])

  const doctorPatients = useMemo(
    () => patients.filter((patient) => patient.doctorId === doctorId),
    [patients, doctorId],
  )
  const selectedDoctorSchedules = useMemo(
    () => doctorSchedules.filter((schedule) => schedule.doctorId === doctorId),
    [doctorSchedules, doctorId],
  )
  const selectedDoctorBlocks = useMemo(
    () => doctorBlockedTimes.filter((block) => block.doctorId === doctorId),
    [doctorBlockedTimes, doctorId],
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
    [selectedDoctorSchedules, constraints.endHour, constraints.startHour],
  )

  const events = useMemo(() => {
    const filtered = appointments.filter(
      (appointment) => appointment.doctorId === doctorId && appointment.status !== 'cancelled',
    )
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
    const appointmentEvents = scoped.map((appointment) => ({
      id: appointment.id,
      title: `${appointment.attended ? 'Asistió - ' : ''}${appointment.title}`,
      start: appointment.start,
      end: appointment.end,
    }))
    const blockEvents = selectedDoctorBlocks.map((block) => ({
      id: `block-${block.id}`,
      title: block.reason ? `Bloqueado: ${block.reason}` : 'Bloqueado',
      start: block.start,
      end: block.end,
      display: 'background',
      color: '#ef5350',
    }))
    return [...appointmentEvents, ...blockEvents]
  }, [appointments, doctorId, patientFilterId, patientFilterText, doctorPatients, selectedDoctorBlocks])

  const overlapsBlock = (start: Date, end: Date) =>
    selectedDoctorBlocks.some(
      (block) => start < new Date(block.end) && new Date(block.start) < end,
    )

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
    setNotes('')
    setPaymentType('')
    setAttended(false)
    setBlockReason('')
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
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setError('La duración debe ser mayor a 0 minutos.')
      return
    }

    let finalPatientId = patientId
    let finalPatientName: string | null = null
    if (addingPatient) {
      if (!newPatientName.trim()) {
        setError('Ingresa un nombre para el nuevo paciente.')
        return
      }
      finalPatientName = newPatientName.trim()
      const createdPatient = await addPatient({
        id: `pat-${Date.now()}`,
        doctorId,
        name: finalPatientName,
        phone: newPatientPhone.trim() || undefined,
      })
      finalPatientId = createdPatient.id
      finalPatientName = createdPatient.name
      showToast('Paciente agregado correctamente.')
    }

    const patientName =
      finalPatientName ?? doctorPatients.find((item) => item.id === finalPatientId)?.name
    if (!patientName) {
      setError('Paciente no encontrado para este doctor.')
      return
    }

    const end = addMinutes(appointmentStart, durationMinutes)
    if (!isWithinSchedule(new Date(appointmentStart), new Date(end), selectedDoctorSchedules)) {
      setError('La cita esta fuera del horario disponible del doctor.')
      return
    }
    if (overlapsBlock(new Date(appointmentStart), new Date(end))) {
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
      status: 'scheduled',
      attended,
      notes: notes.trim() || undefined,
      paymentType: paymentType || undefined,
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
    showToast(mode === 'edit' ? 'Cita actualizada correctamente.' : 'Cita creada correctamente.')
  }

  const handleCancelAppointment = async () => {
    if (!editingId) return
    const result = await cancelAppointment(editingId, cancelReason.trim() || undefined)
    if (!result.ok) {
      setError(result.reason ?? 'No se pudo cancelar la cita.')
      return
    }
    setCancelDialogOpen(false)
    setDialogOpen(false)
    setCancelReason('')
    setEditingId(null)
    setError(null)
    showToast('Cita cancelada correctamente.')
  }

  const handleBlockSelectedTime = async () => {
    if (!appointmentStart || !doctorId) return
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setError('La duración debe ser mayor a 0 minutos.')
      return
    }
    const end = addMinutes(appointmentStart, durationMinutes)
    const result = await addDoctorBlockedTime({
      id: `block-${Date.now()}`,
      doctorId,
      start: appointmentStart,
      end,
      reason: blockReason.trim() || undefined,
    })
    if (!result.ok) {
      setError(result.reason ?? 'No se pudo bloquear el horario.')
      return
    }
    setDialogOpen(false)
    setBlockReason('')
    setError(null)
    showToast('Horario bloqueado correctamente.')
  }

  const handleUnblock = async (id: string) => {
    const result = await removeDoctorBlockedTime(id)
    if (!result.ok) {
      setError(result.reason ?? 'No se pudo desbloquear el horario.')
      return
    }
    showToast('Horario desbloqueado correctamente.')
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
            <Button component={Link} to="/reception/cancelled-appointments" variant="outlined" size="small">
              Citas canceladas
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
            if (
              !isWithinSchedule(
                info.event.start ?? new Date(appointment.start),
                info.event.end ?? new Date(appointment.end),
                selectedDoctorSchedules,
              )
            ) {
              setError('La cita esta fuera del horario disponible del doctor.')
              info.revert()
              return
            }
            if (
              overlapsBlock(
                info.event.start ?? new Date(appointment.start),
                info.event.end ?? new Date(appointment.end),
              )
            ) {
              setError('La cita se cruza con un horario bloqueado.')
              info.revert()
              return
            }
            const result = await updateAppointment({
              ...appointment,
              start: info.event.start?.toISOString() ?? appointment.start,
              end: info.event.end?.toISOString() ?? appointment.end,
            })
            if (!result.ok) {
              setError(result.reason ?? 'No se pudo mover la cita.')
              info.revert()
              return
            }
            showToast('Cita actualizada correctamente.')
          }}
          eventResize={async (info) => {
            const appointment = appointments.find((item) => item.id === info.event.id)
            if (!appointment) return
            if (
              !isWithinSchedule(
                info.event.start ?? new Date(appointment.start),
                info.event.end ?? new Date(appointment.end),
                selectedDoctorSchedules,
              )
            ) {
              setError('La cita esta fuera del horario disponible del doctor.')
              info.revert()
              return
            }
            if (
              overlapsBlock(
                info.event.start ?? new Date(appointment.start),
                info.event.end ?? new Date(appointment.end),
              )
            ) {
              setError('La cita se cruza con un horario bloqueado.')
              info.revert()
              return
            }
            const result = await updateAppointment({
              ...appointment,
              start: info.event.start?.toISOString() ?? appointment.start,
              end: info.event.end?.toISOString() ?? appointment.end,
            })
            if (!result.ok) {
              setError(result.reason ?? 'No se pudo ajustar la cita.')
              info.revert()
              return
            }
            showToast('Cita actualizada correctamente.')
          }}
          eventClick={(info) => {
            const appointment = appointments.find((item) => item.id === info.event.id)
            if (!appointment) return
            setPatientId(appointment.patientId)
            setAppointmentStart(appointment.start)
            setDurationMinutes(diffMinutes(appointment.start, appointment.end) || constraints.slotMinutes)
            setNotes(appointment.notes ?? '')
            setPaymentType(appointment.paymentType ?? '')
            setAttended(Boolean(appointment.attended))
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
          businessHours={businessHours}
          selectConstraint="businessHours"
          selectAllow={(info) =>
            isWithinSchedule(info.start, info.end, selectedDoctorSchedules) &&
            !overlapsBlock(info.start, info.end)
          }
          eventAllow={(dropInfo) =>
            isWithinSchedule(dropInfo.start, dropInfo.end, selectedDoctorSchedules) &&
            !overlapsBlock(dropInfo.start, dropInfo.end)
          }
          eventOverlap={constraints.allowOverlap}
          selectOverlap={constraints.allowOverlap}
        />
      </Paper>

      <Paper sx={{ p: 2 }} elevation={2}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
            <Typography variant="h6">Horarios bloqueados</Typography>
            <Typography variant="body2" color="text.secondary">
              Selecciona un rango en la agenda y usa "Bloquear horario".
            </Typography>
          </Stack>
          {selectedDoctorBlocks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin bloqueos para este doctor.
            </Typography>
          ) : (
            selectedDoctorBlocks.map((block) => (
              <Stack
                key={block.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(block.start).toLocaleString('es-MX')} -{' '}
                    {new Date(block.end).toLocaleString('es-MX')}
                  </Typography>
                  {block.reason && <Chip label={block.reason} size="small" />}
                </Box>
                <Button variant="outlined" color="error" size="small" onClick={() => handleUnblock(block.id)}>
                  Desbloquear
                </Button>
              </Stack>
            ))
          )}
        </Stack>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingId(null)
          setAddingPatient(false)
          setNewPatientName('')
          setNewPatientPhone('')
          setNotes('')
          setPaymentType('')
          setAttended(false)
          setCancelDialogOpen(false)
          setCancelReason('')
          setBlockReason('')
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
            <TextField
              label="Inicio"
              type="datetime-local"
              value={toDateTimeLocalValue(appointmentStart)}
              onChange={(event) => setAppointmentStart(fromDateTimeLocalValue(event.target.value))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
            <TextField
              label="Duración (minutos)"
              type="number"
              inputProps={{ min: 1, step: 1 }}
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
                }
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
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
            <FormControlLabel
              control={
                <Switch
                  checked={attended}
                  onChange={(event) => setAttended(event.target.checked)}
                />
              }
              label="Paciente asistió"
            />
            <TextField
              label="Notas"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              multiline
              minRows={3}
            />
            {mode === 'create' && (
              <>
                <Divider />
                <TextField
                  label="Motivo del bloqueo"
                  value={blockReason}
                  onChange={(event) => setBlockReason(event.target.value)}
                />
                <Button variant="outlined" color="warning" onClick={handleBlockSelectedTime}>
                  Bloquear horario
                </Button>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          {mode === 'edit' && (
            <Button color="error" onClick={() => setCancelDialogOpen(true)}>
              Cancelar cita
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={addingPatient ? !newPatientName.trim() : !patientId}
          >
            {mode === 'edit' ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancelar cita</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              La cita saldrá de la agenda activa y quedará disponible en el listado de canceladas.
            </Typography>
            <TextField
              label="Motivo de cancelación"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Volver</Button>
          <Button color="error" variant="contained" onClick={handleCancelAppointment}>
            Cancelar cita
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default ReceptionistDashboard
