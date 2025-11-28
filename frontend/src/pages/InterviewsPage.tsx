import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useInterviews, useCancelInterview, useUpdateInterview } from '@/hooks/useRealTime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, Video, MapPin, Link2, User, Briefcase, Loader2, X, Check, AlertCircle } from 'lucide-react'
import { InterviewWithDetails, InterviewStatus } from '@/lib/api'

const statusColors: Record<InterviewStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
}

const statusLabels: Record<InterviewStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
}

export function InterviewsPage() {
  const { user } = useAuth()
  const { data: interviews, isLoading } = useInterviews()
  const cancelInterview = useCancelInterview()
  const updateInterview = useUpdateInterview()
  
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithDetails | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  const isEmployer = user?.role === 'employer'
  const isStudent = user?.role === 'student'

  const upcomingInterviews = interviews?.filter(i => 
    i.status !== 'cancelled' && i.status !== 'completed' && new Date(i.scheduled_at) > new Date()
  ) || []
  
  const pastInterviews = interviews?.filter(i => 
    i.status === 'completed' || i.status === 'cancelled' || new Date(i.scheduled_at) <= new Date()
  ) || []

  const handleCancel = async () => {
    if (!selectedInterview) return
    try {
      await cancelInterview.mutateAsync(selectedInterview.id)
      setShowCancelDialog(false)
      setSelectedInterview(null)
    } catch (error) {
      console.error('Failed to cancel interview:', error)
    }
  }

  const handleConfirm = async (interview: InterviewWithDetails) => {
    try {
      await updateInterview.mutateAsync({
        interviewId: interview.id,
        data: { status: 'confirmed' }
      })
    } catch (error) {
      console.error('Failed to confirm interview:', error)
    }
  }

  const handleComplete = async (interview: InterviewWithDetails) => {
    try {
      await updateInterview.mutateAsync({
        interviewId: interview.id,
        data: { status: 'completed' }
      })
    } catch (error) {
      console.error('Failed to mark interview as completed:', error)
    }
  }

  const handleReschedule = async () => {
    if (!selectedInterview || !newDate || !newTime) return
    try {
      const scheduledAt = new Date(`${newDate}T${newTime}`).toISOString()
      await updateInterview.mutateAsync({
        interviewId: selectedInterview.id,
        data: { scheduled_at: scheduledAt, status: 'rescheduled' }
      })
      setShowRescheduleDialog(false)
      setSelectedInterview(null)
      setNewDate('')
      setNewTime('')
    } catch (error) {
      console.error('Failed to reschedule interview:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const renderInterviewCard = (interview: InterviewWithDetails) => {
    const isUpcoming = new Date(interview.scheduled_at) > new Date() && interview.status !== 'cancelled'
    
    return (
      <Card key={interview.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[interview.status]}>
                  {statusLabels[interview.status]}
                </Badge>
                <Badge variant="outline">{interview.interview_type}</Badge>
              </div>
              
              <h3 className="font-semibold">{interview.job_title}</h3>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {isEmployer && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {interview.applicant_name}
                  </div>
                )}
                {isStudent && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {interview.company_name}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(interview.scheduled_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(interview.scheduled_at)} ({interview.duration_minutes} min)
                </div>
              </div>
              
              {interview.location && (
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {interview.location}
                </div>
              )}
              
              {interview.meeting_link && (
                <a 
                  href={interview.meeting_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Link2 className="w-4 h-4" />
                  Join Meeting
                </a>
              )}
              
              {interview.notes && (
                <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                  {interview.notes}
                </p>
              )}
            </div>
            
            {isUpcoming && (
              <div className="flex flex-col gap-2 ml-4">
                {interview.status === 'scheduled' && isStudent && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleConfirm(interview)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Confirm
                  </Button>
                )}
                {isEmployer && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleComplete(interview)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedInterview(interview)
                    setShowRescheduleDialog(true)
                  }}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Reschedule
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-destructive"
                  onClick={() => {
                    setSelectedInterview(interview)
                    setShowCancelDialog(true)
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interviews</h1>
        <p className="text-muted-foreground">
          {isEmployer ? 'Manage interviews with candidates' : 'View and manage your scheduled interviews'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingInterviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews?.filter(i => i.status === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews?.filter(i => i.status === 'cancelled').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Video className="w-5 h-5" />
          Upcoming Interviews
        </h2>
        
        {upcomingInterviews.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No upcoming interviews scheduled</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingInterviews.map(renderInterviewCard)}
          </div>
        )}
      </div>

      {pastInterviews.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">Past Interviews</h2>
          <div className="space-y-3 opacity-75">
            {pastInterviews.map(renderInterviewCard)}
          </div>
        </div>
      )}

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Interview</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this interview? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Interview
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={cancelInterview.isPending}
            >
              {cancelInterview.isPending ? 'Cancelling...' : 'Cancel Interview'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Interview</DialogTitle>
            <DialogDescription>
              Choose a new date and time for this interview.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Date</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>New Time</Label>
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReschedule}
              disabled={updateInterview.isPending || !newDate || !newTime}
            >
              {updateInterview.isPending ? 'Saving...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
