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
  resume_url?: string
  resume_filename?: string
}

export interface Notification {
  id: number
  user_id: number
  notification_type: string
  title: string
  message: string
  link?: string
  is_read: boolean
  created_at: string
}

export interface ProfileCompletion {
  completion_percentage: number
  missing_fields: string[]
  has_skills: boolean
  skill_count: number
  can_get_recommendations: boolean
}

export interface CareerDetail {
  id: number
  soc_code: string
  title: string
  salary_low?: number
  salary_median?: number
  salary_high?: number
  demand_outlook?: string
  growth_rate?: number
  responsibilities?: string
  education_required?: string
}

export interface LearningResource {
  id: number
  skill_id: number
  title: string
  provider: string
  url: string
  resource_type: string
  estimated_hours?: number
  difficulty_level?: string
  is_free: boolean
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
  deadline?: string
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
  resume_url?: string
  match_score?: number
  feedback_notes?: string
  feedback_at?: string
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

export type InterviewStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'

export interface Interview {
  id: number
  application_id: number
  scheduled_at: string
  duration_minutes: number
  interview_type: string
  location?: string
  meeting_link?: string
  notes?: string
  status: InterviewStatus
  created_at: string
  updated_at: string
}

export interface InterviewWithDetails extends Interview {
  applicant_name: string
  applicant_email: string
  job_title: string
  company_name: string
}

export interface SkillGapData {
  skill: string
  skill_id?: number
  candidate: number
  required: number
  is_technical: boolean
  matched: boolean
}

export interface SkillRef {
  id: number
  name: string
}

export interface SkillGapAnalysis {
  overall_score: number
  technical_score: number
  soft_score: number
  matched_technical: string[]
  matched_soft: string[]
  missing_technical: string[]
  missing_soft: string[]
  missing_technical_skills?: SkillRef[]
  missing_soft_skills?: SkillRef[]
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

export interface SkillWithProficiency {
  skill_id: number;
  proficiency: number;
}

export interface SkillProficiencyResponse extends Skill {
  proficiency: number;
}

export const usersApi = {
  getProfile: () =>
    fetchApi<User>('/users/me'),
  
  updateProfile: (data: Partial<Profile>) =>
    fetchApi<Profile>('/users/me/profile', { method: 'PUT', body: JSON.stringify(data) }),
  
  updateSkills: (skillIds: number[]) =>
    fetchApi<Skill[]>('/users/me/skills', { method: 'PUT', body: JSON.stringify(skillIds) }),
  
  updateSkillsWithProficiency: (skills: SkillWithProficiency[]) =>
    fetchApi<SkillProficiencyResponse[]>('/users/me/skills-with-proficiency', { 
      method: 'PUT', 
      body: JSON.stringify({ skills }) 
    }),
  
  getSkillsWithProficiency: () =>
    fetchApi<SkillProficiencyResponse[]>('/users/me/skills-with-proficiency'),
  
  getProfileCompletion: () =>
    fetchApi<ProfileCompletion>('/users/me/profile-completion'),
  
  getStudents: () =>
    fetchApi<UserWithStats[]>('/users/students'),
  
  getStudent: (studentId: number) =>
    fetchApi<UserWithStats>(`/users/students/${studentId}`),
  
  assignStudent: (studentId: number) =>
    fetchApi(`/users/students/${studentId}/assign`, { method: 'POST' }),
  
  uploadResume: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(`${API_BASE}/users/me/resume`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(error.detail || 'Upload failed')
    }
    return response.json() as Promise<{ message: string; filename: string; url: string }>
  },
  
  deleteResume: () =>
    fetchApi('/users/me/resume', { method: 'DELETE' }),
}

export interface JobSearchParams {
  search?: string
  location?: string
  min_salary?: number
  max_salary?: number
  experience_level?: string
  job_type?: string
  min_match_score?: number
  sort_by?: 'created_at' | 'match_score' | 'salary'
  sort_order?: 'asc' | 'desc'
}

export const jobsApi = {
  list: (params?: JobSearchParams) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.location) searchParams.set('location', params.location)
    if (params?.min_salary) searchParams.set('min_salary', String(params.min_salary))
    if (params?.max_salary) searchParams.set('max_salary', String(params.max_salary))
    if (params?.experience_level) searchParams.set('experience_level', params.experience_level)
    if (params?.job_type) searchParams.set('job_type', params.job_type)
    if (params?.min_match_score) searchParams.set('min_match_score', String(params.min_match_score))
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by)
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order)
    const query = searchParams.toString()
    return fetchApi<JobWithMatch[]>(`/jobs${query ? `?${query}` : ''}`)
  },
  
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

