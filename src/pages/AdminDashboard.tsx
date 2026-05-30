import { Alert, Box, Button, Divider, Paper, Stack, Switch, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useData } from '../data/DataContext'

function AdminDashboard() {
  const { constraints, updateConstraints, runAppointmentReminders, doctors, patients, units } = useData()
  const [form, setForm] = useState(constraints)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [runningReminders, setRunningReminders] = useState(false)

  useEffect(() => {
    setForm(constraints)
  }, [constraints])

  const handleChange = (field: keyof typeof form, value: number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaveMessage(null)
    setSaveError(null)
    const result = await updateConstraints(form)
    if (!result.ok) {
      setSaveError(result.reason ?? 'No se pudieron guardar las restricciones.')
      return
    }
    setSaveMessage('Restricciones guardadas correctamente.')
  }

  const handleRunReminders = async () => {
    setRunningReminders(true)
    setSaveMessage(null)
    setSaveError(null)
    const result = await runAppointmentReminders()
    if (!result.ok) {
      setSaveError(result.reason ?? 'No se pudieron ejecutar los recordatorios.')
    } else {
      setSaveMessage(`Recordatorios ejecutados. Citas revisadas para mañana: ${result.count ?? 0}.`)
    }
    setRunningReminders(false)
  }

  const unitSummary = useMemo(() => {
    return units.map((unit) => {
      const unitDoctors = doctors.filter((doctor) => doctor.unitId === unit.id)
      return {
        unit,
        doctors: unitDoctors.map((doctor) => ({
          doctor,
          patientCount: patients.filter((patient) => patient.doctorId === doctor.id).length,
        })),
      }
    })
  }, [units, doctors, patients])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Configuración de admin
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configura reglas de agenda y valores por defecto de la clínica.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Restricciones de agenda</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Hora inicio"
              type="number"
              inputProps={{ min: 0, max: 23 }}
              value={form.startHour}
              onChange={(event) => handleChange('startHour', Number(event.target.value))}
              sx={{ minWidth: 120, '& .MuiInputLabel-root': { color: 'text.primary' } }}
            />
            <TextField
              label="Hora fin"
              type="number"
              inputProps={{ min: 1, max: 24 }}
              value={form.endHour}
              onChange={(event) => handleChange('endHour', Number(event.target.value))}
              sx={{ minWidth: 120, '& .MuiInputLabel-root': { color: 'text.primary' } }}
            />
            <TextField
              label="Minutos por cita"
              type="number"
              inputProps={{ min: 10, max: 120, step: 5 }}
              value={form.slotMinutes}
              onChange={(event) => handleChange('slotMinutes', Number(event.target.value))}
              sx={{ minWidth: 120, '& .MuiInputLabel-root': { color: 'text.primary' } }}
            />
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Switch
              checked={form.allowOverlap}
              onChange={(event) => handleChange('allowOverlap', event.target.checked)}
            />
            <Typography variant="body2">Permitir citas traslapadas</Typography>
          </Stack>
          {saveError && <Alert severity="error">{saveError}</Alert>}
          {saveMessage && <Alert severity="success">{saveMessage}</Alert>}
          <Button variant="contained" onClick={handleSave}>
            Guardar restricciones
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Recordatorios de citas</Typography>
          <Typography variant="body2" color="text.secondary">
            Configura el job que envía WhatsApp a pacientes un día antes de su cita.
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Switch
              checked={form.appointmentRemindersEnabled}
              onChange={(event) => handleChange('appointmentRemindersEnabled', event.target.checked)}
            />
            <Typography variant="body2">Activar recordatorios automáticos</Typography>
          </Stack>
          <TextField
            label="Ejecutar cada (minutos)"
            type="number"
            inputProps={{ min: 5, max: 1440, step: 5 }}
            value={form.appointmentReminderIntervalMinutes}
            onChange={(event) =>
              handleChange('appointmentReminderIntervalMinutes', Number(event.target.value))
            }
            sx={{ maxWidth: 260, '& .MuiInputLabel-root': { color: 'text.primary' } }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" onClick={handleSave}>
              Guardar configuración
            </Button>
            <Button variant="outlined" onClick={handleRunReminders} disabled={runningReminders}>
              Ejecutar ahora
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Unidades</Typography>
          <Typography variant="body2" color="text.secondary">
            Crea y administra unidades para el control por recepción.
          </Typography>
          <Button component={Link} to="/admin/units" variant="outlined">
            Administrar unidades
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Administradores</Typography>
          <Typography variant="body2" color="text.secondary">
            Crea admins de unidad o admins master.
          </Typography>
          <Button component={Link} to="/admin/users" variant="outlined">
            Administrar usuarios admin
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Doctores</Typography>
          <Typography variant="body2" color="text.secondary">
            Agrega y administra doctores disponibles para agenda.
          </Typography>
          <Button component={Link} to="/admin/doctors" variant="outlined">
            Administrar doctores
          </Button>
          <Button component={Link} to="/admin/doctor-blocks" variant="outlined">
            Bloquear horarios
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Recepcionistas</Typography>
          <Typography variant="body2" color="text.secondary">
            Administra recepcionistas por unidad.
          </Typography>
          <Button component={Link} to="/admin/receptionists" variant="outlined">
            Administrar recepcionistas
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Plantillas</Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta las plantillas por especialidad.
          </Typography>
          <Button component={Link} to="/admin/templates" variant="outlined">
            Ver plantillas
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Especialidades</Typography>
          <Typography variant="body2" color="text.secondary">
            Administra el catalogo de especialidades.
          </Typography>
          <Button component={Link} to="/admin/specialties" variant="outlined">
            Administrar especialidades
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Operación y seguridad</Typography>
          <Typography variant="body2" color="text.secondary">
            Revisa la bitácora de cambios de citas, pacientes y bloqueos de horario.
          </Typography>
          <Button component={Link} to="/admin/audit" variant="outlined">
            Ver auditoría
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h6">Resumen metricas</Typography>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            Unidades: {units.length}
          </Typography>
          {unitSummary.map(({ unit, doctors: unitDoctors }) => (
            <Stack key={unit.id} spacing={1}>
              <Typography variant="subtitle2">{unit.name}</Typography>
              {unitDoctors.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Sin doctores registrados.
                </Typography>
              ) : (
                unitDoctors.map(({ doctor, patientCount }) => (
                  <Typography key={doctor.id} variant="body2" color="text.secondary">
                    {doctor.name}: {patientCount} pacientes
                  </Typography>
                ))
              )}
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}

export default AdminDashboard
