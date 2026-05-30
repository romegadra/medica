import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'

export type Role = 'superadmin' | 'admin' | 'receptionist' | 'doctor'

type AuthState = {
  role: Role | null
  doctorId: string | null
  unitId: string | null
  receptionistId: string | null
  token: string | null
  mustChangePassword: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  loginReceptionist: (receptionistId: string, unitId: string) => void
  loginDoctor: (doctorId: string) => void
  markPasswordChanged: () => void
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const storageRoleKey = 'med.role'
const storageDoctorKey = 'med.doctorId'
const storageUnitKey = 'med.unitId'
const storageReceptionistKey = 'med.receptionistId'
const storageTokenKey = 'med.token'
const storageMustChangeKey = 'med.mustChangePassword'
const authStorageKeys = [
  storageRoleKey,
  storageDoctorKey,
  storageUnitKey,
  storageReceptionistKey,
  storageTokenKey,
  storageMustChangeKey,
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [unitId, setUnitId] = useState<string | null>(null)
  const [receptionistId, setReceptionistId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(storageRoleKey) as Role | null
    if (stored === 'superadmin' || stored === 'admin' || stored === 'receptionist') {
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
    const storedMustChange = window.localStorage.getItem(storageMustChangeKey)
    if (storedMustChange === 'true') {
      setMustChangePassword(true)
    }
  }, [])

  const value = useMemo(
    () => ({
      role,
      doctorId,
      unitId,
      receptionistId,
      token,
      mustChangePassword,
      login: async (email: string, password: string) => {
        authStorageKeys.forEach((key) => window.localStorage.removeItem(key))
        setRole(null)
        setDoctorId(null)
        setUnitId(null)
        setReceptionistId(null)
        setToken(null)
        setMustChangePassword(false)

        try {
          const response = await apiRequest<{
            token: string
            role: Role
            doctorId?: string | null
            unitId?: string | null
            receptionistId?: string | null
            mustChangePassword?: boolean
          }>('/auth/login', 'POST', { email, password }, '')
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
          if (response.receptionistId) {
            window.localStorage.setItem(storageReceptionistKey, response.receptionistId)
          } else {
            window.localStorage.removeItem(storageReceptionistKey)
          }
          if (response.mustChangePassword) {
            window.localStorage.setItem(storageMustChangeKey, 'true')
          } else {
            window.localStorage.removeItem(storageMustChangeKey)
          }
          setRole(response.role)
          setDoctorId(response.doctorId ?? null)
          setUnitId(response.unitId ?? null)
          setReceptionistId(response.receptionistId ?? null)
          setToken(response.token)
          setMustChangePassword(Boolean(response.mustChangePassword))
          return { ok: true }
        } catch (err) {
          const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined
          const message =
            status === 401
              ? 'Correo o contraseña incorrectos.'
              : err instanceof Error
                ? err.message
                : 'Error de autenticación'
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
      markPasswordChanged: () => {
        window.localStorage.removeItem(storageMustChangeKey)
        setMustChangePassword(false)
      },
      logout: () => {
        window.localStorage.removeItem(storageRoleKey)
        window.localStorage.removeItem(storageDoctorKey)
        window.localStorage.removeItem(storageUnitKey)
        window.localStorage.removeItem(storageReceptionistKey)
        window.localStorage.removeItem(storageTokenKey)
        window.localStorage.removeItem(storageMustChangeKey)
        setRole(null)
        setDoctorId(null)
        setUnitId(null)
        setReceptionistId(null)
        setToken(null)
        setMustChangePassword(false)
      },
    }),
    [role, doctorId, unitId, receptionistId, token, mustChangePassword],
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
