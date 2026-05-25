import { Alert, AppBar, Box, Button, Container, LinearProgress, Toolbar, Typography } from '@mui/material'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminAudit from './pages/AdminAudit'
import AdminDashboard from './pages/AdminDashboard'
import AdminDoctorBlocks from './pages/AdminDoctorBlocks'
import AdminDoctors from './pages/AdminDoctors'
import AdminUnits from './pages/AdminUnits'
import AdminReceptionists from './pages/AdminReceptionists'
import AdminTemplates from './pages/AdminTemplates'
import AdminSpecialties from './pages/AdminSpecialties'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorPatients from './pages/DoctorPatients'
import DoctorVisits from './pages/DoctorVisits'
import ChangePassword from './pages/ChangePassword'
import Login from './pages/Login'
import ReceptionistDashboard from './pages/ReceptionistDashboard'
import ReceptionistDoctorBlocks from './pages/ReceptionistDoctorBlocks'
import ReceptionistPatients from './pages/ReceptionistPatients'
import { useData } from './data/DataContext'
import logo from './assets/MN-Logo.jpg'

function App() {
  const { role, logout, mustChangePassword } = useAuth()
  const { loading, error, refresh } = useData()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ pt: 1 }}>
        <Toolbar sx={{ alignItems: 'center', minHeight: 64, position: 'relative', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box component="img" src={logo} alt="Medflow" sx={{ height: 80 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Agenda Médica
            </Typography>
          </Box>
          {role && (
            <Box sx={{ position: 'absolute', right: 0, display: 'flex', gap: 1 }}>
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
      <Container sx={{ py: { xs: 4, md: 6 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={refresh}>
            {error}
          </Alert>
        )}
        <Routes>
          <Route path="/login" element={<Login />} />
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
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Container>
    </Box>
  )
}

export default App
