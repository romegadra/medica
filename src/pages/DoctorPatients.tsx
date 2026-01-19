import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'
import type { Patient } from '../data/types'

function DoctorPatients() {
  const { doctorId } = useAuth()
  const { doctors, patients, addPatient, updatePatient, removePatient } = useData()
  const doctor = doctors.find((item) => item.id === doctorId)
  const canEditPatients = doctor?.canEditPatients ?? true
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [historyDate, setHistoryDate] = useState('')
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null)

  const doctorPatients = useMemo(
    () => patients.filter((patient) => patient.doctorId === doctorId),
    [patients, doctorId],
  )

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed || !doctorId) return
    addPatient({
      id: `pat-${Date.now()}`,
      doctorId,
      name: trimmed,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      historyDate: historyDate || undefined,
    })
    setName('')
    setPhone('')
    setAddress('')
    setHistoryDate('')
  }

  const handleEditSave = () => {
    if (!editingPatient) return
    const trimmed = editingPatient.name.trim()
    if (!trimmed) return
    updatePatient({
      ...editingPatient,
      name: trimmed,
      phone: editingPatient.phone?.trim() || undefined,
      address: editingPatient.address?.trim() || undefined,
      historyDate: editingPatient.historyDate || undefined,
    })
    setEditingPatient(null)
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Registro de pacientes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Registra pacientes para tu consulta.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          {!canEditPatients && (
            <Typography variant="body2" color="text.secondary">
              No tienes permiso para editar pacientes.
            </Typography>
          )}
          <TextField
            label="Nombre del paciente"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canEditPatients}
          />
          <TextField
            label="Celular"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={!canEditPatients}
          />
          <TextField
            label="Dirección"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            disabled={!canEditPatients}
          />
          <TextField
            label="Fecha historial"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={historyDate}
            onChange={(event) => setHistoryDate(event.target.value)}
            disabled={!canEditPatients}
          />
          <Button variant="contained" onClick={handleAdd} disabled={!name.trim() || !canEditPatients}>
            Agregar paciente
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Pacientes</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>Celular</TableCell>
                <TableCell>Dirección</TableCell>
                <TableCell>Fecha historial</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {doctorPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>{patient.phone ?? '-'}</TableCell>
                  <TableCell>{patient.address ?? '-'}</TableCell>
                  <TableCell>{patient.historyDate ?? '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => setEditingPatient(patient)}
                      disabled={!canEditPatients}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeletePatient(patient)}
                      disabled={!canEditPatients}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </Paper>

      <Dialog open={Boolean(editingPatient)} onClose={() => setEditingPatient(null)} fullWidth maxWidth="xs">
        <DialogTitle>Editar paciente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre del paciente"
              value={editingPatient?.name ?? ''}
              onChange={(event) =>
                setEditingPatient((prev) => (prev ? { ...prev, name: event.target.value } : prev))
              }
            />
            <TextField
              label="Celular"
              value={editingPatient?.phone ?? ''}
              onChange={(event) =>
                setEditingPatient((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
              }
            />
            <TextField
              label="Dirección"
              value={editingPatient?.address ?? ''}
              onChange={(event) =>
                setEditingPatient((prev) => (prev ? { ...prev, address: event.target.value } : prev))
              }
            />
            <TextField
              label="Fecha historial"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={editingPatient?.historyDate ?? ''}
              onChange={(event) =>
                setEditingPatient((prev) =>
                  prev ? { ...prev, historyDate: event.target.value } : prev,
                )
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingPatient(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={!editingPatient?.name.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deletePatient)} onClose={() => setDeletePatient(null)} fullWidth maxWidth="xs">
        <DialogTitle>¿Eliminar paciente?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se eliminará el paciente y sus citas relacionadas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePatient(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deletePatient) {
                removePatient(deletePatient.id)
              }
              setDeletePatient(null)
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default DoctorPatients
