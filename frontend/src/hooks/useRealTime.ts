import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  jobsApi, 
  applicationsApi, 
  usersApi, 
  skillsApi, 
  notesApi,
  careersApi,
  interviewsApi,
  analyticsApi,
  JobSearchParams
} from '@/lib/api'

export function useJobs(params?: JobSearchParams) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => jobsApi.list(params),
    staleTime: 10000,
  })
}

export function useMyJobs() {
  return useQuery({
    queryKey: ['jobs', 'my'],
    queryFn: jobsApi.getMyJobs,
    staleTime: 10000,
  })
}

export function useJob(jobId: number) {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => jobsApi.get(jobId),
    enabled: !!jobId,
  })
}

export function useSkillGap(jobId: number, userId?: number) {
  return useQuery({
    queryKey: ['skill-gap', jobId, userId],
    queryFn: () => jobsApi.getSkillGap(jobId, userId),
    enabled: !!jobId,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: jobsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: number; data: Parameters<typeof jobsApi.update>[1] }) =>
      jobsApi.update(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: jobsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useMyApplications() {
  return useQuery({
    queryKey: ['applications', 'my'],
    queryFn: applicationsApi.getMyApplications,
    staleTime: 5000,
  })
}

export function useJobApplications(jobId: number) {
  return useQuery({
    queryKey: ['applications', 'job', jobId],
    queryFn: () => applicationsApi.getJobApplications(jobId),
    enabled: !!jobId,
    staleTime: 5000,
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, status, feedbackNotes }: { applicationId: number; status: string; feedbackNotes?: string }) =>
      applicationsApi.updateStatusWithFeedback(applicationId, status, feedbackNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useStudentApplications(studentId: number) {
  return useQuery({
    queryKey: ['applications', 'student', studentId],
    queryFn: () => applicationsApi.getStudentApplications(studentId),
    enabled: !!studentId,
  })
}

export function useBulkUpdateApplications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applicationsApi.bulkUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useSkills(params?: Parameters<typeof skillsApi.list>[0]) {
  return useQuery({
    queryKey: ['skills', params],
    queryFn: () => skillsApi.list(params),
    staleTime: 60000,
  })
}

export function useSkillCategories() {
  return useQuery({
    queryKey: ['skills', 'categories'],
    queryFn: skillsApi.getCategories,
    staleTime: 60000,
  })
}

export function useUpdateSkills() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.updateSkills,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useSkillsWithProficiency() {
  return useQuery({
    queryKey: ['skills', 'proficiency'],
    queryFn: usersApi.getSkillsWithProficiency,
    staleTime: 5000,
  })
}

export function useUpdateSkillsWithProficiency() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.updateSkillsWithProficiency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['skills', 'proficiency'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
    },
  })
}

export function useUploadResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.uploadResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
    },
  })
}

export function useDeleteResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
    },
  })
}

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: usersApi.getStudents,
    staleTime: 10000,
  })
}

export function useStudent(studentId: number) {
  return useQuery({
    queryKey: ['students', studentId],
    queryFn: () => usersApi.getStudent(studentId),
    enabled: !!studentId,
  })
}

export function useStudentNotes(studentId: number) {
  return useQuery({
    queryKey: ['notes', 'student', studentId],
    queryFn: () => notesApi.getStudentNotes(studentId),
    enabled: !!studentId,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notesApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'student', variables.student_id] })
    },
  })
}

export function useMyNotes() {
  return useQuery({
    queryKey: ['notes', 'my'],
    queryFn: notesApi.getMyNotes,
  })
}

export function useLearningResourcesForMissingSkills(skillIds: number[]) {
  return useQuery({
    queryKey: ['learning-resources', 'missing', skillIds],
    queryFn: () => careersApi.getResourcesForMissingSkills(skillIds),
    enabled: skillIds.length > 0,
  })
}

export function useInterviews() {
  return useQuery({
    queryKey: ['interviews'],
    queryFn: interviewsApi.list,
    staleTime: 10000,
  })
}

export function useScheduleInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: interviewsApi.schedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useUpdateInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ interviewId, data }: { interviewId: number; data: Parameters<typeof interviewsApi.update>[1] }) =>
      interviewsApi.update(interviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
    },
  })
}

export function useCancelInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: interviewsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: analyticsApi.getOverview,
    staleTime: 30000,
  })
}

export function useSkillDemand(limit?: number) {
  return useQuery({
    queryKey: ['analytics', 'skill-demand', limit],
    queryFn: () => analyticsApi.getSkillDemand(limit),
    staleTime: 30000,
  })
}

export function useApplicationTrends() {
  return useQuery({
    queryKey: ['analytics', 'application-trends'],
    queryFn: analyticsApi.getApplicationTrends,
    staleTime: 30000,
  })
}

export function useStudentPerformance() {
  return useQuery({
    queryKey: ['analytics', 'student-performance'],
    queryFn: analyticsApi.getStudentPerformance,
    staleTime: 30000,
  })
}

export function useTopEmployers(limit?: number) {
  return useQuery({
    queryKey: ['analytics', 'top-employers', limit],
    queryFn: () => analyticsApi.getTopEmployers(limit),
    staleTime: 30000,
  })
}
