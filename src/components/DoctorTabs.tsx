import { Box, Tab, Tabs } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'

function DoctorTabs() {
  const { pathname } = useLocation()
  const { doctorId } = useAuth()
  const { doctors } = useData()
  const doctor = doctors.find((item) => item.id === doctorId)
  const canEditPatients = doctor?.canEditPatients ?? true
  const canManageVisits = doctor?.canManageVisits ?? true
  const visiblePaths = [
    '/doctor',
    ...(canEditPatients ? ['/doctor/patients'] : []),
    ...(canManageVisits ? ['/doctor/visits'] : []),
  ]
  const value = visiblePaths.includes(pathname) ? pathname : '/doctor'

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
        <Tab component={Link} to="/doctor" value="/doctor" label="Agenda" />
        {canEditPatients && <Tab component={Link} to="/doctor/patients" value="/doctor/patients" label="Pacientes" />}
        {canManageVisits && <Tab component={Link} to="/doctor/visits" value="/doctor/visits" label="Consultas" />}
      </Tabs>
    </Box>
  )
}

export default DoctorTabs
