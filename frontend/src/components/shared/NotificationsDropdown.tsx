import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { notificationsApi, Notification } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 30000,
  })

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  })

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const unreadCount = unreadData?.count || 0

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'application_status':
        return 'bg-blue-100 text-blue-800'
      case 'interview':
        return 'bg-purple-100 text-purple-800'
      case 'match':
        return 'bg-green-100 text-green-800'
      case 'feedback':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-12 z-50 w-80 max-h-96 overflow-hidden shadow-lg">
            <div className="p-3 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#00853E] hover:text-[#006b32]"
                  onClick={() => markAllAsReadMutation.mutate()}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsReadMutation.mutate(notification.id)
                      }
                      if (notification.link) {
                        window.location.href = notification.link
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(notification.notification_type)}`}>
                            {notification.notification_type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsReadMutation.mutate(notification.id)
                          }}
                          className="text-gray-400 hover:text-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {notification.link && (
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
