import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useEffect, useState } from 'react'
import { useData } from '../data/DataContext'
import type { SpecialtyField, SpecialtyFieldType, SpecialtyTemplate } from '../data/types'

function AdminTemplates() {
  const {
    specialtyTemplates,
    addSpecialtyTemplate,
    updateSpecialtyTemplate,
    removeSpecialtyTemplate,
    specialties,
  } = useData()
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id ?? '')
  const [editingTemplate, setEditingTemplate] = useState<SpecialtyTemplate | null>(null)
  const [deleteTemplate, setDeleteTemplate] = useState<SpecialtyTemplate | null>(null)
  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldType, setFieldType] = useState<SpecialtyFieldType>('text')
  const [fieldRequired, setFieldRequired] = useState(false)

  const handleAddTemplate = () => {
    addSpecialtyTemplate({
      id: `tpl-${Date.now()}`,
      specialtyId,
      fields: [],
    })
    setSpecialtyId(specialties[0]?.id ?? '')
  }

  useEffect(() => {
    if (!specialtyId && specialties.length > 0) {
      setSpecialtyId(specialties[0].id)
    }
  }, [specialties, specialtyId])

  const handleSaveTemplate = () => {
    if (!editingTemplate) return
    updateSpecialtyTemplate({ ...editingTemplate })
    setEditingTemplate(null)
  }

  const handleAddField = () => {
    if (!editingTemplate) return
    const trimmed = fieldLabel.trim()
    if (!trimmed) return
    const nextField: SpecialtyField = {
      id: `field-${Date.now()}`,
      label: trimmed,
      type: fieldType,
      required: fieldRequired,
    }
    setEditingTemplate((prev) =>
      prev ? { ...prev, fields: [...prev.fields, nextField] } : prev,
    )
    setFieldLabel('')
    setFieldType('text')
    setFieldRequired(false)
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Plantillas por especialidad
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administra las plantillas que controlan los formularios de consulta.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack spacing={2}>
          <TextField
            label="Especialidad"
            select
            value={specialtyId}
            onChange={(event) => setSpecialtyId(event.target.value)}
          >
            {specialties.map((specialty) => (
              <MenuItem key={specialty.id} value={specialty.id}>
                {specialty.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleAddTemplate} disabled={!specialtyId}>
            Agregar plantilla
          </Button>
        </Stack>
      </Paper>

      {specialtyTemplates.map((template) => (
        <Paper key={template.id} sx={{ p: 3 }} elevation={2}>
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">
                {specialties.find((item) => item.id === template.specialtyId)?.name ?? 'Especialidad'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" onClick={() => setEditingTemplate(template)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setDeleteTemplate(template)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
            {template.fields.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Sin campos configurados.
              </Typography>
            ) : (
              template.fields.map((field) => (
                <Typography key={field.id} variant="body2" color="text.secondary">
                  {field.label} ({field.type})
                  {field.required ? ' *' : ''}
                </Typography>
              ))
            )}
          </Stack>
        </Paper>
      ))}

      <Dialog
        open={Boolean(editingTemplate)}
        onClose={() => setEditingTemplate(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar plantilla</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Especialidad"
              select
              value={editingTemplate?.specialtyId ?? ''}
              onChange={(event) =>
                setEditingTemplate((prev) =>
                  prev ? { ...prev, specialtyId: event.target.value } : prev,
                )
              }
            >
              {specialties.map((specialty) => (
                <MenuItem key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="subtitle1">Campos</Typography>
            {editingTemplate?.fields.map((field, index) => (
              <Stack key={field.id} direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Etiqueta"
                  value={field.label}
                  onChange={(event) =>
                    setEditingTemplate((prev) =>
                      prev
                        ? {
                            ...prev,
                            fields: prev.fields.map((item, idx) =>
                              idx === index ? { ...item, label: event.target.value } : item,
                            ),
                          }
                        : prev,
                    )
                  }
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Tipo"
                  select
                  value={field.type}
                  onChange={(event) =>
                    setEditingTemplate((prev) =>
                      prev
                        ? {
                            ...prev,
                            fields: prev.fields.map((item, idx) =>
                              idx === index
                                ? { ...item, type: event.target.value as SpecialtyFieldType }
                                : item,
                            ),
                          }
                        : prev,
                    )
                  }
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="text">Texto</MenuItem>
                  <MenuItem value="textarea">Parrafo</MenuItem>
                  <MenuItem value="number">Numero</MenuItem>
                  <MenuItem value="date">Fecha</MenuItem>
                </TextField>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.required ?? false}
                      onChange={(event) =>
                        setEditingTemplate((prev) =>
                          prev
                            ? {
                                ...prev,
                                fields: prev.fields.map((item, idx) =>
                                  idx === index ? { ...item, required: event.target.checked } : item,
                                ),
                              }
                            : prev,
                        )
                      }
                    />
                  }
                  label="Requerido"
                />
                <Button
                  color="error"
                  onClick={() =>
                    setEditingTemplate((prev) =>
                      prev ? { ...prev, fields: prev.fields.filter((item) => item.id !== field.id) } : prev,
                    )
                  }
                >
                  Quitar
                </Button>
              </Stack>
            ))}
            <Typography variant="subtitle2">Agregar campo</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Etiqueta"
                value={fieldLabel}
                onChange={(event) => setFieldLabel(event.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Tipo"
                select
                value={fieldType}
                onChange={(event) => setFieldType(event.target.value as SpecialtyFieldType)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="text">Texto</MenuItem>
                <MenuItem value="textarea">Parrafo</MenuItem>
                <MenuItem value="number">Numero</MenuItem>
                <MenuItem value="date">Fecha</MenuItem>
              </TextField>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fieldRequired}
                    onChange={(event) => setFieldRequired(event.target.checked)}
                  />
                }
                label="Requerido"
              />
              <Button variant="outlined" onClick={handleAddField} disabled={!fieldLabel.trim()}>
                Agregar
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTemplate(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveTemplate}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTemplate)}
        onClose={() => setDeleteTemplate(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>¿Eliminar plantilla?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se eliminara la plantilla. Las consultas guardadas no se modifican.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTemplate(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteTemplate) {
                removeSpecialtyTemplate(deleteTemplate.id)
              }
              setDeleteTemplate(null)
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AdminTemplates
