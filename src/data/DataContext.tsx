import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type {
  Appointment,
  Constraints,
  Doctor,
  DoctorBlockedTime,
  DoctorSchedule,
  Patient,
  Receptionist,
  Specialty,
  SpecialtyTemplate,
  Unit,
  VisitEntry,
} from './types'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'

type DataState = {
  doctors: Doctor[]
  doctorSchedules: DoctorSchedule[]
  doctorBlockedTimes: DoctorBlockedTime[]
  patients: Patient[]
  units: Unit[]
  receptionists: Receptionist[]
  specialties: Specialty[]
  specialtyTemplates: SpecialtyTemplate[]
  visits: VisitEntry[]
  loading: boolean
  error: string | null
  refresh: () => void
  loadPatientsForDoctor: (doctorId: string) => Promise<void>
  addSpecialty: (specialty: Specialty) => void
  updateSpecialty: (specialty: Specialty) => void
  removeSpecialty: (id: string) => void
  addUnit: (unit: Unit) => void
  updateUnit: (unit: Unit) => void
  removeUnit: (id: string) => void
  addReceptionist: (receptionist: Receptionist) => void
  updateReceptionist: (receptionist: Receptionist) => void
  removeReceptionist: (id: string) => void
  addVisit: (visit: VisitEntry) => void
  addSpecialtyTemplate: (template: SpecialtyTemplate) => void
  updateSpecialtyTemplate: (template: SpecialtyTemplate) => void
  removeSpecialtyTemplate: (id: string) => void
  appointments: Appointment[]
  constraints: Constraints
  addDoctor: (doctor: Doctor) => Promise<Doctor>
  updateDoctor: (doctor: Doctor) => Promise<Doctor>
  removeDoctor: (id: string) => void
  addDoctorSchedule: (schedule: DoctorSchedule) => void
  updateDoctorSchedule: (schedule: DoctorSchedule) => void
  removeDoctorSchedule: (id: string) => void
  addDoctorBlockedTime: (block: DoctorBlockedTime) => Promise<{ ok: boolean; reason?: string }>
  removeDoctorBlockedTime: (id: string) => Promise<{ ok: boolean; reason?: string }>
  addPatient: (patient: Patient) => Promise<Patient>
  updatePatient: (patient: Patient) => Promise<Patient>
  removePatient: (id: string) => void
  addAppointment: (appointment: Appointment) => Promise<{ ok: boolean; reason?: string }>
  updateAppointment: (appointment: Appointment) => Promise<{ ok: boolean; reason?: string }>
  cancelAppointment: (id: string, reason?: string) => Promise<{ ok: boolean; reason?: string }>
  removeAppointment: (id: string) => void
  updateConstraints: (next: Constraints) => Promise<Constraints>
}

const DataContext = createContext<DataState | undefined>(undefined)

function overlaps(a: Appointment, b: Appointment) {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end)
}

