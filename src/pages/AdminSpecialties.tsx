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
import { useState } from 'react'
import { useData } from '../data/DataContext'
import type { Specialty } from '../data/types'

function AdminSpecialties() {
  const { specialties, addSpecialty, updateSpecialty, removeSpecialty } = useData()
  const [name, setName] = useState('')
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null)
  const [deleteSpecialty, setDeleteSpecialty] = useState<Specialty | null>(null)

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addSpecialty({ id: `spec-${Date.now()}`, name: trimmed })
    setName('')
  }

  const handleEditSave = () => {
    if (!editingSpecialty) return
    const trimmed = editingSpecialty.name.trim()
    if (!trimmed) return
    updateSpecialty({ ...editingSpecialty, name: trimmed })
    setEditingSpecialty(null)
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Especialidades
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administra el catalogo de especialidades.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <TextField
            label="Nombre de especialidad"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button variant="contained" onClick={handleAdd} disabled={!name.trim()}>
            Agregar especialidad
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Especialidades actuales</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Especialidad</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {specialties.map((specialty) => (
                <TableRow key={specialty.id}>
                  <TableCell>{specialty.name}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditingSpecialty(specialty)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteSpecialty(specialty)}>
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
        open={Boolean(editingSpecialty)}
        onClose={() => setEditingSpecialty(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Editar especialidad</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre de especialidad"
              value={editingSpecialty?.name ?? ''}
              onChange={(event) =>
                setEditingSpecialty((prev) => (prev ? { ...prev, name: event.target.value } : prev))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingSpecialty(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={!editingSpecialty?.name.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteSpecialty)}
        onClose={() => setDeleteSpecialty(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>¿Eliminar especialidad?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se eliminaran las plantillas asociadas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSpecialty(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteSpecialty) {
                removeSpecialty(deleteSpecialty.id)
              }
              setDeleteSpecialty(null)
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AdminSpecialties
