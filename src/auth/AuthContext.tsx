import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'

export type Role = 'admin' | 'receptionist' | 'doctor'

type AuthState = {
  role: Role | null
  doctorId: string | null
  unitId: string | null
  receptionistId: string | null
  token: string | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  loginReceptionist: (receptionistId: string, unitId: string) => void
  loginDoctor: (doctorId: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const storageRoleKey = 'med.role'
const storageDoctorKey = 'med.doctorId'
const storageUnitKey = 'med.unitId'
const storageReceptionistKey = 'med.receptionistId'
const storageTokenKey = 'med.token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [unitId, setUnitId] = useState<string | null>(null)
  const [receptionistId, setReceptionistId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

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
    const storedToken = window.localStorage.getItem(storageTokenKey)
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const value = useMemo(
    () => ({
      role,
      doctorId,
      unitId,
      receptionistId,
      token,
      login: async (email: string, password: string) => {
        try {
          const response = await apiRequest<{
            token: string
            role: Role
            doctorId?: string | null
            unitId?: string | null
          }>('/auth/login', 'POST', { email, password })
          window.localStorage.setItem(storageRoleKey, response.role)
          window.localStorage.setItem(storageTokenKey, response.token)
          if (response.doctorId) {
            window.localStorage.setItem(storageDoctorKey, response.doctorId)
          } else {
            window.localStorage.removeItem(storageDoctorKey)
          }
          if (response.unitId) {
            window.localStorage.setItem(storageUnitKey, response.unitId)
          } else {
            window.localStorage.removeItem(storageUnitKey)
          }
          window.localStorage.removeItem(storageReceptionistKey)
          setRole(response.role)
          setDoctorId(response.doctorId ?? null)
          setUnitId(response.unitId ?? null)
          setReceptionistId(null)
          setToken(response.token)
          return { ok: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error de autenticación'
          return { ok: false, error: message }
        }
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
        window.localStorage.removeItem(storageTokenKey)
        setRole(null)
        setDoctorId(null)
        setUnitId(null)
        setReceptionistId(null)
        setToken(null)
      },
    }),
    [role, doctorId, unitId, receptionistId, token],
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