function overlapsBlock(appointment: Appointment, block: DoctorBlockedTime) {
  if (block.recurrenceType === 'weekly') {
    if (block.dayOfWeek === undefined || !block.startTime || !block.endTime) return false
    const start = new Date(appointment.start)
    const end = new Date(appointment.end)
    if (start.getDay() !== block.dayOfWeek || end.getDay() !== block.dayOfWeek) return false
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    return startMinutes < timeToMinutes(block.endTime) && timeToMinutes(block.startTime) < endMinutes
  }
  return new Date(appointment.start) < new Date(block.end) && new Date(block.start) < new Date(appointment.end)
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { token, role, doctorId } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [constraints, setConstraints] = useState<Constraints>({
    startHour: 8,
    endHour: 20,
    slotMinutes: 30,
    allowOverlap: false,
  })
  const [unitList, setUnitList] = useState<Unit[]>([])
  const [doctorList, setDoctorList] = useState<Doctor[]>([])
  const [doctorScheduleList, setDoctorScheduleList] = useState<DoctorSchedule[]>([])
  const [doctorBlockedTimeList, setDoctorBlockedTimeList] = useState<DoctorBlockedTime[]>([])
  const [patientList, setPatientList] = useState<Patient[]>([])
  const [receptionistList, setReceptionistList] = useState<Receptionist[]>([])
  const [visitList, setVisitList] = useState<VisitEntry[]>([])
  const [templateList, setTemplateList] = useState<SpecialtyTemplate[]>([])
  const [specialtyList, setSpecialtyList] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPatientsForDoctor = useCallback(async (nextDoctorId: string) => {
    if (!nextDoctorId) return
    const loaded = await apiRequest<Patient[]>(
      `/patients?doctorId=${encodeURIComponent(nextDoctorId)}`,
    )
    setPatientList((prev) => [
      ...prev.filter((patient) => patient.doctorId !== nextDoctorId),
      ...loaded,
    ])
  }, [])

  const refresh = useCallback(() => {
    void (async () => {
      if (!token || !role) {
        setUnitList([])
        setDoctorList([])
        setDoctorScheduleList([])
        setDoctorBlockedTimeList([])
        setPatientList([])
        setReceptionistList([])
        setSpecialtyList([])
        setTemplateList([])
        setAppointments([])
        setVisitList([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const shouldLoadPatients = role === 'doctor' && doctorId
        const [
          unitsResponse,
          doctorsResponse,
          doctorSchedulesResponse,
          doctorBlockedTimesResponse,
          patientsResponse,
          receptionistsResponse,
          specialtiesResponse,
          templatesResponse,
          appointmentsResponse,
          visitsResponse,
          settingsResponse,
        ] = await Promise.all([
          apiRequest<Unit[]>('/units'),
          apiRequest<Doctor[]>('/doctors'),
          apiRequest<DoctorSchedule[]>('/doctor-schedules'),
          apiRequest<DoctorBlockedTime[]>('/doctor-blocks'),
          shouldLoadPatients
            ? apiRequest<Patient[]>(`/patients?doctorId=${encodeURIComponent(doctorId)}`)
            : Promise.resolve([]),
          apiRequest<Receptionist[]>('/receptionists'),
          apiRequest<Specialty[]>('/specialties'),
          apiRequest<SpecialtyTemplate[]>('/templates'),
          apiRequest<Appointment[]>('/appointments'),
          apiRequest<VisitEntry[]>('/visits'),
          apiRequest<Constraints>('/settings'),
        ])

        setUnitList(unitsResponse)
        setDoctorList(doctorsResponse)
        setDoctorScheduleList(doctorSchedulesResponse)
        setDoctorBlockedTimeList(doctorBlockedTimesResponse)
        setPatientList(patientsResponse)
        setReceptionistList(receptionistsResponse)
        setSpecialtyList(specialtiesResponse)
        setTemplateList(templatesResponse)
        setAppointments(appointmentsResponse)
        setVisitList(visitsResponse)
        setConstraints(settingsResponse)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    })()
  }, [doctorId, role, token])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo<DataState>(
    () => ({
      doctors: doctorList,
      doctorSchedules: doctorScheduleList,
      doctorBlockedTimes: doctorBlockedTimeList,
      patients: patientList,
      units: unitList,
      receptionists: receptionistList,
      specialties: specialtyList,
      specialtyTemplates: templateList,
      visits: visitList,
      loading,
      error,
      refresh,
      loadPatientsForDoctor,
      addSpecialty: (specialty) => {
        void (async () => {
          const created = await apiRequest<Specialty>('/specialties', 'POST', specialty)
          setSpecialtyList((prev) => [...prev, created])
        })()
      },
      updateSpecialty: (specialty) => {
        void (async () => {
          const updated = await apiRequest<Specialty>(
            `/specialties/${specialty.id}`,
            'PUT',
            specialty,
          )
          setSpecialtyList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        })()
      },
      removeSpecialty: (id) => {
        void (async () => {
          await apiRequest<void>(`/specialties/${id}`, 'DELETE')
          setSpecialtyList((prev) => prev.filter((item) => item.id !== id))
          setTemplateList((prev) => prev.filter((item) => item.specialtyId !== id))
        })()
      },
      addUnit: (unit) => {
        void (async () => {
          const created = await apiRequest<Unit>('/units', 'POST', unit)
          setUnitList((prev) => [...prev, created])
        })()
      },
      updateUnit: (unit) => {
        void (async () => {
          const updated = await apiRequest<Unit>(`/units/${unit.id}`, 'PUT', unit)
          setUnitList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        })()
      },
      removeUnit: (id) => {
        void (async () => {
          await apiRequest<void>(`/units/${id}`, 'DELETE')
          const affectedDoctorIds = doctorList
            .filter((doctor) => doctor.unitId === id)
            .map((doctor) => doctor.id)
          setUnitList((prev) => prev.filter((item) => item.id !== id))
          setDoctorList((prev) => prev.filter((item) => item.unitId !== id))
          setPatientList((prev) => prev.filter((item) => !affectedDoctorIds.includes(item.doctorId)))
          setAppointments((prev) => prev.filter((item) => !affectedDoctorIds.includes(item.doctorId)))
          setReceptionistList((prev) => prev.filter((item) => item.unitId !== id))
          setVisitList((prev) => prev.filter((item) => !affectedDoctorIds.includes(item.doctorId)))
          setDoctorScheduleList((prev) => prev.filter((item) => !affectedDoctorIds.includes(item.doctorId)))
          setDoctorBlockedTimeList((prev) => prev.filter((item) => !affectedDoctorIds.includes(item.doctorId)))
        })()
      },
      addReceptionist: (receptionist) => {
        void (async () => {
          const created = await apiRequest<Receptionist>('/receptionists', 'POST', receptionist)
          setReceptionistList((prev) => [...prev, created])
        })()
      },
      updateReceptionist: (receptionist) => {
        void (async () => {
          const updated = await apiRequest<Receptionist>(
            `/receptionists/${receptionist.id}`,
            'PUT',
            receptionist,
          )
          setReceptionistList((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item)),
          )
        })()
      },
      removeReceptionist: (id) => {
        void (async () => {
          await apiRequest<void>(`/receptionists/${id}`, 'DELETE')
          setReceptionistList((prev) => prev.filter((item) => item.id !== id))
        })()
      },
      addVisit: (visit) => {
        void (async () => {
          const created = await apiRequest<VisitEntry>('/visits', 'POST', visit)
          setVisitList((prev) => [created, ...prev])
        })()
      },
      addSpecialtyTemplate: (template) => {
        void (async () => {
          const created = await apiRequest<SpecialtyTemplate>('/templates', 'POST', template)
          setTemplateList((prev) => [...prev, created])
        })()
      },
      updateSpecialtyTemplate: (template) => {
        void (async () => {
          const updated = await apiRequest<SpecialtyTemplate>(
            `/templates/${template.id}`,
            'PUT',
            template,
          )
          setTemplateList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        })()
      },
      removeSpecialtyTemplate: (id) => {
        void (async () => {
          await apiRequest<void>(`/templates/${id}`, 'DELETE')
          setTemplateList((prev) => prev.filter((item) => item.id !== id))
        })()
      },
      appointments,
      constraints,
      addDoctor: async (doctor) => {
        const created = await apiRequest<Doctor>('/doctors', 'POST', doctor)
        setDoctorList((prev) => [...prev, created])
        return created
      },
      updateDoctor: async (doctor) => {
        const updated = await apiRequest<Doctor>(`/doctors/${doctor.id}`, 'PUT', doctor)
        setDoctorList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        return updated
      },
      removeDoctor: (id) => {
        void (async () => {
          await apiRequest<void>(`/doctors/${id}`, 'DELETE')
          setDoctorList((prev) => prev.filter((item) => item.id !== id))
          setPatientList((prev) => prev.filter((item) => item.doctorId !== id))
          setAppointments((prev) => prev.filter((item) => item.doctorId !== id))
          setVisitList((prev) => prev.filter((item) => item.doctorId !== id))
          setDoctorScheduleList((prev) => prev.filter((item) => item.doctorId !== id))
          setDoctorBlockedTimeList((prev) => prev.filter((item) => item.doctorId !== id))
        })()
      },
      addDoctorSchedule: (schedule) => {
        void (async () => {
          const created = await apiRequest<DoctorSchedule>('/doctor-schedules', 'POST', schedule)
          setDoctorScheduleList((prev) => [...prev, created])
        })()
      },
      updateDoctorSchedule: (schedule) => {
        void (async () => {
          const updated = await apiRequest<DoctorSchedule>(
            `/doctor-schedules/${schedule.id}`,
            'PUT',
            schedule,
          )
          setDoctorScheduleList((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item)),
          )
        })()
      },
      removeDoctorSchedule: (id) => {
        void (async () => {
          await apiRequest<void>(`/doctor-schedules/${id}`, 'DELETE')
          setDoctorScheduleList((prev) => prev.filter((item) => item.id !== id))
        })()
      },
      addDoctorBlockedTime: async (block) => {
        try {
          const created = await apiRequest<DoctorBlockedTime>('/doctor-blocks', 'POST', block)
          setDoctorBlockedTimeList((prev) => [...prev, created])
          return { ok: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error al bloquear horario'
          return { ok: false, reason: message }
        }
      },
      removeDoctorBlockedTime: async (id) => {
        try {
          await apiRequest<void>(`/doctor-blocks/${id}`, 'DELETE')
          setDoctorBlockedTimeList((prev) => prev.filter((item) => item.id !== id))
          return { ok: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error al desbloquear horario'
          return { ok: false, reason: message }
        }
      },
      addPatient: async (patient) => {
        const created = await apiRequest<Patient>('/patients', 'POST', patient)
        setPatientList((prev) => [...prev.filter((item) => item.id !== created.id), created])
        return created
      },
      updatePatient: async (patient) => {
        const updated = await apiRequest<Patient>(`/patients/${patient.id}`, 'PUT', patient)
        setPatientList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        return updated
      },
      removePatient: (id) => {
        void (async () => {
          await apiRequest<void>(`/patients/${id}`, 'DELETE')
          setPatientList((prev) => prev.filter((item) => item.id !== id))
          setAppointments((prev) => prev.filter((item) => item.patientId !== id))
          setVisitList((prev) => prev.filter((item) => item.patientId !== id))
        })()
      },
      addAppointment: async (appointment) => {
        if (!constraints.allowOverlap) {
          const conflict = appointments.some(
            (existing) =>
              existing.status !== 'cancelled' &&
              existing.doctorId === appointment.doctorId && overlaps(existing, appointment),
          )
          if (conflict) {
            return { ok: false, reason: 'Traslape con una cita existente.' }
          }
        }
        const blocked = doctorBlockedTimeList.some(
          (block) => block.doctorId === appointment.doctorId && overlapsBlock(appointment, block),
        )
        if (blocked) {
          return { ok: false, reason: 'La cita se cruza con un horario bloqueado.' }
        }
        try {
          const created = await apiRequest<Appointment>('/appointments', 'POST', appointment)
          setAppointments((prev) => [...prev, created])
          return { ok: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error al crear cita'
          const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined
          if (status === 409) {
            return { ok: false, reason: 'Traslape con una cita existente.' }
          }
          return { ok: false, reason: message }
        }
      },
      updateAppointment: async (appointment) => {
        if (!constraints.allowOverlap) {
          const conflict = appointments.some(
            (existing) =>
              existing.status !== 'cancelled' &&
              existing.id !== appointment.id &&
              existing.doctorId === appointment.doctorId &&
              overlaps(existing, appointment),
          )
          if (conflict) {
            return { ok: false, reason: 'Traslape con una cita existente.' }
          }
        }
        const blocked = doctorBlockedTimeList.some(
          (block) => block.doctorId === appointment.doctorId && overlapsBlock(appointment, block),
        )
        if (blocked) {
          return { ok: false, reason: 'La cita se cruza con un horario bloqueado.' }
        }
        try {
          const updated = await apiRequest<Appointment>(
            `/appointments/${appointment.id}`,
            'PUT',
            appointment,
          )
          setAppointments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
          return { ok: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error al actualizar cita'
          const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined
          if (status === 409) {
            return { ok: false, reason: 'Traslape con una cita existente.' }
          }
          return { ok: false, reason: message }
        }
      },
      cancelAppointment: async (id, reason) => {
        try {
          const updated = await apiRequest<Appointment>(`/appointments/${id}/cancel`, 'POST', {
            reason,
          })
          setAppointments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
          return { ok: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error al cancelar cita'
          return { ok: false, reason: message }
        }
      },
      removeAppointment: (id) => {
        void (async () => {
          await apiRequest<void>(`/appointments/${id}`, 'DELETE')
          setAppointments((prev) => prev.filter((item) => item.id !== id))
        })()
      },
      updateConstraints: async (next) => {
        const updated = await apiRequest<Constraints>('/settings', 'PUT', next)
        setConstraints(updated)
        return updated
      },
    }),
    [
      appointments,
      constraints,
      unitList,
      doctorList,
      doctorScheduleList,
      doctorBlockedTimeList,
      patientList,
      receptionistList,
      visitList,
      templateList,
      specialtyList,
      loading,
      error,
      refresh,
      loadPatientsForDoctor,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) {
    throw new Error('useData must be used within DataProvider')
  }
  return ctx
}
