import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import defaultLogo from '../assets/medflow-logo.svg'

function About() {
  return (
    <Stack spacing={4}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
          gap: 4,
          alignItems: 'center',
          minHeight: { md: '62vh' },
        }}
      >
        <Box>
          <Box
            component="img"
            src={defaultLogo}
            alt="MedFlow"
            sx={{ width: 220, maxWidth: '100%', mb: 3 }}
          />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 2 }}>
            MedFlow
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 640 }}>
            Plataforma de agenda y operación para clínicas, consultorios y profesionales de salud.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button component={Link} to="/login" variant="contained">
              Iniciar sesión
            </Button>
            <Button component="a" href="mailto:contacto@medflow.center" variant="outlined">
              Contacto
            </Button>
          </Stack>
        </Box>

        <Paper sx={{ p: 3 }} elevation={2}>
          <Stack spacing={2}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              Qué hacemos
            </Typography>
            <Typography color="text.secondary">
              MedFlow ayuda a administrar citas médicas, pacientes, doctores, unidades,
              recepción y seguimiento clínico en un solo sistema.
            </Typography>
            <Divider />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Funciones principales
            </Typography>
            <Typography color="text.secondary">
              Agenda por doctor, control de horarios disponibles, bloqueo de horarios,
              gestión de pacientes, roles por unidad y notificaciones transaccionales.
            </Typography>
            <Divider />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Operación en México
            </Typography>
            <Typography color="text.secondary">
              El sistema está diseñado inicialmente para clínicas y consultorios en México.
            </Typography>
            <Divider />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Contacto
            </Typography>
            <Box>
              <Typography color="text.secondary">MedFlow</Typography>
              <Typography color="text.secondary">México</Typography>
              <Typography color="text.secondary">Correo: contacto@medflow.center</Typography>
              <Typography color="text.secondary">Sitio web: https://medflow.center</Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}

export default About
