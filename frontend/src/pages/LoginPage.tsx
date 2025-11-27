import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { GraduationCap, Briefcase, Users } from 'lucide-react'

type Role = 'student' | 'employer' | 'advisor'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [error, setError] = useState('')
  
  const { login, register, isLoggingIn, isRegistering } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      if (isLogin) {
        await login({ email, password, role })
      } else {
        await register({ email, password, role })
      }
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    }
  }

  const roleIcons = {
    student: <GraduationCap className="w-5 h-5" />,
    employer: <Briefcase className="w-5 h-5" />,
    advisor: <Users className="w-5 h-5" />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">P</span>
          </div>
          <CardTitle className="text-2xl">Pathfinder v2</CardTitle>
          <CardDescription>
            IT Career Matching Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={role} onValueChange={(v) => setRole(v as Role)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="student" className="gap-2">
                {roleIcons.student}
                <span className="hidden sm:inline">Student</span>
              </TabsTrigger>
              <TabsTrigger value="employer" className="gap-2">
                {roleIcons.employer}
                <span className="hidden sm:inline">Employer</span>
              </TabsTrigger>
              <TabsTrigger value="advisor" className="gap-2">
                {roleIcons.advisor}
                <span className="hidden sm:inline">Advisor</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoggingIn || isRegistering}
            >
              {isLoggingIn || isRegistering 
                ? 'Please wait...' 
                : isLogin ? 'Sign In' : 'Create Account'
              }
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Demo accounts (password: demo123)
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                className="p-2 bg-secondary rounded text-center hover:bg-secondary/80"
                onClick={() => {
                  setEmail('student@demo.com')
                  setPassword('demo123')
                  setRole('student')
                }}
              >
                Student
              </button>
              <button
                type="button"
                className="p-2 bg-secondary rounded text-center hover:bg-secondary/80"
                onClick={() => {
                  setEmail('employer@demo.com')
                  setPassword('demo123')
                  setRole('employer')
                }}
              >
                Employer
              </button>
              <button
                type="button"
                className="p-2 bg-secondary rounded text-center hover:bg-secondary/80"
                onClick={() => {
                  setEmail('advisor@demo.com')
                  setPassword('demo123')
                  setRole('advisor')
                }}
              >
                Advisor
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
