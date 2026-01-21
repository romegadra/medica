type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

const baseUrl = import.meta.env.VITE_API_URL ?? 'https://medica-backend-production-a788.up.railway.app/api'
const tokenKey = 'med.token'

export async function apiRequest<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: unknown,
  token?: string,
): Promise<T> {
  const storedToken = token ?? window.localStorage.getItem(tokenKey) ?? undefined
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    const error = new Error(text || response.statusText) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
