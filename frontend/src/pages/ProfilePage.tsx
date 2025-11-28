import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSkills, useUpdateProfile, useSkillsWithProficiency, useUpdateSkillsWithProficiency } from '@/hooks/useRealTime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Check, Star, X } from 'lucide-react'
import { SkillWithProficiency } from '@/lib/api'

export function ProfilePage() {
  const { user } = useAuth()
  const { data: allSkills, isLoading: skillsLoading } = useSkills()
  const { data: userSkillsWithProf } = useSkillsWithProficiency()
  const updateProfile = useUpdateProfile()
  const updateSkillsWithProf = useUpdateSkillsWithProficiency()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    headline: '',
    bio: '',
    academic_background: '',
    location: ''
  })

  const [skillProficiencies, setSkillProficiencies] = useState<Record<number, number>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        first_name: user.profile.first_name || '',
        last_name: user.profile.last_name || '',
        headline: user.profile.headline || '',
        bio: user.profile.bio || '',
        academic_background: user.profile.academic_background || '',
        location: user.profile.location || ''
      })
    }
  }, [user])

  useEffect(() => {
    if (userSkillsWithProf) {
      const profMap: Record<number, number> = {}
      userSkillsWithProf.forEach(s => {
        profMap[s.id] = s.proficiency
      })
      setSkillProficiencies(profMap)
    }
  }, [userSkillsWithProf])

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleSaveSkills = async () => {
    try {
      const skills: SkillWithProficiency[] = Object.entries(skillProficiencies).map(([id, prof]) => ({
        skill_id: parseInt(id),
        proficiency: prof
      }))
      await updateSkillsWithProf.mutateAsync(skills)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to update skills:', error)
    }
  }

  const toggleSkill = (skillId: number) => {
    setSkillProficiencies(prev => {
      if (skillId in prev) {
        const { [skillId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [skillId]: 3 }
    })
  }

  const setProficiency = (skillId: number, level: number) => {
    setSkillProficiencies(prev => ({ ...prev, [skillId]: level }))
  }

  const selectedSkillIds = Object.keys(skillProficiencies).map(Number)
  const technicalSkills = allSkills?.filter(s => s.is_technical) || []
  const softSkills = allSkills?.filter(s => !s.is_technical) || []

  const StarRating = ({ skillId, value }: { skillId: number; value: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setProficiency(skillId, star)
          }}
          className="p-0.5 hover:scale-110 transition-transform"
        >
          <Star 
            className={`w-4 h-4 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Update your information to improve job matches</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Tell employers about yourself</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Professional Headline</Label>
            <Input
              id="headline"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              placeholder="e.g., Software Developer | Python Enthusiast"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., San Francisco, CA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic_background">Academic Background</Label>
            <Textarea
              id="academic_background"
              value={formData.academic_background}
              onChange={(e) => setFormData({ ...formData, academic_background: e.target.value })}
              placeholder="e.g., B.S. Computer Science, Stanford University, 2024"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself, your experience, and career goals..."
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSaveProfile} 
            disabled={updateProfile.isPending}
            className="gap-2"
          >
            {updateProfile.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {updateProfile.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Skills</CardTitle>
          <CardDescription>
            Select skills and rate your proficiency (1-5 stars). Technical skills get 2x matching weight.
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
                <h3 className="font-medium mb-3">Technical Skills (2x matching weight)</h3>
                <div className="flex flex-wrap gap-2">
                  {technicalSkills.map(skill => (
                    <Badge
                      key={skill.id}
                      variant={selectedSkillIds.includes(skill.id) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/80 transition-colors"
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {skill.name}
                      {selectedSkillIds.includes(skill.id) && (
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
                      variant={selectedSkillIds.includes(skill.id) ? 'secondary' : 'outline'}
                      className="cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {skill.name}
                      {selectedSkillIds.includes(skill.id) && (
                        <Check className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedSkillIds.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Rate Your Proficiency</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Click the stars to set your skill level (1 = Beginner, 5 = Expert)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedSkillIds.map(skillId => {
                      const skill = allSkills?.find(s => s.id === skillId)
                      if (!skill) return null
                      return (
                        <div key={skillId} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant={skill.is_technical ? 'default' : 'secondary'} className="text-xs">
                              {skill.is_technical ? 'Tech' : 'Soft'}
                            </Badge>
                            <span className="text-sm font-medium">{skill.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating skillId={skillId} value={skillProficiencies[skillId] || 3} />
                            <button
                              type="button"
                              onClick={() => toggleSkill(skillId)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Selected: {selectedSkillIds.length} skills 
                  ({selectedSkillIds.filter(id => technicalSkills.some(s => s.id === id)).length} technical, 
                  {selectedSkillIds.filter(id => softSkills.some(s => s.id === id)).length} soft)
                </p>
                <Button 
                  onClick={handleSaveSkills} 
                  disabled={updateSkillsWithProf.isPending}
                  className="gap-2"
                >
                  {updateSkillsWithProf.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {updateSkillsWithProf.isPending ? 'Saving...' : 'Save Skills'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
