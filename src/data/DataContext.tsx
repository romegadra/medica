import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type {
  Appointment,
  Constraints,
  Doctor,
  Patient,
  Receptionist,
  Specialty,
  SpecialtyTemplate,
  Unit,
  VisitEntry,
} from './types'
import { apiRequest } from '../api/client'

type DataState = {
  doctors: Doctor[]
  patients: Patient[]
  units: Unit[]
  receptionists: Receptionist[]
  specialties: Specialty[]
  specialtyTemplates: SpecialtyTemplate[]
  visits: VisitEntry[]
  loading: boolean
  error: string | null
  refresh: () => void
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
  addDoctor: (doctor: Doctor) => void
  updateDoctor: (doctor: Doctor) => void
  removeDoctor: (id: string) => void
  addPatient: (patient: Patient) => void
  updatePatient: (patient: Patient) => void
  removePatient: (id: string) => void
  addAppointment: (appointment: Appointment) => Promise<{ ok: boolean; reason?: string }>
  updateAppointment: (appointment: Appointment) => Promise<{ ok: boolean; reason?: string }>
  removeAppointment: (id: string) => void
  updateConstraints: (next: Constraints) => void
}

const DataContext = createContext<DataState | undefined>(undefined)

function overlaps(a: Appointment, b: Appointment) {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end)
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [constraints, setConstraints] = useState<Constraints>({
    startHour: 8,
    endHour: 20,
    slotMinutes: 30,
    allowOverlap: false,
  })
  const [unitList, setUnitList] = useState<Unit[]>([])
  const [doctorList, setDoctorList] = useState<Doctor[]>([])
  const [patientList, setPatientList] = useState<Patient[]>([])
  const [receptionistList, setReceptionistList] = useState<Receptionist[]>([])
  const [visitList, setVisitList] = useState<VisitEntry[]>([])
  const [templateList, setTemplateList] = useState<SpecialtyTemplate[]>([])
  const [specialtyList, setSpecialtyList] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const [
          unitsResponse,
          doctorsResponse,
          patientsResponse,
          receptionistsResponse,
          specialtiesResponse,
          templatesResponse,
          appointmentsResponse,
          visitsResponse,
        ] = await Promise.all([
          apiRequest<Unit[]>('/units'),
          apiRequest<Doctor[]>('/doctors'),
          apiRequest<Patient[]>('/patients'),
          apiRequest<Receptionist[]>('/receptionists'),
          apiRequest<Specialty[]>('/specialties'),
          apiRequest<SpecialtyTemplate[]>('/templates'),
          apiRequest<Appointment[]>('/appointments'),
          apiRequest<VisitEntry[]>('/visits'),
        ])

        setUnitList(unitsResponse)
        setDoctorList(doctorsResponse)
        setPatientList(patientsResponse)
        setReceptionistList(receptionistsResponse)
        setSpecialtyList(specialtiesResponse)
        setTemplateList(templatesResponse)
        setAppointments(appointmentsResponse)
        setVisitList(visitsResponse)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo<DataState>(
    () => ({
      doctors: doctorList,
      patients: patientList,
      units: unitList,
      receptionists: receptionistList,
      specialties: specialtyList,
      specialtyTemplates: templateList,
      visits: visitList,
      loading,
      error,
      refresh,
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
      addDoctor: (doctor) => {
        void (async () => {
          const created = await apiRequest<Doctor>('/doctors', 'POST', doctor)
          setDoctorList((prev) => [...prev, created])
        })()
      },
      updateDoctor: (doctor) => {
        void (async () => {
          const updated = await apiRequest<Doctor>(`/doctors/${doctor.id}`, 'PUT', doctor)
          setDoctorList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        })()
      },
      removeDoctor: (id) => {
        void (async () => {
          await apiRequest<void>(`/doctors/${id}`, 'DELETE')
          setDoctorList((prev) => prev.filter((item) => item.id !== id))
          setPatientList((prev) => prev.filter((item) => item.doctorId !== id))
          setAppointments((prev) => prev.filter((item) => item.doctorId !== id))
          setVisitList((prev) => prev.filter((item) => item.doctorId !== id))
        })()
      },
      addPatient: (patient) => {
        void (async () => {
          const created = await apiRequest<Patient>('/patients', 'POST', patient)
          setPatientList((prev) => [...prev, created])
        })()
      },
      updatePatient: (patient) => {
        void (async () => {
          const updated = await apiRequest<Patient>(`/patients/${patient.id}`, 'PUT', patient)
          setPatientList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        })()
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
              existing.doctorId === appointment.doctorId && overlaps(existing, appointment),
          )
          if (conflict) {
            return { ok: false, reason: 'Traslape con una cita existente.' }
          }
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
              existing.id !== appointment.id &&
              existing.doctorId === appointment.doctorId &&
              overlaps(existing, appointment),
          )
          if (conflict) {
            return { ok: false, reason: 'Traslape con una cita existente.' }
          }
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
      removeAppointment: (id) => {
        void (async () => {
          await apiRequest<void>(`/appointments/${id}`, 'DELETE')
          setAppointments((prev) => prev.filter((item) => item.id !== id))
        })()
      },
      updateConstraints: (next) => {
        setConstraints(next)
      },
    }),
    [
      appointments,
      constraints,
      unitList,
      doctorList,
      patientList,
      receptionistList,
      visitList,
      templateList,
      specialtyList,
      loading,
      error,
      refresh,
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
