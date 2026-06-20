import type { Patient } from '../data/types'
import { normalizePhone } from './phone'

export function normalizePatientName(name?: string) {
  return (name ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function findDuplicatePatient(
  patients: Patient[],
  input: { doctorId: string; name: string; phone?: string; ignoreId?: string },
) {
  const normalizedName = normalizePatientName(input.name)
  const normalizedPhone = normalizePhone(input.phone)

  return patients.find((patient) => {
    if (patient.id === input.ignoreId || patient.doctorId !== input.doctorId) return false
    if (normalizedPhone && normalizePhone(patient.phone) === normalizedPhone) return true
    return normalizedName.length > 0 && normalizePatientName(patient.name) === normalizedName
  })
}
