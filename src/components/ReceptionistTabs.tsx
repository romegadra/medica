import { Box, Tab, Tabs } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'

const tabPaths = ['/reception', '/reception/patients', '/reception/doctor-blocks']

function ReceptionistTabs() {
  const { pathname } = useLocation()
  const value = tabPaths.includes(pathname) ? pathname : '/reception'

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
        <Tab component={Link} to="/reception" value="/reception" label="Agenda" />
        <Tab component={Link} to="/reception/patients" value="/reception/patients" label="Pacientes" />
        <Tab
          component={Link}
          to="/reception/doctor-blocks"
          value="/reception/doctor-blocks"
          label="Horarios bloqueados"
        />
      </Tabs>
    </Box>
  )
}

export default ReceptionistTabs
