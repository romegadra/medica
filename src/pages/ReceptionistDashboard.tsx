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

type CalendarView = 'timeGridWeek' | 'dayGridMonth'
type DialogMode = 'create' | 'edit'
type AppointmentStatus = NonNullable<Appointment['status']>

const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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

function ReceptionistDashboard() {
  const { doctors, doctorSchedules, patients, units, appointments, constraints, addAppointment, updateAppointment, addPatient } =
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
  const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatus>('scheduled')
  const [paymentType, setPaymentType] = useState('')
  const [notes, setNotes] = useState('')
  const [globalSearch, setGlobalSearch] = useState('')
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
  const selectedPatient = useMemo(
    () => doctorPatients.find((patient) => patient.id === patientId),
    [doctorPatients, patientId],
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
  const scheduleSummary =
    selectedDoctorSchedules.length > 0
      ? selectedDoctorSchedules
          .map((schedule) => `${dayLabels[schedule.dayOfWeek]} ${schedule.startTime}-${schedule.endTime}`)
          .join(', ')
      : `${constraints.startHour}:00-${constraints.endHour}:00`

  const activeAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) => appointment.doctorId === doctorId && appointment.status !== 'cancelled',
      ),
    [appointments, doctorId],
  )

  const todayAppointments = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    return activeAppointments.filter((appointment) => appointment.start.slice(0, 10) === todayKey)
  }, [activeAppointments])

  const receptionTasks = useMemo(() => {
    const now = new Date()
    const needsConfirmation = activeAppointments.filter((appointment) => {
      const status = getAppointmentStatus(appointment)
      return new Date(appointment.start) >= now && (status === 'pending' || status === 'scheduled')
    })
    const unpaid = activeAppointments.filter((appointment) => !appointment.paymentType)
    const incompletePatients = doctorPatients.filter(
      (patient) => !patient.phone || !patient.address || !patient.historyDate,
    )
    const pendingCalls = activeAppointments.filter((appointment) =>
      (appointment.notes ?? '').toLowerCase().includes('llamar'),
    )
    return { needsConfirmation, unpaid, incompletePatients, pendingCalls }
  }, [activeAppointments, doctorPatients])

  const occupancy = useMemo(() => {
    const availableMinutes = Math.max(0, (constraints.endHour - constraints.startHour) * 60)
    const occupiedMinutes = todayAppointments.reduce(
      (total, appointment) =>
        total +
        Math.max(0, Math.round((new Date(appointment.end).getTime() - new Date(appointment.start).getTime()) / 60000)),
      0,
    )
    const saturation = availableMinutes === 0 ? 0 : Math.min(100, Math.round((occupiedMinutes / availableMinutes) * 100))
    return {
      occupiedMinutes,
      availableMinutes,
      saturation,
      freeMinutes: Math.max(0, availableMinutes - occupiedMinutes),
      freeSlots: constraints.slotMinutes > 0 ? Math.floor(Math.max(0, availableMinutes - occupiedMinutes) / constraints.slotMinutes) : 0,
    }
  }, [constraints.endHour, constraints.slotMinutes, constraints.startHour, todayAppointments])

  const globalResults = useMemo(() => {
    const normalized = globalSearch.trim().toLowerCase()
    if (!normalized) return []
    const unitById = new Map(units.map((unit) => [unit.id, unit]))
    const doctorById = new Map(doctors.map((doctor) => [doctor.id, doctor]))
    const patientMatches = patients
      .filter((patient) => {
        const doctor = doctorById.get(patient.doctorId)
        if (unitId && doctor?.unitId !== unitId) return false
        return `${patient.name} ${patient.phone ?? ''} ${patient.address ?? ''}`.toLowerCase().includes(normalized)
      })
      .slice(0, 5)
      .map((patient) => ({
        type: 'Paciente',
        title: patient.name,
        detail: `${patient.phone ?? 'Sin teléfono'} · ${doctorById.get(patient.doctorId)?.name ?? 'Doctor'}`,
      }))
    const doctorMatches = unitDoctors
      .filter((doctor) => `${doctor.name} ${doctor.phone ?? ''}`.toLowerCase().includes(normalized))
      .slice(0, 5)
      .map((doctor) => ({
        type: 'Doctor',
        title: doctor.name,
        detail: unitById.get(doctor.unitId)?.name ?? 'Unidad',
      }))
    const appointmentMatches = appointments
      .filter((appointment) => {
        const doctor = doctorById.get(appointment.doctorId)
        if (unitId && doctor?.unitId !== unitId) return false
        return `${appointment.title} ${appointment.status ?? ''}`.toLowerCase().includes(normalized)
      })
      .slice(0, 5)
      .map((appointment) => ({
        type: 'Cita',
        title: appointment.title,
        detail: `${new Date(appointment.start).toLocaleString('es-MX')} · ${doctorById.get(appointment.doctorId)?.name ?? 'Doctor'}`,
      }))
    return [...patientMatches, ...doctorMatches, ...appointmentMatches].slice(0, 10)
  }, [appointments, doctors, globalSearch, patients, unitDoctors, unitId, units])

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
    return scoped.map((appointment) => {
      const patient = doctorPatients.find((item) => item.id === appointment.patientId)
      const title = patient?.phone ? `${appointment.title} · ${patient.phone}` : appointment.title
      return {
        id: appointment.id,
        title,
        start: appointment.start,
        end: appointment.end,
        extendedProps: {
          patientName: appointment.title,
          patientPhone: patient?.phone ?? '',
        },
        backgroundColor: getAppointmentColor(appointment),
        borderColor: getAppointmentColor(appointment),
        textColor: getAppointmentColor(appointment) ? '#fff' : undefined,
      }
    })
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
    setAppointmentStatus('scheduled')
    setPaymentType('')
    setNotes('')
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
      finalPatientName = newPatientName.trim()
      const createdPatient = await addPatient({
        id: `pat-${Date.now()}`,
        doctorId,
        name: finalPatientName,
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
              Horario: {scheduleSummary}
            </Typography>
            <Button component={Link} to="/reception/patients" variant="outlined" size="small">
              Agregar pacientes
            </Button>
          </Stack>
          <TextField
            label="Búsqueda global"
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Paciente, teléfono, doctor, cita o unidad"
            fullWidth
          />
          {globalResults.length > 0 && (
            <Stack spacing={1}>
              {globalResults.map((result, index) => (
                <Paper key={`${result.type}-${result.title}-${index}`} sx={{ p: 1.5 }} elevation={0}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                    <Chip label={result.type} size="small" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {result.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.detail}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
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

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
          gap: 2,
        }}
      >
        {[
          ['Por confirmar', receptionTasks.needsConfirmation.length],
          ['Citas sin pago', receptionTasks.unpaid.length],
          ['Pacientes incompletos', receptionTasks.incompletePatients.length],
          ['Llamadas pendientes', receptionTasks.pendingCalls.length],
          ['Huecos libres hoy', occupancy.freeSlots],
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

      <Paper sx={{ p: 2 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Ocupación de hoy</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Chip label={`${occupancy.saturation}% saturación`} />
            <Chip label={`${Math.round(occupancy.occupiedMinutes / 60)} h ocupadas`} />
            <Chip label={`${Math.round(occupancy.freeMinutes / 60)} h libres`} />
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
          eventContent={(info) => {
            const patientName = String(info.event.extendedProps.patientName || info.event.title)
            const patientPhone = String(info.event.extendedProps.patientPhone || '')
            return (
              <Box sx={{ lineHeight: 1.15, overflow: 'hidden' }}>
                <Typography
                  component="div"
                  variant="caption"
                  sx={{ fontWeight: 700, color: 'inherit', whiteSpace: 'normal' }}
                >
                  {patientName}
                </Typography>
                {patientPhone && (
                  <Typography
                    component="div"
                    variant="caption"
                    sx={{ color: 'inherit', whiteSpace: 'normal' }}
                  >
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
            }
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
          selectAllow={(info) => isWithinSchedule(info.start, info.end, selectedDoctorSchedules)}
          eventAllow={(dropInfo) => isWithinSchedule(dropInfo.start, dropInfo.end, selectedDoctorSchedules)}
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
          setAppointmentStatus('scheduled')
          setPaymentType('')
          setNotes('')
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
            {!addingPatient && selectedPatient && (
              <Paper sx={{ p: 1.5 }} elevation={0}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Teléfono del paciente
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {selectedPatient.phone || 'Sin teléfono registrado'}
                  </Typography>
                </Stack>
              </Paper>
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
    </Stack>
  )
}

export default ReceptionistDashboard