export interface BulkUpdateResult {
  updated_count: number
  failed_count: number
  failed_ids: number[]
  message: string
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
  
  updateStatusWithFeedback: (applicationId: number, status: string, feedbackNotes?: string) =>
    fetchApi<Application>(`/applications/${applicationId}/status`, { 
      method: 'PUT', 
      body: JSON.stringify({ status, feedback_notes: feedbackNotes }) 
    }),
  
  getStudentApplications: (studentId: number) =>
    fetchApi<Application[]>(`/applications/student/${studentId}`),
  
  bulkUpdate: (data: { application_ids: number[]; status: string; feedback_notes?: string }) =>
    fetchApi<BulkUpdateResult>('/applications/bulk-update', { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
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

export const notificationsApi = {
  list: () =>
    fetchApi<Notification[]>('/notifications'),
  
  getUnreadCount: () =>
    fetchApi<{ count: number }>('/notifications/unread-count'),
  
  markAsRead: (notificationId: number) =>
    fetchApi<Notification>(`/notifications/${notificationId}/read`, { method: 'PUT' }),
  
  markAllAsRead: () =>
    fetchApi('/notifications/read-all', { method: 'PUT' }),
}

export const careersApi = {
  list: () =>
    fetchApi<CareerDetail[]>('/careers'),
  
  get: (socCode: string) =>
    fetchApi<CareerDetail>(`/careers/${socCode}`),
  
  getResourcesForSkill: (skillId: number) =>
    fetchApi<LearningResource[]>(`/careers/resources/by-skill/${skillId}`),
  
  getResourcesForMissingSkills: (skillIds: number[]) =>
    fetchApi<LearningResource[]>(`/careers/resources/for-missing-skills?skill_ids=${skillIds.join(',')}`),
}

export const applicationsApiExtended = {
  updateStatusWithFeedback: (applicationId: number, status: string, feedbackNotes?: string) =>
    fetchApi<Application>(`/applications/${applicationId}/status`, { 
      method: 'PUT', 
      body: JSON.stringify({ status, feedback_notes: feedbackNotes }) 
    }),
}

export const interviewsApi = {
  list: () =>
    fetchApi<InterviewWithDetails[]>('/interviews'),
  
  schedule: (data: { 
    application_id: number
    scheduled_at: string
    duration_minutes?: number
    interview_type?: string
    location?: string
    meeting_link?: string
    notes?: string 
  }) =>
    fetchApi<Interview>('/interviews', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (interviewId: number, data: {
    scheduled_at?: string
    duration_minutes?: number
    interview_type?: string
    location?: string
    meeting_link?: string
    notes?: string
    status?: InterviewStatus
  }) =>
    fetchApi<Interview>(`/interviews/${interviewId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  
  cancel: (interviewId: number) =>
    fetchApi<Interview>(`/interviews/${interviewId}`, { method: 'DELETE' }),
}

export interface OverviewStats {
  total_students: number
  total_applications: number
  total_interviews: number
  total_offers: number
  placement_rate: number
  avg_match_score: number
}

export interface SkillDemand {
  skill_name: string
  demand_count: number
  is_technical: boolean
}

export interface ApplicationTrend {
  status: string
  count: number
  percentage: number
}

export interface StudentPerformance {
  student_id: number
  student_name: string
  email: string
  application_count: number
  avg_match_score: number
  status_distribution: Record<string, number>
}

export interface TopEmployer {
  employer_name: string
  job_count: number
  application_count: number
}

export const analyticsApi = {
  getOverview: () =>
    fetchApi<OverviewStats>('/analytics/overview'),
  
  getSkillDemand: (limit?: number) =>
    fetchApi<SkillDemand[]>(`/analytics/skill-demand${limit ? `?limit=${limit}` : ''}`),
  
  getApplicationTrends: () =>
    fetchApi<ApplicationTrend[]>('/analytics/application-trends'),
  
  getStudentPerformance: () =>
    fetchApi<StudentPerformance[]>('/analytics/student-performance'),
  
  getTopEmployers: (limit?: number) =>
    fetchApi<TopEmployer[]>(`/analytics/top-employers${limit ? `?limit=${limit}` : ''}`),
}
