import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSkills, useUpdateProfile, useUpdateSkills } from '@/hooks/useRealTime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Check } from 'lucide-react'

export function ProfilePage() {
  const { user } = useAuth()
  const { data: allSkills, isLoading: skillsLoading } = useSkills()
  const updateProfile = useUpdateProfile()
  const updateSkills = useUpdateSkills()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    headline: '',
    bio: '',
    academic_background: '',
    location: ''
  })

  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
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
    if (user?.skills) {
      setSelectedSkills(user.skills.map(s => s.id))
    }
  }, [user])

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
      await updateSkills.mutateAsync(selectedSkills)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to update skills:', error)
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
            Select skills you possess. Technical skills (2x weight) are highlighted in blue.
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

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Selected: {selectedSkills.length} skills 
                  ({selectedSkills.filter(id => technicalSkills.some(s => s.id === id)).length} technical, 
                  {selectedSkills.filter(id => softSkills.some(s => s.id === id)).length} soft)
                </p>
                <Button 
                  onClick={handleSaveSkills} 
                  disabled={updateSkills.isPending}
                  className="gap-2"
                >
                  {updateSkills.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {updateSkills.isPending ? 'Saving...' : 'Save Skills'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
