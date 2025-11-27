import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateJob, useSkills } from '@/hooks/useRealTime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PostJobPage() {
  const navigate = useNavigate()
  const { data: allSkills, isLoading: skillsLoading } = useSkills()
  const createJob = useCreateJob()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salary_min: '',
    salary_max: '',
    job_type: 'Full-time',
    experience_level: 'Entry Level'
  })

  const [selectedSkills, setSelectedSkills] = useState<number[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createJob.mutateAsync({
        title: formData.title,
        description: formData.description,
        location: formData.location || undefined,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : undefined,
        job_type: formData.job_type,
        experience_level: formData.experience_level,
        required_skill_ids: selectedSkills
      })
      navigate('/my-jobs')
    } catch (error) {
      console.error('Failed to create job:', error)
    }
  }

  const toggleSkill = (skillId: number) => {
    setSelectedSkills(prev => 
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  const technicalSkills = allSkills?.filter(s => s.is_technical) || []
  const softSkills = allSkills?.filter(s => !s.is_technical) || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/my-jobs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Post New Job</h1>
          <p className="text-muted-foreground">Create a new IT job posting</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Basic information about the position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Senior Software Developer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA or Remote"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type</Label>
                <select
                  id="job_type"
                  value={formData.job_type}
                  onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary_min">Salary Min ($)</Label>
                <Input
                  id="salary_min"
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  placeholder="80000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_max">Salary Max ($)</Label>
                <Input
                  id="salary_max"
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                  placeholder="120000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience_level">Experience Level</Label>
                <select
                  id="experience_level"
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Entry Level</option>
                  <option>Mid Level</option>
                  <option>Senior Level</option>
                  <option>Lead/Principal</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
            <CardDescription>
              Select skills required for this position. Technical skills have 2x matching weight.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {skillsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-medium mb-3">Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {technicalSkills.map(skill => (
                      <Badge
                        key={skill.id}
                        variant={selectedSkills.includes(skill.id) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary/80 transition-colors"
                        onClick={() => toggleSkill(skill.id)}
                      >
                        {skill.name}
                        {selectedSkills.includes(skill.id) && (
                          <Check className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Soft Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {softSkills.map(skill => (
                      <Badge
                        key={skill.id}
                        variant={selectedSkills.includes(skill.id) ? 'secondary' : 'outline'}
                        className="cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={() => toggleSkill(skill.id)}
                      >
                        {skill.name}
                        {selectedSkills.includes(skill.id) && (
                          <Check className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Selected: {selectedSkills.length} skills
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={createJob.isPending || !formData.title || !formData.description}
            className="gap-2"
          >
            {createJob.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {createJob.isPending ? 'Posting...' : 'Post Job'}
          </Button>
          <Link to="/my-jobs">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
