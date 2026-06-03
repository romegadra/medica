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
import UploadIcon from '@mui/icons-material/Upload'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'
import type { Unit } from '../data/types'
import { readSmallImage } from '../utils/images'

function AdminUnits() {
  const { role, unitId } = useAuth()
  const { units, addUnit, updateUnit, removeUnit } = useData()
  const canManageUnits = role === 'superadmin' || (role === 'admin' && !unitId)
  const [name, setName] = useState('')
  const [type, setType] = useState<'clinic' | 'individual'>('clinic')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [adminName, setAdminName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [imageError, setImageError] = useState<string | null>(null)
  const [unitSearch, setUnitSearch] = useState('')
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deleteUnit, setDeleteUnit] = useState<Unit | null>(null)
  const filteredUnits = useMemo(() => {
    const normalized = unitSearch.trim().toLowerCase()
    if (!normalized) return units
    return units.filter((unit) => unit.name.toLowerCase().includes(normalized))
  }, [unitSearch, units])

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addUnit({
      id: `unit-${Date.now()}`,
      name: trimmed,
      type,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      adminName: adminName.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
    })
    setName('')
    setType('clinic')
    setAddress('')
    setPhone('')
    setAdminName('')
    setLogoUrl('')
  }

  const handleEditSave = () => {
    if (!editingUnit) return
    const trimmed = editingUnit.name.trim()
    if (!trimmed) return
    updateUnit({
      ...editingUnit,
      name: trimmed,
      address: editingUnit.address?.trim() || undefined,
      phone: editingUnit.phone?.trim() || undefined,
      adminName: editingUnit.adminName?.trim() || undefined,
      logoUrl: editingUnit.logoUrl?.trim() || undefined,
    })
    setEditingUnit(null)
  }

  const handleDelete = () => {
    if (!deleteUnit) return
    removeUnit(deleteUnit.id)
    setDeleteUnit(null)
  }

  const handleLogoFile = async (file: File | undefined, target: 'new' | 'edit') => {
    if (!file) return
    try {
      const dataUrl = await readSmallImage(file)
      if (target === 'new') {
        setLogoUrl(dataUrl)
      } else {
        setEditingUnit((prev) => (prev ? { ...prev, logoUrl: dataUrl } : prev))
      }
      setImageError(null)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'No se pudo cargar la imagen.')
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Administrar unidades
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea, edita o elimina unidades.
        </Typography>
      </Box>

      {canManageUnits && (
        <Paper sx={{ p: 3 }} elevation={2}>
          <Stack spacing={2}>
            <TextField
              label="Nombre de la unidad"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <TextField
              label="Tipo"
              select
              value={type}
              onChange={(event) => setType(event.target.value as 'clinic' | 'individual')}
            >
              <MenuItem value="clinic">Clínica</MenuItem>
              <MenuItem value="individual">Individual</MenuItem>
            </TextField>
            <TextField
              label="Dirección"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
            <TextField
              label="Teléfono"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            <TextField
              label="Admin"
              value={adminName}
              onChange={(event) => setAdminName(event.target.value)}
            />
            <TextField
              label="URL del logotipo"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="https://..."
            />
            <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
              Subir logotipo
              <input
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => void handleLogoFile(event.target.files?.[0], 'new')}
              />
            </Button>
            {imageError && (
              <Typography variant="caption" color="error">
                {imageError}
              </Typography>
            )}
            {logoUrl && (
              <Box
                component="img"
                src={logoUrl}
                alt="Vista previa del logotipo"
                sx={{ maxHeight: 72, maxWidth: '100%', objectFit: 'contain', alignSelf: 'flex-start' }}
              />
            )}
            <Button variant="contained" onClick={handleAdd} disabled={!name.trim()}>
              Agregar unidad
            </Button>
          </Stack>
        </Paper>
      )}

      <Paper sx={{ p: { xs: 2, md: 3 }, overflow: 'hidden' }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Unidades actuales</Typography>
          <TextField
            label="Buscar por nombre"
            value={unitSearch}
            onChange={(event) => setUnitSearch(event.target.value)}
            size="small"
            sx={{ maxWidth: 360 }}
          />
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Logo</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>{unit.name}</TableCell>
                    <TableCell>{unit.type === 'clinic' ? 'Clínica' : 'Individual'}</TableCell>
                    <TableCell>{unit.address ?? '-'}</TableCell>
                    <TableCell>{unit.phone ?? '-'}</TableCell>
                    <TableCell>{unit.adminName ?? '-'}</TableCell>
                    <TableCell>
                      {unit.logoUrl ? (
                        <Box
                          component="img"
                          src={unit.logoUrl}
                          alt={unit.name}
                          sx={{ maxHeight: 32, maxWidth: 96, objectFit: 'contain' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setEditingUnit(unit)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {canManageUnits && (
                        <IconButton size="small" onClick={() => setDeleteUnit(unit)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUnits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant="body2" color="text.secondary">
                        No hay unidades con ese nombre.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Stack>
      </Paper>

      <Dialog open={Boolean(editingUnit)} onClose={() => setEditingUnit(null)} fullWidth maxWidth="xs">
        <DialogTitle>Editar unidad</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre de la unidad"
              value={editingUnit?.name ?? ''}
              onChange={(event) =>
                setEditingUnit((prev) => (prev ? { ...prev, name: event.target.value } : prev))
              }
            />
            <TextField
              label="Tipo"
              select
              value={editingUnit?.type ?? 'clinic'}
              onChange={(event) =>
                setEditingUnit((prev) =>
                  prev ? { ...prev, type: event.target.value as 'clinic' | 'individual' } : prev,
                )
              }
            >
              <MenuItem value="clinic">Clínica</MenuItem>
              <MenuItem value="individual">Individual</MenuItem>
            </TextField>
            <TextField
              label="Dirección"
              value={editingUnit?.address ?? ''}
              onChange={(event) =>
                setEditingUnit((prev) => (prev ? { ...prev, address: event.target.value } : prev))
              }
            />
            <TextField
              label="Teléfono"
              value={editingUnit?.phone ?? ''}
              onChange={(event) =>
                setEditingUnit((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
              }
            />
            <TextField
              label="Admin"
              value={editingUnit?.adminName ?? ''}
              onChange={(event) =>
                setEditingUnit((prev) => (prev ? { ...prev, adminName: event.target.value } : prev))
              }
            />
            <TextField
              label="URL del logotipo"
              value={editingUnit?.logoUrl ?? ''}
              onChange={(event) =>
                setEditingUnit((prev) => (prev ? { ...prev, logoUrl: event.target.value } : prev))
              }
              placeholder="https://..."
            />
            <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
              Subir logotipo
              <input
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => void handleLogoFile(event.target.files?.[0], 'edit')}
              />
            </Button>
            {imageError && (
              <Typography variant="caption" color="error">
                {imageError}
              </Typography>
            )}
            {editingUnit?.logoUrl && (
              <Box
                component="img"
                src={editingUnit.logoUrl}
                alt={editingUnit.name}
                sx={{ maxHeight: 72, maxWidth: '100%', objectFit: 'contain', alignSelf: 'flex-start' }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingUnit(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={!editingUnit?.name.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteUnit)} onClose={() => setDeleteUnit(null)} fullWidth maxWidth="xs">
        <DialogTitle>¿Eliminar unidad?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se eliminará la unidad seleccionada.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUnit(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AdminUnits
