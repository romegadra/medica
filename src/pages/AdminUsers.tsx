import {
  Alert,
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
import LockResetIcon from '@mui/icons-material/LockReset'
import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'

type AdminRole = 'admin' | 'superadmin'

type AdminUser = {
  id: string
  email: string
  role: AdminRole
  unitId?: string | null
  mustChangePassword: boolean
}

function AdminUsers() {
  const { role, unitId } = useAuth()
  const { units } = useData()
  const canManageAdmins = role === 'superadmin' || (role === 'admin' && !unitId)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [email, setEmail] = useState('')
  const [adminRole, setAdminRole] = useState<AdminRole>('admin')
  const [adminUnitId, setAdminUnitId] = useState(units[0]?.id ?? '')
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
  const [deleteAdmin, setDeleteAdmin] = useState<AdminUser | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminUnitId && units.length > 0) {
      setAdminUnitId(units[0].id)
    }
  }, [adminUnitId, units])

  const loadAdmins = useCallback(async () => {
    if (!canManageAdmins) return
    try {
      setError(null)
      const response = await apiRequest<AdminUser[]>('/users/admins')
      setAdmins(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar administradores.')
    }
  }, [canManageAdmins])

  useEffect(() => {
    void loadAdmins()
  }, [loadAdmins])

  const handleCreate = async () => {
    if (!email.trim()) return
    if (adminRole === 'admin' && !adminUnitId) {
      setError('Selecciona una unidad para el admin.')
      return
    }

    try {
      setError(null)
      setMessage(null)
      const created = await apiRequest<AdminUser>('/users/admins', 'POST', {
        email: email.trim(),
        role: adminRole,
        unitId: adminRole === 'admin' ? adminUnitId : null,
      })
      setAdmins((prev) => [...prev, created])
      setEmail('')
      setAdminRole('admin')
      setAdminUnitId(units[0]?.id ?? '')
      setMessage('Administrador creado con contraseña temporal.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el administrador.')
    }
  }

  const handleEditSave = async () => {
    if (!editingAdmin?.email.trim()) return
    if (editingAdmin.role === 'admin' && !editingAdmin.unitId) {
      setError('Selecciona una unidad para el admin.')
      return
    }

    try {
      setError(null)
      setMessage(null)
      const updated = await apiRequest<AdminUser>(`/users/admins/${editingAdmin.id}`, 'PUT', {
        email: editingAdmin.email.trim(),
        role: editingAdmin.role,
        unitId: editingAdmin.role === 'admin' ? editingAdmin.unitId : null,
      })
      setAdmins((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setEditingAdmin(null)
      setMessage('Administrador actualizado.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el administrador.')
    }
  }

  const handleResetPassword = async (admin: AdminUser) => {
    try {
      setError(null)
      setMessage(null)
      const updated = await apiRequest<AdminUser>(`/users/admins/${admin.id}/reset-password`, 'POST')
      setAdmins((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setMessage(`Contraseña temporal restablecida para ${admin.email}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.')
    }
  }

  const handleDelete = async () => {
    if (!deleteAdmin) return
    try {
      setError(null)
      setMessage(null)
      await apiRequest<void>(`/users/admins/${deleteAdmin.id}`, 'DELETE')
      setAdmins((prev) => prev.filter((item) => item.id !== deleteAdmin.id))
      setDeleteAdmin(null)
      setMessage('Administrador eliminado.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el administrador.')
    }
  }

  if (!canManageAdmins) {
    return (
      <Alert severity="warning">
        Solo un admin master puede crear o modificar administradores de unidad.
      </Alert>
    )
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Administradores
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea admins de unidad o superadmins. Los nuevos usuarios reciben contraseña temporal.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <TextField
            label="Correo"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Tipo de administrador"
            select
            value={adminRole}
            onChange={(event) => setAdminRole(event.target.value as AdminRole)}
          >
            <MenuItem value="admin">Admin de unidad</MenuItem>
            <MenuItem value="superadmin">Admin master</MenuItem>
          </TextField>
          {adminRole === 'admin' && (
            <TextField
              label="Unidad"
              select
              value={adminUnitId}
              onChange={(event) => setAdminUnitId(event.target.value)}
            >
              {units.map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!email.trim() || (adminRole === 'admin' && !adminUnitId)}
          >
            Crear administrador
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, overflow: 'hidden' }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Administradores actuales</Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Correo</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Cambio de contraseña</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{admin.role === 'superadmin' ? 'Admin master' : 'Admin de unidad'}</TableCell>
                    <TableCell>
                      {admin.role === 'superadmin'
                        ? 'Todas'
                        : units.find((unit) => unit.id === admin.unitId)?.name ?? '-'}
                    </TableCell>
                    <TableCell>{admin.mustChangePassword ? 'Pendiente' : 'Actualizada'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setEditingAdmin(admin)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => void handleResetPassword(admin)}>
                        <LockResetIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteAdmin(admin)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Stack>
      </Paper>

      <Dialog open={Boolean(editingAdmin)} onClose={() => setEditingAdmin(null)} fullWidth maxWidth="xs">
        <DialogTitle>Editar administrador</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Correo"
              type="email"
              value={editingAdmin?.email ?? ''}
              onChange={(event) =>
                setEditingAdmin((prev) => (prev ? { ...prev, email: event.target.value } : prev))
              }
            />
            <TextField
              label="Tipo de administrador"
              select
              value={editingAdmin?.role ?? 'admin'}
              onChange={(event) =>
                setEditingAdmin((prev) =>
                  prev ? { ...prev, role: event.target.value as AdminRole } : prev,
                )
              }
            >
              <MenuItem value="admin">Admin de unidad</MenuItem>
              <MenuItem value="superadmin">Admin master</MenuItem>
            </TextField>
            {editingAdmin?.role === 'admin' && (
              <TextField
                label="Unidad"
                select
                value={editingAdmin?.unitId ?? ''}
                onChange={(event) =>
                  setEditingAdmin((prev) =>
                    prev ? { ...prev, unitId: event.target.value } : prev,
                  )
                }
              >
                {units.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingAdmin(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={!editingAdmin?.email.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteAdmin)} onClose={() => setDeleteAdmin(null)} fullWidth maxWidth="xs">
        <DialogTitle>¿Eliminar administrador?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se eliminará el acceso de {deleteAdmin?.email}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAdmin(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AdminUsers
