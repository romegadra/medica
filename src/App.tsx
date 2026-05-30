import { Alert, AppBar, Box, Button, Container, LinearProgress, Toolbar } from '@mui/material'
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

function App() {
  const { role, logout, mustChangePassword, unitId, doctorId } = useAuth()
  const { loading, error, refresh, units, doctors } = useData()
  const currentUnitId = unitId ?? doctors.find((doctor) => doctor.id === doctorId)?.unitId
  const currentUnit = units.find((unit) => unit.id === currentUnitId)
  const logoUrl = currentUnit?.logoUrl

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ pt: { xs: 1, sm: 1.5 } }}>
        <Toolbar
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 0 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
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
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexShrink: 0,
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-end' },
              }}
            >
              <Button
                component={Link}
                to={role === 'admin' || role === 'superadmin' ? '/admin' : role === 'receptionist' ? '/reception' : '/doctor'}
              >
                {role === 'admin' || role === 'superadmin' ? 'Admin' : role === 'receptionist' ? 'Recepción' : 'Doctor'}
              </Button>
              <Button onClick={logout} color="inherit">
                Salir
              </Button>
            </Box>
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
    </Box>
  )
}

export default App
