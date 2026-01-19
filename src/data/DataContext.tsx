import { createContext, useContext, useMemo, useState } from 'react'
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
import {
  appointments as seedAppointments,
  constraints as seedConstraints,
  doctors,
  patients,
  receptionists,
  specialties,
  specialtyTemplates,
  units,
  visits,
} from './seed'

type DataState = {
  doctors: Doctor[]
  patients: Patient[]
  units: Unit[]
  receptionists: Receptionist[]
  specialties: Specialty[]
  specialtyTemplates: SpecialtyTemplate[]
  visits: VisitEntry[]
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
  addAppointment: (appointment: Appointment) => { ok: boolean; reason?: string }
  updateAppointment: (appointment: Appointment) => { ok: boolean; reason?: string }
  removeAppointment: (id: string) => void
  updateConstraints: (next: Constraints) => void
}

const DataContext = createContext<DataState | undefined>(undefined)

function overlaps(a: Appointment, b: Appointment) {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end)
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(seedAppointments)
  const [constraints, setConstraints] = useState<Constraints>(seedConstraints)
  const [unitList, setUnitList] = useState<Unit[]>(units)
  const [doctorList, setDoctorList] = useState<Doctor[]>(doctors)
  const [patientList, setPatientList] = useState<Patient[]>(patients)
  const [receptionistList, setReceptionistList] = useState<Receptionist[]>(receptionists)
  const [visitList, setVisitList] = useState<VisitEntry[]>(visits)
  const [templateList, setTemplateList] = useState<SpecialtyTemplate[]>(specialtyTemplates)

  const value = useMemo<DataState>(
    () => ({
      doctors: doctorList,
      patients: patientList,
      units: unitList,
      receptionists: receptionistList,
      specialties,
      specialtyTemplates: templateList,
      visits: visitList,
      addUnit: (unit) => {
        setUnitList((prev) => [...prev, unit])
      },
      updateUnit: (unit) => {
        setUnitList((prev) => prev.map((item) => (item.id === unit.id ? unit : item)))
      },
      removeUnit: (id) => {
        const affectedDoctorIds = doctorList.filter((doctor) => doctor.unitId === id).map((doctor) => doctor.id)
        setUnitList((prev) => prev.filter((item) => item.id !== id))
        setDoctorList((prev) => prev.filter((item) => item.unitId !== id))
        setPatientList((prev) => prev.filter((item) => !affectedDoctorIds.includes(item.doctorId)))
        setAppointments((prev) => prev.filter((item) => !affectedDoctorIds.includes(item.doctorId)))
        setReceptionistList((prev) => prev.filter((item) => item.unitId !== id))
        setVisitList((prev) => prev.filter((item) => !affectedDoctorIds.includes(item.doctorId)))
      },
      addReceptionist: (receptionist) => {
        setReceptionistList((prev) => [...prev, receptionist])
      },
      updateReceptionist: (receptionist) => {
        setReceptionistList((prev) =>
          prev.map((item) => (item.id === receptionist.id ? receptionist : item)),
        )
      },
      removeReceptionist: (id) => {
        setReceptionistList((prev) => prev.filter((item) => item.id !== id))
      },
      addVisit: (visit) => {
        setVisitList((prev) => [...prev, visit])
      },
      addSpecialtyTemplate: (template) => {
        setTemplateList((prev) => [...prev, template])
      },
      updateSpecialtyTemplate: (template) => {
        setTemplateList((prev) => prev.map((item) => (item.id === template.id ? template : item)))
      },
      removeSpecialtyTemplate: (id) => {
        setTemplateList((prev) => prev.filter((item) => item.id !== id))
      },
      appointments,
      constraints,
      addDoctor: (doctor) => {
        setDoctorList((prev) => [...prev, doctor])
      },
      updateDoctor: (doctor) => {
        setDoctorList((prev) => prev.map((item) => (item.id === doctor.id ? doctor : item)))
      },
      removeDoctor: (id) => {
        setDoctorList((prev) => prev.filter((item) => item.id !== id))
        setPatientList((prev) => prev.filter((item) => item.doctorId !== id))
        setAppointments((prev) => prev.filter((item) => item.doctorId !== id))
        setVisitList((prev) => prev.filter((item) => item.doctorId !== id))
      },
      addPatient: (patient) => {
        setPatientList((prev) => [...prev, patient])
      },
      updatePatient: (patient) => {
        setPatientList((prev) => prev.map((item) => (item.id === patient.id ? patient : item)))
      },
      removePatient: (id) => {
        setPatientList((prev) => prev.filter((item) => item.id !== id))
        setAppointments((prev) => prev.filter((item) => item.patientId !== id))
        setVisitList((prev) => prev.filter((item) => item.patientId !== id))
      },
      addAppointment: (appointment) => {
        if (!constraints.allowOverlap) {
          const conflict = appointments.some(
            (existing) =>
              existing.doctorId === appointment.doctorId && overlaps(existing, appointment),
          )
          if (conflict) {
            return { ok: false, reason: 'Traslape con una cita existente.' }
          }
        }
        setAppointments((prev) => [...prev, appointment])
        return { ok: true }
      },
      updateAppointment: (appointment) => {
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
        setAppointments((prev) => prev.map((item) => (item.id === appointment.id ? appointment : item)))
        return { ok: true }
      },
      removeAppointment: (id) => {
        setAppointments((prev) => prev.filter((item) => item.id !== id))
      },
      updateConstraints: (next) => {
        setConstraints(next)
      },
    }),
    [appointments, constraints, unitList, doctorList, patientList, receptionistList, visitList, templateList],
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
