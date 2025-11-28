import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export function ProfileCompletionCard() {
  const navigate = useNavigate()
  
  const { data: completion, isLoading } = useQuery({
    queryKey: ['profile-completion'],
    queryFn: usersApi.getProfileCompletion,
  })

  if (isLoading || !completion) {
    return null
  }

  const isComplete = completion.completion_percentage >= 80

  return (
    <Card className={`p-4 mb-6 ${isComplete ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full ${isComplete ? 'bg-green-100' : 'bg-yellow-100'}`}>
          {isComplete ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">
              Profile Completion: {completion.completion_percentage}%
            </h3>
            {!isComplete && (
              <Button
                size="sm"
                variant="outline"
                className="text-sm"
                onClick={() => navigate('/profile')}
              >
                Complete Profile <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div
              className={`h-2.5 rounded-full transition-all ${
                isComplete ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${completion.completion_percentage}%` }}
            />
          </div>

          {!isComplete && (
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Complete your profile to {completion.completion_percentage < 80 ? 'unlock job recommendations' : 'improve your visibility'}:
              </p>
              <ul className="text-sm text-gray-500 list-disc list-inside">
                {completion.missing_fields.slice(0, 3).map((field) => (
                  <li key={field}>{field}</li>
                ))}
                {completion.missing_fields.length > 3 && (
                  <li>...and {completion.missing_fields.length - 3} more</li>
                )}
              </ul>
            </div>
          )}

          {isComplete && (
            <p className="text-sm text-green-700">
              Your profile is ready! You can now receive personalized job recommendations.
            </p>
          )}

          <div className="mt-2 text-xs text-gray-500">
            Skills added: {completion.skill_count}
          </div>
        </div>
      </div>
    </Card>
  )
}
