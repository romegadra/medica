export type Doctor = {
  id: string
  name: string
  email?: string
  unitId: string
  specialtyId?: string
  phone?: string
  licenseNumber?: string
  canEditPatients?: boolean
  canManageVisits?: boolean
}

export type Patient = {
  id: string
  doctorId: string
  name: string
  phone?: string
  address?: string
  historyDate?: string
}

export type Unit = {
  id: string
  name: string
  type: 'clinic' | 'individual'
  address?: string
  phone?: string
  adminName?: string
}

export type SpecialtyFieldType = 'text' | 'textarea' | 'number' | 'date'

export type SpecialtyField = {
  id: string
  label: string
  type: SpecialtyFieldType
  required?: boolean
}

export type SpecialtyTemplate = {
  id: string
  specialtyId: string
  fields: SpecialtyField[]
}

export type VisitEntry = {
  id: string
  doctorId: string
  patientId: string
  date: string
  templateId: string
  responses: Record<string, string>
}

export type Specialty = {
  id: string
  name: string
}

export type Receptionist = {
  id: string
  name: string
  email?: string
  address: string
  phone: string
  unitId: string
}

export type Appointment = {
  id: string
  doctorId: string
  patientId: string
  title: string
  start: string
  end: string
}

export type Constraints = {
  startHour: number
  endHour: number
  slotMinutes: number
  allowOverlap: boolean
}
