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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Loader2, Filter, X } from 'lucide-react'
import { JobWithMatch } from '@/lib/api'

export function StudentDashboard() {
  const { user } = useAuth()
  const { data: jobs, isLoading: jobsLoading } = useJobs()
  const { data: applications } = useMyApplications()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobWithMatch | null>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [salaryFilter, setSalaryFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [experienceFilter, setExperienceFilter] = useState<string>('all')
  const [matchFilter, setMatchFilter] = useState<string>('all')
  
  const { data: skillGap } = useSkillGap(selectedJob?.id || 0)
  const createApplication = useCreateApplication()

  const appliedJobIds = new Set(applications?.map(a => a.job_id) || [])

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSalary = salaryFilter === 'all' ||
      (salaryFilter === '50k' && (job.salary_min || 0) >= 50000) ||
      (salaryFilter === '75k' && (job.salary_min || 0) >= 75000) ||
      (salaryFilter === '100k' && (job.salary_min || 0) >= 100000) ||
      (salaryFilter === '125k' && (job.salary_min || 0) >= 125000)
    
    const jobCity = job.location?.split(',')[0]?.trim() || ''
    const matchesLocation = locationFilter === 'all' || 
      jobCity.toLowerCase().includes(locationFilter.toLowerCase()) ||
      (locationFilter === 'remote' && job.location?.toLowerCase().includes('remote'))
    
    const matchesExperience = experienceFilter === 'all' || 
      job.experience_level?.toLowerCase().includes(experienceFilter.toLowerCase())
    
    const matchesMatchScore = matchFilter === 'all' ||
      (matchFilter === '90' && (job.match_score || 0) >= 90) ||
      (matchFilter === '75' && (job.match_score || 0) >= 75) ||
      (matchFilter === '50' && (job.match_score || 0) >= 50)
    
    return matchesSearch && matchesSalary && matchesLocation && matchesExperience && matchesMatchScore
  })

  const clearFilters = () => {
    setSalaryFilter('all')
    setLocationFilter('all')
    setExperienceFilter('all')
    setMatchFilter('all')
  }

  const activeFilterCount = [salaryFilter, locationFilter, experienceFilter, matchFilter].filter(f => f !== 'all').length

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

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant={showFilters ? "default" : "outline"} 
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary-foreground text-primary rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Filter Jobs</h3>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
                  <X className="w-3 h-3" /> Clear All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Salary</label>
                <Select value={salaryFilter} onValueChange={setSalaryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Salary" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Salary</SelectItem>
                    <SelectItem value="50k">$50k+</SelectItem>
                    <SelectItem value="75k">$75k+</SelectItem>
                    <SelectItem value="100k">$100k+</SelectItem>
                    <SelectItem value="125k">$125k+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Location</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="dallas">Dallas</SelectItem>
                    <SelectItem value="fort worth">Fort Worth</SelectItem>
                    <SelectItem value="austin">Austin</SelectItem>
                    <SelectItem value="plano">Plano</SelectItem>
                    <SelectItem value="irving">Irving</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Experience</label>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Level</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Match Score</label>
                <Select value={matchFilter} onValueChange={setMatchFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Match" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Match</SelectItem>
                    <SelectItem value="90">90%+ Match</SelectItem>
                    <SelectItem value="75">75%+ Match</SelectItem>
                    <SelectItem value="50">50%+ Match</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}
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
