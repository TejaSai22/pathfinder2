import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useMyJobs, useJobApplications, useUpdateApplicationStatus, useSkillGap, useScheduleInterview, useBulkUpdateApplications } from '@/hooks/useRealTime'
import { EntityCard } from '@/components/shared/EntityCard'
import { SkillGapChart } from '@/components/shared/SkillGapChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, ArrowLeft, XCircle, MessageSquare, Send, Calendar, Video, MapPin, Link2, CheckSquare, Square, ThumbsUp, ThumbsDown, Users } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function EmployerDashboard() {
  const { user } = useAuth()
  const { data: jobs, isLoading: jobsLoading } = useMyJobs()
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{open: boolean; applicationId: number; status: string; applicantName: string} | null>(null)
  const [feedbackNotes, setFeedbackNotes] = useState('')
  
  const [scheduleModal, setScheduleModal] = useState<{open: boolean; applicationId: number; applicantName: string} | null>(null)
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewTime, setInterviewTime] = useState('')
  const [interviewDuration, setInterviewDuration] = useState('60')
  const [interviewType, setInterviewType] = useState('video')
  const [interviewLocation, setInterviewLocation] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [interviewNotes, setInterviewNotes] = useState('')
  
  const [selectedApplications, setSelectedApplications] = useState<Set<number>>(new Set())
  const [bulkActionModal, setBulkActionModal] = useState<{open: boolean; action: string} | null>(null)
  const [bulkFeedbackNotes, setBulkFeedbackNotes] = useState('')
  
  const { data: applications, isLoading: applicationsLoading } = useJobApplications(selectedJob?.id || 0)
  const { data: skillGap } = useSkillGap(selectedJob?.id || 0, selectedApplicant?.applicant_id)
  const updateStatus = useUpdateApplicationStatus()
  const scheduleInterview = useScheduleInterview()
  const bulkUpdate = useBulkUpdateApplications()
  
  const toggleApplicationSelection = (appId: number) => {
    setSelectedApplications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(appId)) {
        newSet.delete(appId)
      } else {
        newSet.add(appId)
      }
      return newSet
    })
  }
  
  const selectAllApplications = () => {
    if (!applications) return
    if (selectedApplications.size === applications.length) {
      setSelectedApplications(new Set())
    } else {
      setSelectedApplications(new Set(applications.map(a => a.id)))
    }
  }
  
  const clearSelection = () => {
    setSelectedApplications(new Set())
  }
  
  const handleBulkAction = async () => {
    if (!bulkActionModal || selectedApplications.size === 0) return
    try {
      await bulkUpdate.mutateAsync({
        application_ids: Array.from(selectedApplications),
        status: bulkActionModal.action,
        feedback_notes: bulkFeedbackNotes.trim() || undefined
      })
      setBulkActionModal(null)
      setBulkFeedbackNotes('')
      clearSelection()
    } catch (error) {
      console.error('Failed to bulk update:', error)
    }
  }

  const openFeedbackModal = (applicationId: number, status: string, applicantName: string) => {
    setFeedbackModal({ open: true, applicationId, status, applicantName })
    setFeedbackNotes('')
  }

  const openScheduleModal = (applicationId: number, applicantName: string) => {
    setScheduleModal({ open: true, applicationId, applicantName })
    setInterviewDate('')
    setInterviewTime('')
    setInterviewDuration('60')
    setInterviewType('video')
    setInterviewLocation('')
    setMeetingLink('')
    setInterviewNotes('')
  }

  const handleScheduleInterview = async () => {
    if (!scheduleModal || !interviewDate || !interviewTime) return
    try {
      const scheduledAt = new Date(`${interviewDate}T${interviewTime}`).toISOString()
      await scheduleInterview.mutateAsync({
        application_id: scheduleModal.applicationId,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(interviewDuration),
        interview_type: interviewType,
        location: interviewLocation || undefined,
        meeting_link: meetingLink || undefined,
        notes: interviewNotes || undefined
      })
      setScheduleModal(null)
    } catch (error) {
      console.error('Failed to schedule interview:', error)
    }
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Applicant Inbox</h2>
              {applications && applications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={selectAllApplications} className="gap-2">
                  {selectedApplications.size === applications.length ? (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" />
                      Select All
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {selectedApplications.size > 0 && (
              <Card className="p-3 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">{selectedApplications.size} selected</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setBulkActionModal({ open: true, action: 'reviewing' })}
                      disabled={bulkUpdate.isPending}
                    >
                      Mark as Reviewing
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-green-600 hover:text-green-700"
                      onClick={() => setBulkActionModal({ open: true, action: 'accepted' })}
                      disabled={bulkUpdate.isPending}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Accept All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => setBulkActionModal({ open: true, action: 'rejected' })}
                      disabled={bulkUpdate.isPending}
                    >
                      <ThumbsDown className="w-3 h-3" />
                      Reject All
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearSelection}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            
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
                  <div key={app.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedApplications.has(app.id)}
                      onCheckedChange={() => toggleApplicationSelection(app.id)}
                      className="mt-4"
                    />
                    <div className="flex-1">
                      <EntityCard
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
                                openScheduleModal(app.id, name)
                              }}
                              disabled={scheduleInterview.isPending || app.status === 'interview'}
                            >
                              <Calendar className="w-3 h-3" />
                              Schedule
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
                    </div>
                  </div>
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

      <Dialog open={!!scheduleModal?.open} onOpenChange={(open) => !open && setScheduleModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Interview
            </DialogTitle>
            <DialogDescription>
              Schedule an interview with {scheduleModal?.applicantName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interview-date">Date</Label>
                <Input
                  id="interview-date"
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interview-time">Time</Label>
                <Input
                  id="interview-time"
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={interviewDuration} onValueChange={setInterviewDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Video Call
                      </div>
                    </SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="in-person">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        In Person
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {interviewType === 'video' && (
              <div className="space-y-2">
                <Label htmlFor="meeting-link" className="flex items-center gap-1">
                  <Link2 className="w-4 h-4" />
                  Meeting Link
                </Label>
                <Input
                  id="meeting-link"
                  placeholder="https://zoom.us/j/..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>
            )}
            {interviewType === 'in-person' && (
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="Office address..."
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="interview-notes">Notes for Candidate (Optional)</Label>
              <Textarea
                id="interview-notes"
                placeholder="e.g., Please prepare to discuss your experience with..."
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setScheduleModal(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleInterview}
              disabled={scheduleInterview.isPending || !interviewDate || !interviewTime}
              className="gap-2"
            >
              {scheduleInterview.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!bulkActionModal?.open} onOpenChange={(open) => !open && setBulkActionModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Bulk Update Applications
            </DialogTitle>
            <DialogDescription>
              {bulkActionModal?.action === 'accepted' && `Accept ${selectedApplications.size} application(s)?`}
              {bulkActionModal?.action === 'rejected' && `Reject ${selectedApplications.size} application(s)?`}
              {bulkActionModal?.action === 'reviewing' && `Mark ${selectedApplications.size} application(s) as reviewing?`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-feedback">Feedback Notes (Optional)</Label>
              <Textarea
                id="bulk-feedback"
                placeholder="Add notes that will be sent to all selected applicants..."
                value={bulkFeedbackNotes}
                onChange={(e) => setBulkFeedbackNotes(e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                This feedback will be visible to all selected applicants.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkActionModal(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAction}
              disabled={bulkUpdate.isPending}
              variant={bulkActionModal?.action === 'rejected' ? 'destructive' : 'default'}
              className="gap-2"
            >
              {bulkUpdate.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : bulkActionModal?.action === 'accepted' ? (
                <ThumbsUp className="w-4 h-4" />
              ) : bulkActionModal?.action === 'rejected' ? (
                <ThumbsDown className="w-4 h-4" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
              Confirm Bulk Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
