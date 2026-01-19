import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Role = 'admin' | 'receptionist' | 'doctor'

type AuthState = {
  role: Role | null
  doctorId: string | null
  unitId: string | null
  receptionistId: string | null
  login: (role: Role) => void
  loginReceptionist: (receptionistId: string, unitId: string) => void
  loginDoctor: (doctorId: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const storageRoleKey = 'med.role'
const storageDoctorKey = 'med.doctorId'
const storageUnitKey = 'med.unitId'
const storageReceptionistKey = 'med.receptionistId'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [unitId, setUnitId] = useState<string | null>(null)
  const [receptionistId, setReceptionistId] = useState<string | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(storageRoleKey) as Role | null
    if (stored === 'admin' || stored === 'receptionist') {
      setRole(stored)
    }
    if (stored === 'doctor') {
      setRole('doctor')
      setDoctorId(window.localStorage.getItem(storageDoctorKey))
    }
    if (stored === 'receptionist') {
      setUnitId(window.localStorage.getItem(storageUnitKey))
      setReceptionistId(window.localStorage.getItem(storageReceptionistKey))
    }
  }, [])

  const value = useMemo(
    () => ({
      role,
      doctorId,
      unitId,
      receptionistId,
      login: (nextRole: Role) => {
        window.localStorage.setItem(storageRoleKey, nextRole)
        setRole(nextRole)
        setDoctorId(null)
        setUnitId(null)
        window.localStorage.removeItem(storageDoctorKey)
        window.localStorage.removeItem(storageUnitKey)
        window.localStorage.removeItem(storageReceptionistKey)
        setReceptionistId(null)
      },
      loginReceptionist: (nextReceptionistId: string, nextUnitId: string) => {
        window.localStorage.setItem(storageRoleKey, 'receptionist')
        window.localStorage.setItem(storageUnitKey, nextUnitId)
        window.localStorage.setItem(storageReceptionistKey, nextReceptionistId)
        setRole('receptionist')
        setDoctorId(null)
        setUnitId(nextUnitId)
        setReceptionistId(nextReceptionistId)
      },
      loginDoctor: (nextDoctorId: string) => {
        window.localStorage.setItem(storageRoleKey, 'doctor')
        window.localStorage.setItem(storageDoctorKey, nextDoctorId)
        setRole('doctor')
        setDoctorId(nextDoctorId)
        setUnitId(null)
        window.localStorage.removeItem(storageReceptionistKey)
        setReceptionistId(null)
      },
      logout: () => {
        window.localStorage.removeItem(storageRoleKey)
        window.localStorage.removeItem(storageDoctorKey)
        window.localStorage.removeItem(storageUnitKey)
        window.localStorage.removeItem(storageReceptionistKey)
        setRole(null)
        setDoctorId(null)
        setUnitId(null)
        setReceptionistId(null)
      },
    }),
    [role, doctorId, unitId, receptionistId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
