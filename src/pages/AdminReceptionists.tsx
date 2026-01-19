import {
  Box,
  Button,
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
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useState } from 'react'
import { useData } from '../data/DataContext'
import type { Receptionist } from '../data/types'

function AdminReceptionists() {
  const { units, receptionists, addReceptionist, updateReceptionist, removeReceptionist } = useData()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const [editingReceptionist, setEditingReceptionist] = useState<Receptionist | null>(null)
  const [deleteReceptionist, setDeleteReceptionist] = useState<Receptionist | null>(null)

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed || !unitId) return
    addReceptionist({
      id: `rec-${Date.now()}`,
      name: trimmed,
      address: address.trim(),
      phone: phone.trim(),
      unitId,
    })
    setName('')
    setAddress('')
    setPhone('')
  }

  const handleEditSave = () => {
    if (!editingReceptionist) return
    const trimmed = editingReceptionist.name.trim()
    if (!trimmed) return
    updateReceptionist({ ...editingReceptionist, name: trimmed })
    setEditingReceptionist(null)
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Administrar recepcionistas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea, edita o elimina recepcionistas.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <TextField
            label="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="Direccion"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
          <TextField
            label="Celular"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
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
            Agregar recepcionista
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Recepcionistas actuales</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Recepcionista</TableCell>
                <TableCell>Direccion</TableCell>
                <TableCell>Celular</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receptionists.map((receptionist) => (
                <TableRow key={receptionist.id}>
                  <TableCell>{receptionist.name}</TableCell>
                  <TableCell>{receptionist.address}</TableCell>
                  <TableCell>{receptionist.phone}</TableCell>
                  <TableCell>{units.find((unit) => unit.id === receptionist.unitId)?.name ?? 'Unidad'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditingReceptionist(receptionist)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteReceptionist(receptionist)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </Paper>

      <Dialog
        open={Boolean(editingReceptionist)}
        onClose={() => setEditingReceptionist(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Editar recepcionista</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={editingReceptionist?.name ?? ''}
              onChange={(event) =>
                setEditingReceptionist((prev) => (prev ? { ...prev, name: event.target.value } : prev))
              }
            />
            <TextField
              label="Direccion"
              value={editingReceptionist?.address ?? ''}
              onChange={(event) =>
                setEditingReceptionist((prev) =>
                  prev ? { ...prev, address: event.target.value } : prev,
                )
              }
            />
            <TextField
              label="Celular"
              value={editingReceptionist?.phone ?? ''}
              onChange={(event) =>
                setEditingReceptionist((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
              }
            />
            <TextField
              label="Unidad"
              select
              value={editingReceptionist?.unitId ?? ''}
              onChange={(event) =>
                setEditingReceptionist((prev) => (prev ? { ...prev, unitId: event.target.value } : prev))
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
          <Button onClick={() => setEditingReceptionist(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={!editingReceptionist?.name.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteReceptionist)}
        onClose={() => setDeleteReceptionist(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>¿Eliminar recepcionista?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se eliminará la recepcionista seleccionada.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteReceptionist(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteReceptionist) {
                removeReceptionist(deleteReceptionist.id)
              }
              setDeleteReceptionist(null)
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AdminReceptionists
