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
import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'

type AdminUser = {
  id: string
  email: string
  role: 'admin' | 'superadmin'
  unitId?: string | null
  mustChangePassword?: boolean
}

function AdminUsers() {
  const { role, unitId } = useAuth()
  const { units } = useData()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [email, setEmail] = useState('')
  const [adminRole, setAdminRole] = useState<'admin' | 'superadmin'>('admin')
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id ?? '')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canManageAdmins = role === 'superadmin' || (role === 'admin' && !unitId)

  const loadUsers = async () => {
    try {
      setError(null)
      const response = await apiRequest<AdminUser[]>('/users/admins')
      setUsers(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los administradores')
    }
  }

  useEffect(() => {
    if (canManageAdmins) void loadUsers()
  }, [canManageAdmins])

  useEffect(() => {
    if (!selectedUnitId && units.length > 0) {
      setSelectedUnitId(units[0].id)
    }
  }, [selectedUnitId, units])

  const handleCreate = async () => {
    if (!email.trim()) return
    if (adminRole === 'admin' && !selectedUnitId) return
    try {
      setError(null)
      const created = await apiRequest<AdminUser>('/users/admins', 'POST', {
        email: email.trim(),
        role: adminRole,
        unitId: adminRole === 'admin' ? selectedUnitId : null,
      })
      setUsers((prev) => [...prev, created])
      setEmail('')
      setMessage(`Admin creado: ${created.email}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el admin')
    }
  }

  const handleEditSave = async () => {
    if (!editingUser) return
    if (editingUser.role === 'admin' && !editingUser.unitId) return
    try {
      setError(null)
      const updated = await apiRequest<AdminUser>(`/users/admins/${editingUser.id}`, 'PUT', {
        email: editingUser.email,
        role: editingUser.role,
        unitId: editingUser.role === 'admin' ? editingUser.unitId : null,
      })
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setEditingUser(null)
      setMessage(`Admin actualizado: ${updated.email}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el admin')
    }
  }

  const handleReset = async (user: AdminUser) => {
    try {
      setError(null)
      await apiRequest(`/users/admins/${user.id}/reset-password`, 'POST')
      setMessage(`Contraseña reiniciada para ${user.email}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reiniciar la contraseña')
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    try {
      setError(null)
      await apiRequest<void>(`/users/admins/${deleteUser.id}`, 'DELETE')
      setUsers((prev) => prev.filter((item) => item.id !== deleteUser.id))
      setDeleteUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el admin')
    }
  }

  if (!canManageAdmins) {
    return <Alert severity="warning">No tienes permiso para administrar usuarios admin.</Alert>
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Administrar admins
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea admins por unidad o superadmins con acceso global.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Correo"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Rol"
            select
            value={adminRole}
            onChange={(event) => setAdminRole(event.target.value as 'admin' | 'superadmin')}
          >
            <MenuItem value="admin">Admin de unidad</MenuItem>
            <MenuItem value="superadmin">Superadmin</MenuItem>
          </TextField>
          {adminRole === 'admin' && (
            <TextField
              label="Unidad"
              select
              value={selectedUnitId}
              onChange={(event) => setSelectedUnitId(event.target.value)}
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
            disabled={!email.trim() || (adminRole === 'admin' && !selectedUnitId)}
          >
            Crear admin
          </Button>
          <Typography variant="caption" color="text.secondary">
            Se creará con la contraseña temporal del backend y deberá cambiarla al iniciar sesión.
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={1}>
          <Typography variant="h6">Admins actuales</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Correo</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role === 'superadmin' ? 'Superadmin' : 'Admin de unidad'}</TableCell>
                  <TableCell>
                    {user.role === 'superadmin'
                      ? 'Todas'
                      : units.find((unit) => unit.id === user.unitId)?.name ?? '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditingUser(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => void handleReset(user)}>
                      <LockResetIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteUser(user)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </Paper>

      <Dialog open={Boolean(editingUser)} onClose={() => setEditingUser(null)} fullWidth maxWidth="xs">
        <DialogTitle>Editar admin</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Correo"
              type="email"
              value={editingUser?.email ?? ''}
              onChange={(event) =>
                setEditingUser((prev) => (prev ? { ...prev, email: event.target.value } : prev))
              }
            />
            <TextField
              label="Rol"
              select
              value={editingUser?.role ?? 'admin'}
              onChange={(event) =>
                setEditingUser((prev) =>
                  prev ? { ...prev, role: event.target.value as 'admin' | 'superadmin' } : prev,
                )
              }
            >
              <MenuItem value="admin">Admin de unidad</MenuItem>
              <MenuItem value="superadmin">Superadmin</MenuItem>
            </TextField>
            {editingUser?.role === 'admin' && (
              <TextField
                label="Unidad"
                select
                value={editingUser.unitId ?? ''}
                onChange={(event) =>
                  setEditingUser((prev) => (prev ? { ...prev, unitId: event.target.value } : prev))
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
          <Button onClick={() => setEditingUser(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={!editingUser?.email.trim() || (editingUser.role === 'admin' && !editingUser.unitId)}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteUser)} onClose={() => setDeleteUser(null)} fullWidth maxWidth="xs">
        <DialogTitle>¿Eliminar admin?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se eliminará el acceso del admin seleccionado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUser(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AdminUsers
