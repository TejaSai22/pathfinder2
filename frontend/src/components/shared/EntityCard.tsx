import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, DollarSign, Briefcase, Clock, User, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface EntityCardProps {
  type: 'job' | 'applicant' | 'student'
  title: string
  subtitle?: string
  description?: string
  matchScore?: number
  location?: string
  salary?: { min?: number; max?: number }
  jobType?: string
  experienceLevel?: string
  skills?: { name: string; is_technical: boolean }[]
  status?: string
  applicationCount?: number
  onClick?: () => void
  actions?: React.ReactNode
  className?: string
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-500"
  if (score >= 60) return "bg-yellow-500"
  if (score >= 40) return "bg-orange-500"
  return "bg-red-500"
}

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

export function EntityCard({
  type,
  title,
  subtitle,
  description,
  matchScore,
  location,
  salary,
  jobType,
  experienceLevel,
  skills,
  status,
  applicationCount,
  onClick,
  actions,
  className
}: EntityCardProps) {
  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-shadow cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {matchScore !== undefined && (
            <div className="flex flex-col items-center ml-4">
              <div 
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg",
                  getScoreColor(matchScore)
                )}
              >
                {matchScore}%
              </div>
              <span className="text-xs text-muted-foreground mt-1">Match</span>
            </div>
          )}
          {status && (
            <Badge variant={getStatusVariant(status)} className="ml-2">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          {location && (
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              {location}
            </div>
          )}
          {salary && (salary.min || salary.max) && (
            <div className="flex items-center text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3 mr-1" />
              {salary.min && salary.max 
                ? `$${(salary.min/1000).toFixed(0)}k - $${(salary.max/1000).toFixed(0)}k`
                : salary.min 
                  ? `From $${(salary.min/1000).toFixed(0)}k`
                  : `Up to $${(salary.max!/1000).toFixed(0)}k`
              }
            </div>
          )}
          {jobType && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Briefcase className="w-3 h-3 mr-1" />
              {jobType}
            </div>
          )}
          {experienceLevel && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              {experienceLevel}
            </div>
          )}
          {applicationCount !== undefined && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Target className="w-3 h-3 mr-1" />
              {applicationCount} applications
            </div>
          )}
        </div>

        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {skills.slice(0, 6).map((skill) => (
              <Badge 
                key={skill.name} 
                variant={skill.is_technical ? "default" : "secondary"}
                className="text-xs"
              >
                {skill.name}
              </Badge>
            ))}
            {skills.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{skills.length - 6} more
              </Badge>
            )}
          </div>
        )}

        {actions && (
          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
