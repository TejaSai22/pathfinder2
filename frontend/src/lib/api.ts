import axios from 'axios'

export type User = {
  id: number
  name: string
  email: string
  role: 'student' | 'employer' | 'advisor' | 'admin'
}

const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function me(): Promise<User | null> {
  try {
    const { data } = await api.get<User>('/auth/me')
    return data
  } catch (err: any) {
    if (err?.response?.status === 401) return null
    throw err
  }
}

export async function login(params: { email: string; password: string }): Promise<User> {
  const { data } = await api.post<User>('/auth/login', params)
  return data
}

export async function register(params: {
  name: string
  email: string
  password: string
  role?: User['role']
}): Promise<User> {
  const { data } = await api.post<User>('/auth/register', {
    ...params,
    role: params.role || 'student',
  })
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
