type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type ApiError = Error & { status?: number; raw?: string }

const baseUrl = import.meta.env.VITE_API_URL ?? 'https://medica-backend-production-a788.up.railway.app/api'
const tokenKey = 'med.token'
const authStorageKeys = [
  'med.role',
  'med.doctorId',
  'med.unitId',
  'med.receptionistId',
  'med.token',
  'med.mustChangePassword',
]

function parseErrorMessage(text: string) {
  if (!text) return ''
  try {
    const parsed = JSON.parse(text) as { error?: unknown; message?: unknown }
    if (typeof parsed.error === 'string') return parsed.error
    if (typeof parsed.message === 'string') return parsed.message
  } catch {
    return text
  }
  return text
}

function translateError(status: number, text: string) {
  const backendMessage = parseErrorMessage(text)
  if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.'
  if (status === 403) return 'No tienes permiso para realizar esta acción.'
  if (status === 404) return 'No se encontró la información solicitada.'
  if (status === 409) return backendMessage || 'La operación no se puede completar por un conflicto de datos.'
  if (status >= 500) {
    return 'El servidor no respondió correctamente. Si acabamos de actualizar la app, espera un momento e intenta de nuevo.'
  }
  return backendMessage || 'No se pudo completar la operación.'
}

function clearSession() {
  authStorageKeys.forEach((key) => window.localStorage.removeItem(key))
}

export async function apiRequest<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: unknown,
  token?: string,
): Promise<T> {
  const storedToken = token ?? window.localStorage.getItem(tokenKey) ?? undefined
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión o intenta de nuevo en unos minutos.')
  }

  if (!response.ok) {
    const text = await response.text()
    const error = new Error(translateError(response.status, text || response.statusText)) as ApiError
    error.status = response.status
    error.raw = text
    if (response.status === 401) {
      clearSession()
    }
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
