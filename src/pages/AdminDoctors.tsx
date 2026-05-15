import {
  Box,
  Button,
  Alert,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
  Switch,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import DoctorBlockedTimeManager from '../components/DoctorBlockedTimeManager'
import DoctorScheduleManager from '../components/DoctorScheduleManager'
import { useToast } from '../components/ToastProvider'
import { useData } from '../data/DataContext'
import type { Doctor } from '../data/types'

function getErrorMessage(err: unknown, fallback: string) {
  if (!(err instanceof Error)) return fallback
  try {
    const parsed = JSON.parse(err.message) as { error?: string }
    return parsed.error ?? fallback
  } catch {
    return err.message || fallback
  }
}

function AdminDoctors() {
  const { doctors, addDoctor, updateDoctor, removeDoctor, units, specialties } = useData()
  const { role, unitId: adminUnitId } = useAuth()
  const { showToast } = useToast()
  const visibleUnits = useMemo(
    () => (role === 'admin' && adminUnitId ? units.filter((unit) => unit.id === adminUnitId) : units),
    [adminUnitId, role, units],
  )
  const visibleDoctors = useMemo(
    () =>
      role === 'admin' && adminUnitId
        ? doctors.filter((doctor) => doctor.unitId === adminUnitId)
        : doctors,
    [adminUnitId, doctors, role],
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id ?? '')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [canEditPatients, setCanEditPatients] = useState(true)
  const [canManageVisits, setCanManageVisits] = useState(true)
  const [unitId, setUnitId] = useState(visibleUnits[0]?.id ?? '')
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [deleteDoctor, setDeleteDoctor] = useState<Doctor | null>(null)
  const [resetDoctor, setResetDoctor] = useState<Doctor | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  const handleAdd = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (!email.trim()) return
    if (!unitId) return
    setMessage(null)
    setError(null)
    try {
      await addDoctor({
        id: `doc-${Date.now()}`,
        name: trimmed,
        email: email.trim(),
        unitId,
        specialtyId: specialtyId || undefined,
        phone: phone.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        canEditPatients,
        canManageVisits,
      })
      setName('')
      setEmail('')
      setSpecialtyId(specialties[0]?.id ?? '')
      setPhone('')
      setLicenseNumber('')
      setCanEditPatients(true)
      setCanManageVisits(true)
      showToast('Doctor agregado correctamente.')
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo agregar el doctor'))
    }
  }

  useEffect(() => {
    if (!specialtyId && specialties.length > 0) {
      setSpecialtyId(specialties[0].id)
    }
  }, [specialties, specialtyId])

  useEffect(() => {
    if (!unitId && units.length > 0) {
      setUnitId(visibleUnits[0].id)
    }
  }, [visibleUnits, unitId])

  const handleEditSave = async () => {
    if (!editingDoctor) return
    const trimmed = editingDoctor.name.trim()
    if (!trimmed) return
    const previousEmail = doctors.find((doctor) => doctor.id === editingDoctor.id)?.email?.trim()
    const nextEmail = editingDoctor.email?.trim()
    setMessage(null)
    setError(null)
    try {
      await updateDoctor({ ...editingDoctor, name: trimmed, email: nextEmail })
      setEditingDoctor(null)
      const emailChanged = Boolean(nextEmail && nextEmail !== previousEmail)
      const nextMessage = emailChanged
        ? 'Correo actualizado. El doctor deberá iniciar sesión con el nuevo correo.'
        : 'Doctor actualizado correctamente.'
      setMessage(nextMessage)
      showToast(nextMessage)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo actualizar el doctor'))
    }
  }

  const handleResetPassword = async () => {
    if (!resetDoctor) return
    setResetting(true)
    setMessage(null)
    setError(null)
    try {
      await apiRequest(`/doctors/${resetDoctor.id}/reset-password`, 'POST')
      setMessage(`Contraseña reiniciada para ${resetDoctor.email}.`)
      setResetDoctor(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reiniciar la contraseña')
    } finally {
      setResetting(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Administrar doctores
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Agrega nuevos doctores al sistema de agenda.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nombre del doctor"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="Correo"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Especialidad"
            select
            value={specialtyId}
            onChange={(event) => setSpecialtyId(event.target.value)}
          >
            {specialties.map((specialty) => (
              <MenuItem key={specialty.id} value={specialty.id}>
                {specialty.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Celular"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <TextField
            label="Numero de cedula"
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={canEditPatients}
                onChange={(event) => setCanEditPatients(event.target.checked)}
              />
            }
            label="Permitir editar pacientes"
          />
          <FormControlLabel
            control={
              <Switch
                checked={canManageVisits}
                onChange={(event) => setCanManageVisits(event.target.checked)}
              />
            }
            label="Permitir consultas"
          />
          <TextField
            label="Unidad"
            select
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
          >
            {visibleUnits.map((unit) => (
              <MenuItem key={unit.id} value={unit.id}>
                {unit.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleAdd} disabled={!name.trim() || !email.trim()}>
            Agregar doctor
          </Button>
          <Typography variant="caption" color="text.secondary">
            Se creará un usuario con contraseña temporal definida en el backend.
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Doctores actuales</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Doctor</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Especialidad</TableCell>
                <TableCell>Celular</TableCell>
                <TableCell>Numero de cedula</TableCell>
                <TableCell>Pacientes</TableCell>
                <TableCell>Consultas</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell>{doctor.name}</TableCell>
                  <TableCell>{doctor.email ?? '-'}</TableCell>
                  <TableCell>
                    {specialties.find((specialty) => specialty.id === doctor.specialtyId)?.name ?? '-'}
                  </TableCell>
                  <TableCell>{doctor.phone ?? '-'}</TableCell>
                  <TableCell>{doctor.licenseNumber ?? '-'}</TableCell>
                  <TableCell>{doctor.canEditPatients ? 'Si' : 'No'}</TableCell>
                  <TableCell>{doctor.canManageVisits ? 'Si' : 'No'}</TableCell>
                  <TableCell>{visibleUnits.find((unit) => unit.id === doctor.unitId)?.name ?? 'Unidad'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditingDoctor(doctor)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setResetDoctor(doctor)}
                      disabled={!doctor.email}
                      title="Reiniciar contraseña"
                    >
                      <LockResetIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteDoctor(doctor)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </Paper>

      <Dialog open={Boolean(editingDoctor)} onClose={() => setEditingDoctor(null)} fullWidth maxWidth="md">
        <DialogTitle>Editar doctor</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre del doctor"
              value={editingDoctor?.name ?? ''}
              onChange={(event) =>
                setEditingDoctor((prev) => (prev ? { ...prev, name: event.target.value } : prev))
              }
            />
            <TextField
              label="Correo"
              type="email"
              value={editingDoctor?.email ?? ''}
              onChange={(event) =>
                setEditingDoctor((prev) =>
                  prev ? { ...prev, email: event.target.value } : prev,
                )
              }
            />
            <TextField
              label="Especialidad"
              select
              value={editingDoctor?.specialtyId ?? ''}
              onChange={(event) =>
                setEditingDoctor((prev) =>
                  prev ? { ...prev, specialtyId: event.target.value } : prev,
                )
              }
            >
              {specialties.map((specialty) => (
                <MenuItem key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Celular"
              value={editingDoctor?.phone ?? ''}
              onChange={(event) =>
                setEditingDoctor((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
              }
            />
            <TextField
              label="Numero de cedula"
              value={editingDoctor?.licenseNumber ?? ''}
              onChange={(event) =>
                setEditingDoctor((prev) =>
                  prev ? { ...prev, licenseNumber: event.target.value } : prev,
                )
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editingDoctor?.canEditPatients ?? true}
                  onChange={(event) =>
                    setEditingDoctor((prev) =>
                      prev ? { ...prev, canEditPatients: event.target.checked } : prev,
                    )
                  }
                />
              }
              label="Permitir editar pacientes"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editingDoctor?.canManageVisits ?? true}
                  onChange={(event) =>
                    setEditingDoctor((prev) =>
                      prev ? { ...prev, canManageVisits: event.target.checked } : prev,
                    )
                  }
                />
              }
              label="Permitir consultas"
            />
            <TextField
              label="Unidad"
              select
              value={editingDoctor?.unitId ?? ''}
              onChange={(event) =>
                setEditingDoctor((prev) => (prev ? { ...prev, unitId: event.target.value } : prev))
              }
            >
              {visibleUnits.map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.name}
                </MenuItem>
              ))}
            </TextField>
            {editingDoctor && (
              <>
                <DoctorScheduleManager doctorId={editingDoctor.id} />
                <DoctorBlockedTimeManager doctorId={editingDoctor.id} />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingDoctor(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={!editingDoctor?.name.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(resetDoctor)} onClose={() => setResetDoctor(null)} fullWidth maxWidth="xs">
        <DialogTitle>¿Reiniciar contraseña?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se asignará la contraseña temporal al doctor y deberá cambiarla al iniciar sesión.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDoctor(null)} disabled={resetting}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={resetting}>
            Reiniciar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteDoctor)} onClose={() => setDeleteDoctor(null)} fullWidth maxWidth="xs">
        <DialogTitle>¿Eliminar doctor?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se eliminarán sus pacientes y citas relacionadas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDoctor(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteDoctor) {
                removeDoctor(deleteDoctor.id)
              }
              setDeleteDoctor(null)
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AdminDoctors
