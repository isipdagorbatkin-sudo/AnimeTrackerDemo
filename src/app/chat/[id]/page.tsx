'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']
type Message = Database['public']['Tables']['messages']['Row']

export default function ChatDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [friend, setFriend] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadChat()
    subscribeToMessages()

    return () => {
      supabase.channel('messages').unsubscribe()
    }
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Загружаем информацию о друге
      const { data: friendData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!friendData) {
        router.push('/chat')
        return
      }

      setFriend(friendData)

      // Загружаем сообщения
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${params.id}),and(sender_id.eq.${params.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      setMessages(messagesData || [])

      // Отмечаем сообщения как прочитанные
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', params.id)
        .eq('receiver_id', user.id)
        .is('read_at', null)
    } catch (error) {
      console.error('Ошибка при загрузке чата:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const { data: { user } } = supabase.auth.getUserSync()

    supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user?.id},receiver_id.eq.${params.id}),and(sender_id.eq.${params.id},receiver_id.eq.${user?.id}))`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])

          // Если сообщение от друга, отмечаем как прочитанное
          if (newMessage.sender_id === params.id) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMessage.id)
          }
        }
      )
      .subscribe()
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Вы не авторизованы')
      }

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: params.id,
        content: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error)
    } finally {
      setSending(false)
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
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Загрузка чата...</p>
        </div>
      </div>
    )
  }

  if (!friend) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Чат не найден</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: { user: currentUser } } = supabase.auth.getUserSync()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/chat')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к чатам
        </Button>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={friend.avatar_url || undefined} />
            <AvatarFallback>
              {getInitials(friend.username)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{friend.username}</h1>
            <p className="text-sm text-muted-foreground">Онлайн</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-300px)] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Начните общение! Напишите первое сообщение.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === currentUser?.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isOwn
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                placeholder="Напишите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
