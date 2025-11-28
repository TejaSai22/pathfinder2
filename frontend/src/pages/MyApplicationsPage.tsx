import { useMyApplications } from '@/hooks/useRealTime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Briefcase, MapPin, DollarSign, MessageSquare, Calendar } from 'lucide-react'

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "success" | "warning" {
  switch (status) {
    case 'interview':
    case 'accepted':
      return 'success'
    case 'rejected':
      return 'destructive'
    case 'reviewed':
      return 'warning'
    default:
      return 'secondary'
  }
}

export function MyApplicationsPage() {
  const { data: applications, isLoading } = useMyApplications()

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
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-muted-foreground">Track the status of your job applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications?.filter(a => a.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {applications?.filter(a => a.status === 'interview').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {applications?.filter(a => a.status === 'rejected').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {applications?.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          You haven't applied to any jobs yet. Start exploring the job feed!
        </Card>
      ) : (
        <div className="space-y-4">
          {applications?.map(app => (
            <Card key={app.id} className="overflow-hidden">
              <div className="flex">
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{app.job?.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {app.job?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {app.job.location}
                          </span>
                        )}
                        {(app.job?.salary_min || app.job?.salary_max) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {app.job.salary_min && app.job.salary_max 
                              ? `$${(app.job.salary_min/1000).toFixed(0)}k - $${(app.job.salary_max/1000).toFixed(0)}k`
                              : app.job.salary_min 
                                ? `From $${(app.job.salary_min/1000).toFixed(0)}k`
                                : `Up to $${(app.job.salary_max!/1000).toFixed(0)}k`
                            }
                          </span>
                        )}
                        {app.job?.job_type && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {app.job.job_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.match_score && (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          app.match_score >= 80 ? 'bg-green-500' :
                          app.match_score >= 60 ? 'bg-yellow-500' :
                          'bg-orange-500'
                        }`}>
                          {app.match_score.toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {app.cover_letter && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Your Cover Letter</p>
                      <p className="text-sm line-clamp-2">{app.cover_letter}</p>
                    </div>
                  )}

                  {app.feedback_notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-800">Employer Feedback</p>
                        {app.feedback_at && (
                          <span className="text-xs text-blue-600">
                            {new Date(app.feedback_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-blue-700">{app.feedback_notes}</p>
                    </div>
                  )}

                  {app.job?.deadline && new Date(app.job.deadline) > new Date() && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-orange-600">
                      <Calendar className="w-4 h-4" />
                      <span>Application deadline: {new Date(app.job.deadline).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Applied on {new Date(app.created_at).toLocaleDateString()}
                    </span>
                    <Badge variant={getStatusVariant(app.status)}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
