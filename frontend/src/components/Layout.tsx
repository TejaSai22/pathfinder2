import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { User, Briefcase, GraduationCap, Users, LogOut, Home } from 'lucide-react'
import { NotificationsDropdown } from '@/components/shared/NotificationsDropdown'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'student':
        return <GraduationCap className="w-5 h-5" />
      case 'employer':
        return <Briefcase className="w-5 h-5" />
      case 'advisor':
        return <Users className="w-5 h-5" />
      default:
        return <User className="w-5 h-5" />
    }
  }

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'student':
        return 'Student'
      case 'employer':
        return 'Employer'
      case 'advisor':
        return 'Advisor'
      default:
        return 'User'
    }
  }

  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">P</span>
                </div>
                <span className="font-semibold text-lg">Pathfinder</span>
              </Link>
              
              <div className="hidden md:flex items-center gap-4">
                <Link to="/">
                  <Button 
                    variant={location.pathname === '/' ? 'secondary' : 'ghost'} 
                    size="sm"
                    className="gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                
                {user?.role === 'student' && (
                  <>
                    <Link to="/profile">
                      <Button 
                        variant={location.pathname === '/profile' ? 'secondary' : 'ghost'} 
                        size="sm"
                      >
                        Profile
                      </Button>
                    </Link>
                    <Link to="/applications">
                      <Button 
                        variant={location.pathname === '/applications' ? 'secondary' : 'ghost'} 
                        size="sm"
                      >
                        My Applications
                      </Button>
                    </Link>
                  </>
                )}
                
                {user?.role === 'employer' && (
                  <>
                    <Link to="/my-jobs">
                      <Button 
                        variant={location.pathname === '/my-jobs' ? 'secondary' : 'ghost'} 
                        size="sm"
                      >
                        My Jobs
                      </Button>
                    </Link>
                    <Link to="/post-job">
                      <Button 
                        variant={location.pathname === '/post-job' ? 'secondary' : 'ghost'} 
                        size="sm"
                      >
                        Post Job
                      </Button>
                    </Link>
                  </>
                )}
                
                {user?.role === 'advisor' && (
                  <Link to="/students">
                    <Button 
                      variant={location.pathname === '/students' ? 'secondary' : 'ghost'} 
                      size="sm"
                    >
                      My Students
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationsDropdown />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full">
                {getRoleIcon()}
                <span className="text-sm font-medium">{getRoleLabel()}</span>
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
