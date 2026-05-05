'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']
type Friendship = Database['public']['Tables']['friendships']['Row']

interface ChatPreview {
  friendId: string
  friend: Profile
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export default function ChatPage() {
  const router = useRouter()
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Загружаем друзей
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*, friend:profiles!friendships_friend_id_fkey(*)')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (!friendships) {
        setChats([])
        setLoading(false)
        return
      }

      // Для каждого друга загружаем последнее сообщение и количество непрочитанных
      const chatPreviews: ChatPreview[] = await Promise.all(
        friendships.map(async (friendship) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendship.friend_id}),and(sender_id.eq.${friendship.friend_id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1)

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', friendship.friend_id)
            .eq('receiver_id', user.id)
            .is('read_at', null)

          return {
            friendId: friendship.friend_id,
            friend: friendship.friend,
            lastMessage: messages && messages.length > 0 ? messages[0].content : undefined,
            lastMessageTime: messages && messages.length > 0 ? messages[0].created_at : undefined,
            unreadCount: unreadCount || 0,
          }
        })
      )

      // Сортируем по времени последнего сообщения
      chatPreviews.sort((a, b) => {
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      })

      setChats(chatPreviews)
    } catch (error) {
      console.error('Ошибка при загрузке чатов:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин. назад`
    if (diffHours < 24) return `${diffHours} ч. назад`
    if (diffDays < 7) return `${diffDays} дн. назад`

    return date.toLocaleDateString('ru-RU')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Загрузка чатов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Чаты</h1>
        <p className="text-muted-foreground">
          Общайтесь с друзьями
        </p>
      </div>

      {chats.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                У вас пока нет чатов. Добавьте друзей и начните общение!
              </p>
              <button
                onClick={() => router.push('/friends')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Перейти к друзьям
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {chats.map((chat) => (
            <Card
              key={chat.friendId}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/chat/${chat.friendId}`)}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={chat.friend.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(chat.friend.username)}
                      </AvatarFallback>
                    </Avatar>
                    {chat.unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{chat.friend.username}</p>
                      {chat.lastMessageTime && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage || 'Нет сообщений'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
