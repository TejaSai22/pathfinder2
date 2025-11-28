import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useMyJobs, useJobApplications, useUpdateApplicationStatus, useSkillGap } from '@/hooks/useRealTime'
import { EntityCard } from '@/components/shared/EntityCard'
import { SkillGapChart } from '@/components/shared/SkillGapChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, ArrowLeft, CheckCircle, XCircle, MessageSquare, Send } from 'lucide-react'
import { Job, Application } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function EmployerDashboard() {
  const { user } = useAuth()
  const { data: jobs, isLoading: jobsLoading } = useMyJobs()
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{open: boolean; applicationId: number; status: string; applicantName: string} | null>(null)
  const [feedbackNotes, setFeedbackNotes] = useState('')
  
  const { data: applications, isLoading: applicationsLoading } = useJobApplications(selectedJob?.id || 0)
  const { data: skillGap } = useSkillGap(selectedJob?.id || 0, selectedApplicant?.applicant_id)
  const updateStatus = useUpdateApplicationStatus()

  const openFeedbackModal = (applicationId: number, status: string, applicantName: string) => {
    setFeedbackModal({ open: true, applicationId, status, applicantName })
    setFeedbackNotes('')
  }

  const handleStatusUpdate = async () => {
    if (!feedbackModal) return
    try {
      await updateStatus.mutateAsync({ 
        applicationId: feedbackModal.applicationId, 
        status: feedbackModal.status,
        feedbackNotes: feedbackNotes.trim() || undefined
      })
      setFeedbackModal(null)
      setFeedbackNotes('')
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'interview': 'Schedule Interview',
      'rejected': 'Reject Application',
      'accepted': 'Accept Application',
      'reviewed': 'Mark as Reviewed'
    }
    return labels[status] || status
  }

  const totalApplications = jobs?.reduce((acc, job) => acc + (job as any).application_count || 0, 0) || 0

  if (selectedJob) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedJob(null)
            setSelectedApplicant(null)
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          <h1 className="text-2xl font-bold">{selectedJob.title}</h1>
          <Badge variant="secondary">{applications?.length || 0} applicants</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Applicant Inbox</h2>
            
            {applicationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : applications?.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No applications yet for this position
              </Card>
            ) : (
              <div className="space-y-4">
                {applications?.map(app => (
                  <EntityCard
                    key={app.id}
                    type="applicant"
                    title={`${app.applicant?.profile?.first_name || ''} ${app.applicant?.profile?.last_name || 'Applicant'}`}
                    subtitle={app.applicant?.email}
                    description={app.cover_letter || 'No cover letter provided'}
                    matchScore={app.match_score}
                    skills={app.applicant?.skills}
                    status={app.status}
                    onClick={() => setSelectedApplicant(app)}
                    className={selectedApplicant?.id === app.id ? 'ring-2 ring-primary' : ''}
                    actions={
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            const name = `${app.applicant?.profile?.first_name || ''} ${app.applicant?.profile?.last_name || 'Applicant'}`.trim()
                            openFeedbackModal(app.id, 'interview', name)
                          }}
                          disabled={updateStatus.isPending || app.status === 'interview'}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Interview
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            const name = `${app.applicant?.profile?.first_name || ''} ${app.applicant?.profile?.last_name || 'Applicant'}`.trim()
                            openFeedbackModal(app.id, 'rejected', name)
                          }}
                          disabled={updateStatus.isPending || app.status === 'rejected'}
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </Button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Applicant Skill Analysis</h2>
            {selectedApplicant && skillGap ? (
              <SkillGapChart 
                data={skillGap} 
                title={`${selectedApplicant.applicant?.profile?.first_name || 'Applicant'}'s Skills`}
              />
            ) : (
              <Card className="p-6 text-center text-muted-foreground h-96 flex items-center justify-center">
                <div>
                  <p className="mb-2">Select an applicant to see their skill analysis</p>
                  <p className="text-sm">Click on any applicant card to visualize their skills</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.profile?.company_name || 'Employer'}!</h1>
          <p className="text-muted-foreground">Manage your job postings and review applicants</p>
        </div>
        <Link to="/post-job">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs?.filter(j => j.is_active).length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Job Postings</h2>
        
        {jobsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : jobs?.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">You haven't posted any jobs yet</p>
            <Link to="/post-job">
              <Button>Post Your First Job</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs?.map(job => (
              <EntityCard
                key={job.id}
                type="job"
                title={job.title}
                description={job.description}
                location={job.location}
                salary={{ min: job.salary_min, max: job.salary_max }}
                jobType={job.job_type}
                experienceLevel={job.experience_level}
                skills={job.required_skills}
                onClick={() => setSelectedJob(job)}
                actions={
                  <Button size="sm" variant="outline" className="gap-1">
                    <MessageSquare className="w-3 h-3" />
                    View Applicants
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!feedbackModal?.open} onOpenChange={(open) => !open && setFeedbackModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{feedbackModal ? getStatusLabel(feedbackModal.status) : ''}</DialogTitle>
            <DialogDescription>
              {feedbackModal?.status === 'interview' 
                ? `You're scheduling an interview with ${feedbackModal.applicantName}. Add a note for the applicant.`
                : feedbackModal?.status === 'rejected'
                ? `You're rejecting ${feedbackModal?.applicantName}'s application. Optionally add feedback.`
                : `Update status for ${feedbackModal?.applicantName}.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback Notes (Optional)</Label>
              <Textarea
                id="feedback"
                placeholder={feedbackModal?.status === 'interview' 
                  ? "e.g., We'd like to discuss your experience with React..."
                  : "e.g., We're looking for more experience with cloud technologies..."
                }
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This note will be visible to the applicant
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFeedbackModal(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdate}
              disabled={updateStatus.isPending}
              variant={feedbackModal?.status === 'rejected' ? 'destructive' : 'default'}
              className="gap-2"
            >
              {updateStatus.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {feedbackModal ? getStatusLabel(feedbackModal.status) : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
