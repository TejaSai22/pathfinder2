import { useState } from 'react'
import { useStudents, useStudent, useStudentApplications, useStudentNotes, useCreateNote, useSkillGap, useJobs, useAnalyticsOverview, useSkillDemand, useApplicationTrends, useStudentPerformance, useTopEmployers } from '@/hooks/useRealTime'
import { useAuth } from '@/hooks/useAuth'
import { EntityCard } from '@/components/shared/EntityCard'
import { SkillGapChart } from '@/components/shared/SkillGapChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ArrowLeft, MessageSquare, GraduationCap, Target, FileText, BarChart3, TrendingUp, Users, Briefcase, Award } from 'lucide-react'
import { UserWithStats, JobWithMatch } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

export function AdvisorDashboard() {
  const { user } = useAuth()
  const { data: students, isLoading: studentsLoading } = useStudents()
  const [selectedStudent, setSelectedStudent] = useState<UserWithStats | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobWithMatch | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState('general')

  const { data: studentDetail } = useStudent(selectedStudent?.id || 0)
  const { data: studentApplications } = useStudentApplications(selectedStudent?.id || 0)
  const { data: studentNotes } = useStudentNotes(selectedStudent?.id || 0)
  const { data: jobs } = useJobs()
  const { data: skillGap } = useSkillGap(selectedJob?.id || 0, selectedStudent?.id)
  const createNote = useCreateNote()

  const handleCreateNote = async () => {
    if (!selectedStudent || !noteContent.trim()) return
    
    try {
      await createNote.mutateAsync({
        student_id: selectedStudent.id,
        content: noteContent,
        note_type: noteType
      })
      setShowNoteModal(false)
      setNoteContent('')
      setNoteType('general')
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  if (selectedStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => {
              setSelectedStudent(null)
              setSelectedJob(null)
            }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Students
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {selectedStudent.profile?.first_name} {selectedStudent.profile?.last_name}
              </h1>
              <p className="text-muted-foreground">{selectedStudent.email}</p>
            </div>
          </div>
          <Button onClick={() => setShowNoteModal(true)} className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Add Guidance Note
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedStudent.avg_match_score?.toFixed(1) || 'N/A'}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedStudent.application_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentDetail?.skills?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Guidance Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentNotes?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              Student's Job Feed (Shadow Mode)
            </h2>
            <p className="text-sm text-muted-foreground">
              Viewing the job feed as the student sees it
            </p>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {jobs?.slice(0, 10).map(job => (
                <EntityCard
                  key={job.id}
                  type="job"
                  title={job.title}
                  description={job.description}
                  matchScore={job.match_score}
                  location={job.location}
                  skills={job.required_skills?.slice(0, 4)}
                  onClick={() => setSelectedJob(job)}
                  className={selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Skill Gap Analysis</h2>
            {selectedJob && skillGap ? (
              <SkillGapChart 
                data={skillGap} 
                title={`Match: ${selectedJob.title}`}
              />
            ) : (
              <Card className="p-6 text-center text-muted-foreground h-96 flex items-center justify-center">
                <div>
                  <p className="mb-2">Select a job to see the student's skill gap</p>
                  <p className="text-sm">Click on any job to visualize their match</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Student's Applications
            </h2>
            {studentApplications?.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                This student hasn't applied to any jobs yet
              </Card>
            ) : (
              <div className="space-y-3">
                {studentApplications?.map(app => (
                  <Card key={app.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{app.job?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Applied on {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{app.match_score?.toFixed(0)}% match</Badge>
                        <Badge variant={
                          app.status === 'interview' ? 'success' :
                          app.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {app.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Guidance Notes
            </h2>
            {studentNotes?.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No guidance notes yet for this student
              </Card>
            ) : (
              <div className="space-y-3">
                {studentNotes?.map(note => (
                  <Card key={note.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{note.note_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{note.content}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Guidance Note</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                {['general', 'certification', 'higher_studies', 'skill_development'].map(type => (
                  <Button
                    key={type}
                    variant={noteType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNoteType(type)}
                  >
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="Enter your guidance note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNoteModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateNote}
                disabled={createNote.isPending || !noteContent.trim()}
              >
                {createNote.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const { data: overview } = useAnalyticsOverview()
  const { data: skillDemand } = useSkillDemand(10)
  const { data: applicationTrends } = useApplicationTrends()
  const { data: studentPerformance } = useStudentPerformance()
  const { data: topEmployers } = useTopEmployers(5)
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  
  const statusColorMap: Record<string, string> = {
    pending: '#f59e0b',
    reviewing: '#3b82f6',
    interview: '#8b5cf6',
    accepted: '#10b981',
    rejected: '#ef4444',
    withdrawn: '#6b7280'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.profile?.first_name || 'Advisor'}!</h1>
        <p className="text-muted-foreground">Monitor and guide your assigned students</p>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Assigned Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {students?.reduce((acc, s) => acc + s.application_count, 0) || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {students?.length 
                    ? (students.reduce((acc, s) => acc + (s.avg_match_score || 0), 0) / students.length).toFixed(1)
                    : 'N/A'
                  }%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Your Students
            </h2>
            
            {studentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : students?.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No students assigned to you yet
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students?.map(student => (
                  <EntityCard
                    key={student.id}
                    type="student"
                    title={`${student.profile?.first_name || ''} ${student.profile?.last_name || 'Student'}`}
                    subtitle={student.profile?.headline}
                    matchScore={student.avg_match_score}
                    applicationCount={student.application_count}
                    skills={student.skills?.slice(0, 4)}
                    onClick={() => setSelectedStudent(student)}
                    actions={
                      <Button size="sm" variant="outline">
                        View Dashboard
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.total_students || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.total_applications || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-500" />
                  Offers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.total_offers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  Placement Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.placement_rate || 0}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Top Skills in Demand
                </CardTitle>
                <CardDescription>
                  Most requested skills across active job listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {skillDemand?.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={skillDemand} layout="vertical" margin={{ left: 100, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="skill_name" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="demand_count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {skillDemand.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.is_technical ? '#3b82f6' : '#10b981'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No skill demand data available
                  </div>
                )}
                <div className="flex gap-4 mt-4 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span>Technical Skills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Soft Skills</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Application Status Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of applications by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applicationTrends?.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={applicationTrends}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) => `${status} (${percentage}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="status"
                      >
                        {applicationTrends.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={statusColorMap[entry.status] || COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No application data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Student Performance
                </CardTitle>
                <CardDescription>
                  Application activity and match scores by student
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentPerformance?.length ? (
                  <div className="space-y-3">
                    {studentPerformance.map((student, index) => (
                      <div key={student.student_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{student.student_name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{student.application_count} apps</div>
                          <div className="text-sm text-muted-foreground">
                            {student.avg_match_score}% avg match
                          </div>
                        </div>
                      </div>
                    ))}
                    {studentPerformance.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No student data available
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No student performance data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Top Employers
                </CardTitle>
                <CardDescription>
                  Employers with most job listings and applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topEmployers?.length ? (
                  <div className="space-y-3">
                    {topEmployers.map((employer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-semibold text-blue-600">
                            {index + 1}
                          </div>
                          <div className="font-medium">{employer.employer_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{employer.job_count} jobs</div>
                          <div className="text-sm text-muted-foreground">
                            {employer.application_count} applications
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No employer data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
