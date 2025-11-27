const API_BASE = '/api'

export interface User {
  id: number
  email: string
  role: 'student' | 'employer' | 'advisor'
  created_at: string
  profile?: Profile
  skills?: Skill[]
}

export interface Profile {
  id: number
  user_id: number
  first_name: string
  last_name: string
  headline?: string
  bio?: string
  academic_background?: string
  company_name?: string
  company_description?: string
  location?: string
  avatar_url?: string
}

export interface Skill {
  id: number
  name: string
  is_technical: boolean
  category?: string
}

export interface Job {
  id: number
  employer_id: number
  title: string
  description: string
  location?: string
  salary_min?: number
  salary_max?: number
  job_type?: string
  experience_level?: string
  onet_soc_code?: string
  is_active: boolean
  created_at: string
  updated_at: string
  required_skills: Skill[]
}

export interface JobWithMatch extends Job {
  match_score: number
  matched_technical: string[]
  matched_soft: string[]
  missing_technical: string[]
  missing_soft: string[]
}

export interface Application {
  id: number
  job_id: number
  applicant_id: number
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'accepted'
  cover_letter?: string
  match_score?: number
  created_at: string
  updated_at: string
  job?: Job
  applicant?: User
}

export interface Note {
  id: number
  advisor_id: number
  student_id: number
  content: string
  note_type: string
  created_at: string
  updated_at: string
}

export interface SkillGapData {
  skill: string
  candidate: number
  required: number
  is_technical: boolean
  matched: boolean
}

export interface SkillGapAnalysis {
  overall_score: number
  technical_score: number
  soft_score: number
  matched_technical: string[]
  matched_soft: string[]
  missing_technical: string[]
  missing_soft: string[]
  radar_data: SkillGapData[]
}

export interface UserWithStats extends User {
  avg_match_score?: number
  application_count: number
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }

  return response.json()
}

export const authApi = {
  register: (data: { email: string; password: string; role: string }) =>
    fetchApi<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  
  login: (data: { email: string; password: string; role: string }) =>
    fetchApi<User>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  
  logout: () =>
    fetchApi('/auth/logout', { method: 'POST' }),
  
  me: () =>
    fetchApi<User>('/auth/me'),
}

export const usersApi = {
  getProfile: () =>
    fetchApi<User>('/users/me'),
  
  updateProfile: (data: Partial<Profile>) =>
    fetchApi<Profile>('/users/me/profile', { method: 'PUT', body: JSON.stringify(data) }),
  
  updateSkills: (skillIds: number[]) =>
    fetchApi<Skill[]>('/users/me/skills', { method: 'PUT', body: JSON.stringify(skillIds) }),
  
  getStudents: () =>
    fetchApi<UserWithStats[]>('/users/students'),
  
  getStudent: (studentId: number) =>
    fetchApi<UserWithStats>(`/users/students/${studentId}`),
  
  assignStudent: (studentId: number) =>
    fetchApi(`/users/students/${studentId}/assign`, { method: 'POST' }),
}

export const jobsApi = {
  list: () =>
    fetchApi<JobWithMatch[]>('/jobs'),
  
  getMyJobs: () =>
    fetchApi<Job[]>('/jobs/my-jobs'),
  
  get: (jobId: number) =>
    fetchApi<JobWithMatch>(`/jobs/${jobId}`),
  
  create: (data: Partial<Job> & { required_skill_ids: number[] }) =>
    fetchApi<Job>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (jobId: number, data: Partial<Job> & { required_skill_ids?: number[] }) =>
    fetchApi<Job>(`/jobs/${jobId}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (jobId: number) =>
    fetchApi(`/jobs/${jobId}`, { method: 'DELETE' }),
  
  getSkillGap: (jobId: number, userId?: number) =>
    fetchApi<SkillGapAnalysis>(`/jobs/${jobId}/skill-gap${userId ? `?user_id=${userId}` : ''}`),
}

export const applicationsApi = {
  getMyApplications: () =>
    fetchApi<Application[]>('/applications/my-applications'),
  
  create: (data: { job_id: number; cover_letter?: string }) =>
    fetchApi<Application>('/applications', { method: 'POST', body: JSON.stringify(data) }),
  
  getJobApplications: (jobId: number) =>
    fetchApi<Application[]>(`/applications/job/${jobId}`),
  
  updateStatus: (applicationId: number, status: string) =>
    fetchApi<Application>(`/applications/${applicationId}/status`, { 
      method: 'PUT', 
      body: JSON.stringify({ status }) 
    }),
  
  getStudentApplications: (studentId: number) =>
    fetchApi<Application[]>(`/applications/student/${studentId}`),
}

export const skillsApi = {
  list: (params?: { technical_only?: boolean; category?: string; search?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.technical_only !== undefined) searchParams.set('technical_only', String(params.technical_only))
    if (params?.category) searchParams.set('category', params.category)
    if (params?.search) searchParams.set('search', params.search)
    return fetchApi<Skill[]>(`/skills?${searchParams.toString()}`)
  },
  
  getCategories: () =>
    fetchApi<string[]>('/skills/categories'),
}

export const notesApi = {
  getStudentNotes: (studentId: number) =>
    fetchApi<Note[]>(`/notes/student/${studentId}`),
  
  create: (data: { student_id: number; content: string; note_type?: string }) =>
    fetchApi<Note>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (noteId: number, data: { content?: string; note_type?: string }) =>
    fetchApi<Note>(`/notes/${noteId}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (noteId: number) =>
    fetchApi(`/notes/${noteId}`, { method: 'DELETE' }),
  
  getMyNotes: () =>
    fetchApi<Note[]>('/notes/my-notes'),
}
