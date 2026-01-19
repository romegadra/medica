import {
  Box,
  Button,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'

function DoctorVisits() {
  const { doctorId } = useAuth()
  const { doctors, patients, specialtyTemplates, visits, addVisit, specialties } = useData()
  const doctor = doctors.find((item) => item.id === doctorId)
  const template = specialtyTemplates.find((item) => item.specialtyId === doctor?.specialtyId)
  const canManageVisits = doctor?.canManageVisits ?? true
  const templateById = useMemo(
    () => new Map(specialtyTemplates.map((item) => [item.id, item])),
    [specialtyTemplates],
  )

  const doctorPatients = useMemo(
    () => patients.filter((patient) => patient.doctorId === doctorId),
    [patients, doctorId],
  )

  const [patientId, setPatientId] = useState(doctorPatients[0]?.id ?? '')
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10))
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [selectedVisit, setSelectedVisit] = useState<(typeof visits)[number] | null>(null)

  useEffect(() => {
    setPatientId(doctorPatients[0]?.id ?? '')
    setVisitDate(new Date().toISOString().slice(0, 10))
  }, [doctorPatients])

  const patientVisits = useMemo(
    () =>
      visits.filter(
        (visit) => visit.doctorId === doctorId && (!patientId || visit.patientId === patientId),
      ),
    [visits, doctorId, patientId],
  )

  const handleSave = () => {
    if (!doctorId || !patientId || !template) return
    addVisit({
      id: `visit-${Date.now()}`,
      doctorId,
      patientId,
      date: visitDate,
      templateId: template.id,
      responses,
    })
    setVisitDate(new Date().toISOString().slice(0, 10))
    setResponses({})
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Consultas y seguimiento
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Registra la consulta segun la especialidad del doctor.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          {!canManageVisits && (
            <Typography variant="body2" color="text.secondary">
              No tienes permiso para registrar consultas.
            </Typography>
          )}
          <TextField
            label="Paciente"
            select
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            disabled={!canManageVisits}
          >
            {doctorPatients.map((patient) => (
              <MenuItem key={patient.id} value={patient.id}>
                {patient.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Fecha de consulta"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={visitDate}
            onChange={(event) => setVisitDate(event.target.value)}
            disabled={!canManageVisits}
            inputProps={{ lang: 'es' }}
          />
          {template ? (
            <>
              <Typography variant="subtitle1">
                {specialties.find((item) => item.id === template.specialtyId)?.name ?? 'Especialidad'}
              </Typography>
              <Stack spacing={2}>
                {template.fields.map((field) => (
                  <TextField
                    key={field.id}
                    label={field.label}
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    multiline={field.type === 'textarea'}
                    minRows={field.type === 'textarea' ? 3 : undefined}
                    required={field.required}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                    value={responses[field.id] ?? ''}
                    onChange={(event) =>
                      setResponses((prev) => ({ ...prev, [field.id]: event.target.value }))
                    }
                    disabled={!canManageVisits}
                  />
                ))}
              </Stack>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay plantilla asignada para esta especialidad.
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!patientId || !template || !canManageVisits}
          >
            Guardar consulta
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Historial</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Paciente</TableCell>
                <TableCell>Resumen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patientVisits.map((visit) => {
                const patient = doctorPatients.find((item) => item.id === visit.patientId)
                const resumen =
                  visit.responses.diagnostico || visit.responses.motivo || visit.responses.notas || '-'
                return (
                  <TableRow key={visit.id} hover onClick={() => setSelectedVisit(visit)}>
                    <TableCell>{visit.date}</TableCell>
                    <TableCell>{patient?.name ?? 'Paciente'}</TableCell>
                    <TableCell>{resumen}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Stack>
      </Paper>

      <Dialog
        open={Boolean(selectedVisit)}
        onClose={() => setSelectedVisit(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Detalle de consulta</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Fecha: {selectedVisit?.date}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Paciente:{' '}
              {selectedVisit
                ? doctorPatients.find((item) => item.id === selectedVisit.patientId)?.name ?? 'Paciente'
                : ''}
            </Typography>
            {selectedVisit &&
              Object.entries(selectedVisit.responses).map(([key, value]) => {
                const selectedTemplate = templateById.get(selectedVisit.templateId)
                const fieldLabel =
                  selectedTemplate?.fields.find((field) => field.id === key)?.label ?? key
                return (
                  <Stack key={key} spacing={0.5}>
                    <Typography variant="subtitle2">{fieldLabel}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {value}
                    </Typography>
                  </Stack>
                )
              })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedVisit(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default DoctorVisits
