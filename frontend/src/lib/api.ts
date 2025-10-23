import axios from 'axios'

export type User = {
  id: number
  name: string
  email: string
  role: 'student' | 'employer' | 'advisor' | 'admin'
}

export type Role = User['role']

export type Job = {
  id: number
  title: string
  location?: string | null
  datePosted?: string
  skills?: string[]
  description?: string
}

export type JobsListResponse = {
  items: Job[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type Profile = {
  educationHistory: string
  interests: string
  skills: string[]
}

export type CareerRecommendation = { title: string; score: number }
export type JobRecommendation = { id: number; title: string; score: number }

export type StudentApplication = {
  applicationID: number
  jobID: number
  jobTitle: string | null
  status: string
  appliedAt: string
}

export type Applicant = {
  applicationID: number
  studentName: string
  status: string
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

// Jobs (public listing)
export async function listJobs(params?: {
  q?: string
  location?: string
  skills?: string[]
  page?: number
  pageSize?: number
}): Promise<JobsListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.q) searchParams.set('q', params.q)
  if (params?.location) searchParams.set('location', params.location)
  if (params?.skills && params.skills.length) searchParams.set('skills', params.skills.join(','))
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))
  const { data } = await api.get<JobsListResponse>(`/api/jobs?${searchParams.toString()}`)
  return data
}

// Student profile
export async function getStudentProfile(): Promise<Profile> {
  const { data } = await api.get<Profile>('/api/student/profile')
  return data
}

export async function updateStudentProfile(profile: Profile): Promise<void> {
  await api.put('/api/student/profile', profile)
}

// Recommendations
export async function getCareerRecommendations(): Promise<CareerRecommendation[]> {
  const { data } = await api.get<CareerRecommendation[]>('/api/student/recommendations/careers')
  return data
}

export async function getJobRecommendations(): Promise<JobRecommendation[]> {
  const { data } = await api.get<JobRecommendation[]>('/api/student/recommendations/jobs')
  return data
}

// Applications (student)
export async function applyToJob(jobID: number): Promise<{ applicationID: number; status: string }> {
  const { data } = await api.post<{ applicationID: number; status: string }>('/api/applications', { jobID })
  return data
}

export async function listStudentApplications(): Promise<StudentApplication[]> {
  const { data } = await api.get<StudentApplication[]>('/api/student/applications')
  return data
}

// Employer endpoints
export async function createJob(params: {
  title: string
  description: string
  location?: string
  salary?: string
  skills?: string[]
}): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>('/api/employer/jobs', params)
  return data
}

export async function listEmployerJobs(): Promise<Job[]> {
  const { data } = await api.get<Job[]>('/api/employer/jobs')
  return data
}

export async function getEmployerJob(jobId: number): Promise<Job> {
  const { data } = await api.get<Job>(`/api/employer/jobs/${jobId}`)
  return data
}

export async function listApplicants(jobId: number): Promise<Applicant[]> {
  const { data } = await api.get<Applicant[]>(`/api/employer/jobs/${jobId}/applicants`)
  return data
}

export async function updateApplicationStatus(appId: number, status: string): Promise<void> {
  await api.put(`/api/employer/applications/${appId}`, { status })
}

// Admin
export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/api/admin/users')
  return data
}
