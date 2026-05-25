import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import type { AuditLog } from '../data/types'

const actionLabels: Record<string, string> = {
  created: 'Creó',
  updated: 'Editó',
  deleted: 'Eliminó',
  cancelled: 'Canceló',
  rescheduled: 'Reagendó',
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-MX')
}

function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const response = await apiRequest<AuditLog[]>('/audit-logs')
        setLogs(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la auditoría')
      }
    })()
  }, [])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Auditoría
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bitácora de cambios de citas, pacientes y bloqueos de horario.
        </Typography>
      </Box>

      {error && (
        <Paper sx={{ p: 2 }} elevation={2}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3 }} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Acción</TableCell>
              <TableCell>Entidad</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Resumen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatDate(log.createdAt)}</TableCell>
                <TableCell>
                  <Chip label={actionLabels[log.action] ?? log.action} size="small" />
                </TableCell>
                <TableCell>{log.entityType}</TableCell>
                <TableCell>{log.role ?? 'Sistema'}</TableCell>
                <TableCell>{log.summary ?? '-'}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    Sin actividad registrada.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}

export default AdminAudit
