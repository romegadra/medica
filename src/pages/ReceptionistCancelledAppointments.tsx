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
  Typography,
} from '@mui/material'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  insurance: 'Seguro',
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function ReceptionistCancelledAppointments() {
  const { unitId } = useAuth()
  const { appointments, doctors, patients } = useData()

  const unitDoctorIds = useMemo(
    () => new Set(doctors.filter((doctor) => !unitId || doctor.unitId === unitId).map((doctor) => doctor.id)),
    [doctors, unitId],
  )

  const cancelledAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status === 'cancelled' && unitDoctorIds.has(appointment.doctorId),
        )
        .sort(
          (first, second) =>
            new Date(second.cancelledAt ?? second.start).getTime() -
            new Date(first.cancelledAt ?? first.start).getTime(),
        ),
    [appointments, unitDoctorIds],
  )

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Citas canceladas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Historial de citas canceladas para la unidad.
          </Typography>
        </Box>
        <Button component={Link} to="/reception" variant="outlined">
          Volver a agenda
        </Button>
      </Stack>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha de cita</TableCell>
              <TableCell>Paciente</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Tipo de pago</TableCell>
              <TableCell>Notas</TableCell>
              <TableCell>Motivo</TableCell>
              <TableCell>Cancelada</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cancelledAppointments.map((appointment) => {
              const doctor = doctors.find((item) => item.id === appointment.doctorId)
              const patient = patients.find((item) => item.id === appointment.patientId)
              return (
                <TableRow key={appointment.id}>
                  <TableCell>{formatDate(appointment.start)}</TableCell>
                  <TableCell>{patient?.name ?? appointment.title}</TableCell>
                  <TableCell>{doctor?.name ?? '-'}</TableCell>
                  <TableCell>
                    {appointment.paymentType ? (
                      <Chip
                        label={paymentLabels[appointment.paymentType] ?? appointment.paymentType}
                        size="small"
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{appointment.notes || '-'}</TableCell>
                  <TableCell>{appointment.cancellationReason || '-'}</TableCell>
                  <TableCell>{formatDate(appointment.cancelledAt)}</TableCell>
                </TableRow>
              )
            })}
            {cancelledAppointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary">
                    No hay citas canceladas.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}

export default ReceptionistCancelledAppointments
