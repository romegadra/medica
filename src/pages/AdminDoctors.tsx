import {
  Box,
  Button,
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
import { useEffect, useState } from 'react'
import { useData } from '../data/DataContext'
import type { Doctor } from '../data/types'

function AdminDoctors() {
  const { doctors, addDoctor, updateDoctor, removeDoctor, units, specialties } = useData()
  const [name, setName] = useState('')
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id ?? '')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [canEditPatients, setCanEditPatients] = useState(true)
  const [canManageVisits, setCanManageVisits] = useState(true)
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [deleteDoctor, setDeleteDoctor] = useState<Doctor | null>(null)

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (!unitId) return
    addDoctor({
      id: `doc-${Date.now()}`,
      name: trimmed,
      unitId,
      specialtyId: specialtyId || undefined,
      phone: phone.trim() || undefined,
      licenseNumber: licenseNumber.trim() || undefined,
      canEditPatients,
      canManageVisits,
    })
    setName('')
    setSpecialtyId(specialties[0]?.id ?? '')
    setPhone('')
    setLicenseNumber('')
    setCanEditPatients(true)
    setCanManageVisits(true)
  }

  useEffect(() => {
    if (!specialtyId && specialties.length > 0) {
      setSpecialtyId(specialties[0].id)
    }
  }, [specialties, specialtyId])

  useEffect(() => {
    if (!unitId && units.length > 0) {
      setUnitId(units[0].id)
    }
  }, [units, unitId])

  const handleEditSave = () => {
    if (!editingDoctor) return
    const trimmed = editingDoctor.name.trim()
    if (!trimmed) return
    updateDoctor({ ...editingDoctor, name: trimmed })
    setEditingDoctor(null)
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
          <TextField
            label="Nombre del doctor"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            {units.map((unit) => (
              <MenuItem key={unit.id} value={unit.id}>
                {unit.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleAdd} disabled={!name.trim()}>
            Agregar doctor
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Doctores actuales</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Doctor</TableCell>
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
              {doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell>{doctor.name}</TableCell>
                  <TableCell>
                    {specialties.find((specialty) => specialty.id === doctor.specialtyId)?.name ?? '-'}
                  </TableCell>
                  <TableCell>{doctor.phone ?? '-'}</TableCell>
                  <TableCell>{doctor.licenseNumber ?? '-'}</TableCell>
                  <TableCell>{doctor.canEditPatients ? 'Si' : 'No'}</TableCell>
                  <TableCell>{doctor.canManageVisits ? 'Si' : 'No'}</TableCell>
                  <TableCell>{units.find((unit) => unit.id === doctor.unitId)?.name ?? 'Unidad'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditingDoctor(doctor)}>
                      <EditIcon fontSize="small" />
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

      <Dialog open={Boolean(editingDoctor)} onClose={() => setEditingDoctor(null)} fullWidth maxWidth="xs">
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
              {units.map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingDoctor(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={!editingDoctor?.name.trim()}>
            Guardar
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
