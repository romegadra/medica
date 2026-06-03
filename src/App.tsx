import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LogoutIcon from '@mui/icons-material/Logout'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import UploadIcon from '@mui/icons-material/Upload'
import { useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminAudit from './pages/AdminAudit'
import About from './pages/About'
import AdminDashboard from './pages/AdminDashboard'
import AdminDoctorBlocks from './pages/AdminDoctorBlocks'
import AdminDoctors from './pages/AdminDoctors'
import AdminUnits from './pages/AdminUnits'
import AdminReceptionists from './pages/AdminReceptionists'
import AdminTemplates from './pages/AdminTemplates'
import AdminSpecialties from './pages/AdminSpecialties'
import AdminUsers from './pages/AdminUsers'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorPatients from './pages/DoctorPatients'
import DoctorVisits from './pages/DoctorVisits'
import ChangePassword from './pages/ChangePassword'
import Login from './pages/Login'
import ReceptionistDashboard from './pages/ReceptionistDashboard'
import ReceptionistDoctorBlocks from './pages/ReceptionistDoctorBlocks'
import ReceptionistPatients from './pages/ReceptionistPatients'
import { useData } from './data/DataContext'
import defaultLogo from './assets/medflow-logo.svg'
import type { Doctor } from './data/types'
import { getInitials, readSmallImage } from './utils/images'

function App() {
  const { role, logout, mustChangePassword, unitId, doctorId } = useAuth()
  const { loading, error, refresh, units, doctors, updateDoctor } = useData()
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileDraft, setProfileDraft] = useState<Doctor | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const currentUnitId = unitId ?? doctors.find((doctor) => doctor.id === doctorId)?.unitId
  const currentUnit = units.find((unit) => unit.id === currentUnitId)
  const currentDoctor = doctors.find((doctor) => doctor.id === doctorId)
  const logoUrl = currentUnit?.logoUrl
  const roleHomePath = role === 'admin' || role === 'superadmin' ? '/admin' : role === 'receptionist' ? '/reception' : '/doctor'
  const roleLabel = role === 'admin' || role === 'superadmin' ? 'Admin' : role === 'receptionist' ? 'Recepción' : 'Doctor'

  const closeMenu = () => setMenuAnchor(null)
  const handleLogout = () => {
    closeMenu()
    logout()
  }
  const openProfile = () => {
    closeMenu()
    setProfileDraft(currentDoctor ?? null)
    setProfileError(null)
    setProfileOpen(true)
  }
  const handleProfileImageChange = async (file?: File) => {
    if (!file) return
    try {
      const dataUrl = await readSmallImage(file)
      setProfileDraft((prev) => (prev ? { ...prev, profileImageUrl: dataUrl } : prev))
      setProfileError(null)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'No se pudo cargar la imagen.')
    }
  }
  const handleProfileSave = () => {
    if (!profileDraft?.name.trim()) {
      setProfileError('El nombre es requerido.')
      return
    }
    updateDoctor({
      ...profileDraft,
      name: profileDraft.name.trim(),
      phone: profileDraft.phone?.trim() || undefined,
      profileImageUrl: profileDraft.profileImageUrl || undefined,
    })
    setProfileOpen(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ pt: { xs: 1, sm: 1.5 } }}>
        <Toolbar
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            position: 'relative',
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 0 },
            minHeight: { xs: 64, sm: 80 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
            <Box
              component="img"
              src={logoUrl || defaultLogo}
              alt={currentUnit?.name ?? 'MedFlow'}
              sx={{
                height: { xs: 52, sm: 72 },
                width: 'auto',
                maxWidth: { xs: 210, sm: 260 },
                objectFit: 'contain',
                flexShrink: 1,
              }}
            />
          </Box>
          {role && (
            <>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  position: 'absolute',
                  right: { xs: 12, sm: 24 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                {role === 'doctor' && (
                  <Avatar
                    src={currentDoctor?.profileImageUrl}
                    alt={currentDoctor?.name ?? 'Doctor'}
                    sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}
                  >
                    {getInitials(currentDoctor?.name)}
                  </Avatar>
                )}
                <IconButton
                  aria-label="Abrir menú"
                  aria-controls={menuAnchor ? 'app-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuAnchor ? 'true' : undefined}
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
              </Stack>
              <Menu
                id="app-menu"
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={closeMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem component={Link} to={roleHomePath} onClick={closeMenu}>
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{roleLabel}</ListItemText>
                </MenuItem>
                {role === 'doctor' && (
                  <MenuItem onClick={openProfile}>
                    <ListItemIcon>
                      <AccountCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mi perfil</ListItemText>
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Salir</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>
      {loading && <LinearProgress />}
      <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 6 }, px: { xs: 1.5, sm: 3 } }}>
        {error && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={refresh}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute allowed={['superadmin', 'admin', 'receptionist', 'doctor']}>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowed={['superadmin', 'admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute allowed={['superadmin', 'admin']}>
                <AdminDoctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowed={['superadmin', 'admin']}>
                <AdminAudit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctor-blocks"
            element={
              <ProtectedRoute allowed={['superadmin', 'admin']}>
                <AdminDoctorBlocks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/units"
            element={
              <ProtectedRoute allowed={['superadmin', 'admin']}>
                <AdminUnits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowed={['superadmin', 'admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/receptionists"
            element={
              <ProtectedRoute allowed={['superadmin', 'admin']}>
                <AdminReceptionists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <ProtectedRoute allowed={['superadmin', 'admin']}>
                <AdminTemplates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/specialties"
            element={
              <ProtectedRoute allowed={['superadmin', 'admin']}>
                <AdminSpecialties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reception"
            element={
              <ProtectedRoute allowed={['receptionist']}>
                <ReceptionistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reception/doctor-blocks"
            element={
              <ProtectedRoute allowed={['receptionist']}>
                <ReceptionistDoctorBlocks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowed={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute allowed={['doctor']}>
                <DoctorPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/visits"
            element={
              <ProtectedRoute allowed={['doctor']}>
                <DoctorVisits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reception/patients"
            element={
              <ProtectedRoute allowed={['receptionist']}>
                <ReceptionistPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              role ? (
                <Navigate
                  to={
                    mustChangePassword
                      ? '/change-password'
                      : role === 'admin' || role === 'superadmin'
                        ? '/admin'
                        : role === 'receptionist'
                          ? '/reception'
                          : '/doctor'
                  }
                  replace
                />
              ) : (
                <About />
              )
            }
          />
        </Routes>
      </Container>
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Mi perfil</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {profileError && <Alert severity="warning">{profileError}</Alert>}
            <Avatar
              src={profileDraft?.profileImageUrl}
              alt={profileDraft?.name ?? 'Doctor'}
              sx={{ width: 88, height: 88, bgcolor: 'primary.main', alignSelf: 'center', fontSize: 28 }}
            >
              {getInitials(profileDraft?.name)}
            </Avatar>
            <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
              Subir foto
              <input
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => void handleProfileImageChange(event.target.files?.[0])}
              />
            </Button>
            {profileDraft?.profileImageUrl && (
              <Button
                variant="text"
                color="inherit"
                onClick={() => setProfileDraft((prev) => (prev ? { ...prev, profileImageUrl: undefined } : prev))}
              >
                Quitar foto
              </Button>
            )}
            <TextField
              label="Nombre"
              value={profileDraft?.name ?? ''}
              onChange={(event) =>
                setProfileDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))
              }
            />
            <TextField
              label="Teléfono"
              value={profileDraft?.phone ?? ''}
              onChange={(event) =>
                setProfileDraft((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleProfileSave} disabled={!profileDraft?.name.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default App
