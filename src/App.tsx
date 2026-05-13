import { Alert, AppBar, Box, Button, Container, LinearProgress, Toolbar, Typography } from '@mui/material'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'
import AdminDoctors from './pages/AdminDoctors'
import AdminDoctorSchedules from './pages/AdminDoctorSchedules'
import AdminUsers from './pages/AdminUsers'
import AdminUnits from './pages/AdminUnits'
import AdminReceptionists from './pages/AdminReceptionists'
import AdminTemplates from './pages/AdminTemplates'
import AdminSpecialties from './pages/AdminSpecialties'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorPatients from './pages/DoctorPatients'
import DoctorReports from './pages/DoctorReports'
import DoctorSchedules from './pages/DoctorSchedules'
import DoctorVisits from './pages/DoctorVisits'
import ChangePassword from './pages/ChangePassword'
import Login from './pages/Login'
import ReceptionistDashboard from './pages/ReceptionistDashboard'
import ReceptionistCancelledAppointments from './pages/ReceptionistCancelledAppointments'
import ReceptionistPatients from './pages/ReceptionistPatients'
import { useData } from './data/DataContext'
import logo from './assets/MN-Logo.jpg'

function App() {
  const { role, logout, mustChangePassword } = useAuth()
  const { loading, error, refresh } = useData()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ pt: { xs: 0.5, md: 1 } }}>
        <Toolbar
          sx={{
            alignItems: 'center',
            minHeight: { xs: 84, md: 64 },
            position: 'relative',
            justifyContent: 'center',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 1, md: 0 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box component="img" src={logo} alt="Medflow" sx={{ height: { xs: 48, md: 80 } }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Agenda Médica
            </Typography>
          </Box>
          {role && (
            <Box
              sx={{
                position: { xs: 'static', md: 'absolute' },
                right: { md: 0 },
                display: 'flex',
                gap: 1,
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
              <ProtectedRoute allowed={['admin', 'superadmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowed={['admin', 'superadmin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute allowed={['admin', 'superadmin']}>
                <AdminDoctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctor-schedules"
            element={
              <ProtectedRoute allowed={['admin', 'superadmin']}>
                <AdminDoctorSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/units"
            element={
              <ProtectedRoute allowed={['admin', 'superadmin']}>
                <AdminUnits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/receptionists"
            element={
              <ProtectedRoute allowed={['admin', 'superadmin']}>
                <AdminReceptionists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <ProtectedRoute allowed={['admin', 'superadmin']}>
                <AdminTemplates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/specialties"
            element={
              <ProtectedRoute allowed={['admin', 'superadmin']}>
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
            path="/doctor/schedules"
            element={
              <ProtectedRoute allowed={['doctor']}>
                <DoctorSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/reports"
            element={
              <ProtectedRoute allowed={['doctor']}>
                <DoctorReports />
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
            path="/reception/cancelled-appointments"
            element={
              <ProtectedRoute allowed={['receptionist']}>
                <ReceptionistCancelledAppointments />
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
