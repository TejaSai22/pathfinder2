import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useJobs, useCreateApplication, useSkillGap, useMyApplications } from '@/hooks/useRealTime'
import { EntityCard } from '@/components/shared/EntityCard'
import { SkillGapChart } from '@/components/shared/SkillGapChart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Loader2 } from 'lucide-react'
import { JobWithMatch } from '@/lib/api'

export function StudentDashboard() {
  const { user } = useAuth()
  const { data: jobs, isLoading: jobsLoading } = useJobs()
  const { data: applications } = useMyApplications()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobWithMatch | null>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  
  const { data: skillGap } = useSkillGap(selectedJob?.id || 0)
  const createApplication = useCreateApplication()

  const appliedJobIds = new Set(applications?.map(a => a.job_id) || [])

  const filteredJobs = jobs?.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleApply = async () => {
    if (!selectedJob) return
    
    try {
      await createApplication.mutateAsync({
        job_id: selectedJob.id,
        cover_letter: coverLetter
      })
      setShowApplyModal(false)
      setCoverLetter('')
      setSelectedJob(null)
    } catch (error) {
      console.error('Failed to apply:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.profile?.first_name || 'Student'}!</h1>
          <p className="text-muted-foreground">Find IT jobs that match your skills</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jobs Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Skills Listed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.skills?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Job Feed</h2>
          
          {jobsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredJobs?.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No jobs found matching your criteria
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredJobs?.map(job => (
                <EntityCard
                  key={job.id}
                  type="job"
                  title={job.title}
                  description={job.description}
                  matchScore={job.match_score}
                  location={job.location}
                  salary={{ min: job.salary_min, max: job.salary_max }}
                  jobType={job.job_type}
                  experienceLevel={job.experience_level}
                  skills={job.required_skills}
                  onClick={() => setSelectedJob(job)}
                  className={selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''}
                  actions={
                    appliedJobIds.has(job.id) ? (
                      <Button variant="secondary" size="sm" disabled>
                        Applied
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedJob(job)
                          setShowApplyModal(true)
                        }}
                      >
                        Apply Now
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Skill Gap Visualization</h2>
          {selectedJob && skillGap ? (
            <SkillGapChart 
              data={skillGap} 
              title={`Match: ${selectedJob.title}`}
            />
          ) : (
            <Card className="p-6 text-center text-muted-foreground h-96 flex items-center justify-center">
              <div>
                <p className="mb-2">Select a job to see your skill gap analysis</p>
                <p className="text-sm">Click on any job card to visualize how your skills compare</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply to {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Your match score: {selectedJob?.match_score}%
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Cover Letter (Optional)</label>
              <Textarea
                placeholder="Tell the employer why you're a great fit for this role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="mt-2"
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              disabled={createApplication.isPending}
            >
              {createApplication.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
