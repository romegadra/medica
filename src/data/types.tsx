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
  notificationsEnabled?: boolean
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
  logoUrl?: string
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
  status?: 'pending' | 'scheduled' | 'confirmed' | 'attended' | 'no_show' | 'cancelled' | 'rescheduled'
  attended?: boolean
  notes?: string
  paymentType?: string
  cancellationReason?: string
  cancelledAt?: string
  reminderSentAt?: string
}

export type DoctorSchedule = {
  id: string
  doctorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export type DoctorBlockedTime = {
  id: string
  doctorId: string
  start: string
  end: string
  reason?: string
  recurrenceType?: 'date' | 'weekly'
  dayOfWeek?: number
  startTime?: string
  endTime?: string
}

export type Constraints = {
  startHour: number
  endHour: number
  slotMinutes: number
  allowOverlap: boolean
  appointmentRemindersEnabled: boolean
  appointmentReminderIntervalMinutes: number
}

export type AuditLog = {
  id: string
  userId?: string
  role?: string
  unitId?: string
  doctorId?: string
  receptionistId?: string
  action: string
  entityType: string
  entityId?: string
  summary?: string
  createdAt: string
}
