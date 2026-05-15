import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { Patient, SpecialtyTemplate, VisitEntry } from '../data/types'

type Props = {
  patient?: Patient
  specialtyName?: string
  template?: SpecialtyTemplate
  visits: VisitEntry[]
}

type Trend = {
  fieldId: string
  label: string
  points: { date: string; value: number }[]
}

const importantFieldPatterns = [
  'diagnostico',
  'diagnóstico',
  'riesgo',
  'critico',
  'crítico',
  'vacuna',
  'enfermedad',
  'procedimiento',
  'diente',
  'medicacion',
  'medicación',
  'plan',
  'nota',
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value))
}

function getSpecialtyFocus(value?: string) {
  const normalized = value?.toLowerCase() ?? ''
  if (normalized.includes('pedia')) {
    return ['Crecimiento', 'Peso y talla', 'Vacunas', 'Enfermedades frecuentes']
  }
  if (normalized.includes('psico')) {
    return ['Notas de sesión', 'Estado emocional', 'Riesgos', 'Plan de seguimiento']
  }
  if (normalized.includes('psiq')) {
    return ['Diagnóstico', 'Medicación', 'Evolución', 'Riesgos']
  }
  if (normalized.includes('dental') || normalized.includes('odonto') || normalized.includes('dent')) {
    return ['Procedimientos', 'Dientes tratados', 'Evolución', 'Próximos pasos']
  }
  return ['Evolución', 'Diagnóstico', 'Tratamiento', 'Seguimiento']
}

function buildTrends(template: SpecialtyTemplate | undefined, visits: VisitEntry[]): Trend[] {
  if (!template) return []
  return template.fields
    .filter((field) => field.type === 'number')
    .map((field) => ({
      fieldId: field.id,
      label: field.label,
      points: visits
        .map((visit) => ({
          date: visit.date,
          value: Number(visit.responses[field.id]),
        }))
        .filter((point) => Number.isFinite(point.value)),
    }))
    .filter((trend) => trend.points.length > 0)
}

function buildImportantNotes(template: SpecialtyTemplate | undefined, visits: VisitEntry[]) {
  if (!template) return []
  const fieldById = new Map(template.fields.map((field) => [field.id, field]))
  return visits
    .flatMap((visit) =>
      Object.entries(visit.responses).map(([fieldId, value]) => ({
        visit,
        field: fieldById.get(fieldId),
        value,
      })),
    )
    .filter(({ field, value }) => {
      if (!field || !value.trim()) return false
      const normalized = `${field.id} ${field.label}`.toLowerCase()
      return importantFieldPatterns.some((pattern) => normalized.includes(pattern))
    })
    .slice(-6)
    .reverse()
}

function TrendChart({ trend }: { trend: Trend }) {
  const values = trend.points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 280
  const height = 88
  const points = trend.points.map((point, index) => {
    const x = trend.points.length === 1 ? width / 2 : (index / (trend.points.length - 1)) * width
    const y = height - ((point.value - min) / range) * (height - 16) - 8
    return { ...point, x, y }
  })
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <Paper sx={{ p: 2 }} elevation={1}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle2">{trend.label}</Typography>
          <Typography variant="body2" color="text.secondary">
            {values[values.length - 1]}
          </Typography>
        </Stack>
        <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: '100%', height: 96 }}>
          <path d={path} fill="none" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round" />
          {points.map((point) => (
            <circle key={`${point.date}-${point.value}`} cx={point.x} cy={point.y} r="4" fill="#2e7d32" />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {formatDate(trend.points[0].date)} - {formatDate(trend.points[trend.points.length - 1].date)}
        </Typography>
      </Stack>
    </Paper>
  )
}

function PatientClinicalSummary({ patient, specialtyName, template, visits }: Props) {
  const orderedVisits = [...visits].sort((first, second) => first.date.localeCompare(second.date))
  const latestVisit = orderedVisits[orderedVisits.length - 1]
  const trends = buildTrends(template, orderedVisits)
  const importantNotes = buildImportantNotes(template, orderedVisits)
  const focus = getSpecialtyFocus(specialtyName)

  return (
    <Paper sx={{ p: 3 }} elevation={2}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="h6">Resumen clínico</Typography>
            <Typography variant="body2" color="text.secondary">
              {patient ? patient.name : 'Selecciona un paciente'} · {specialtyName ?? 'Especialidad'}
            </Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {focus.map((item) => (
              <Chip key={item} label={item} size="small" />
            ))}
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          <Paper sx={{ p: 2 }} elevation={1}>
            <Typography variant="caption" color="text.secondary">
              Consultas
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {orderedVisits.length}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2 }} elevation={1}>
            <Typography variant="caption" color="text.secondary">
              Última consulta
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {latestVisit ? formatDate(latestVisit.date) : '-'}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2 }} elevation={1}>
            <Typography variant="caption" color="text.secondary">
              Campos medibles
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {trends.length}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2 }} elevation={1}>
            <Typography variant="caption" color="text.secondary">
              Alertas / notas
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {importantNotes.length}
            </Typography>
          </Paper>
        </Box>

        {trends.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="subtitle1">Evolución medible</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 2,
              }}
            >
              {trends.slice(0, 4).map((trend) => (
                <TrendChart key={trend.fieldId} trend={trend} />
              ))}
            </Box>
          </Stack>
        )}

        <Stack spacing={1}>
          <Typography variant="subtitle1">Puntos importantes</Typography>
          {importantNotes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aún no hay campos críticos, diagnósticos, vacunas, procedimientos o notas relevantes capturadas.
            </Typography>
          ) : (
            importantNotes.map(({ visit, field, value }) => (
              <Paper key={`${visit.id}-${field?.id}`} sx={{ p: 1.5 }} elevation={0}>
                <Typography variant="subtitle2">
                  {field?.label ?? 'Nota'} · {formatDate(visit.date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {value}
                </Typography>
              </Paper>
            ))
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

export default PatientClinicalSummary
