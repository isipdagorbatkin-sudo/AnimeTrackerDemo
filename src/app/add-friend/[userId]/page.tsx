'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Check, X, Loader2 } from 'lucide-react'

export default function AddFriendPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sent' | 'already_friends' | 'error'>('idle')

  useEffect(() => {
    loadUserData()
  }, [params.userId])

  const loadUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (user.id === params.userId) {
        setError('Вы не можете добавить себя в друзья')
        setLoading(false)
        return
      }

      // Проверяем, не друзья ли они уже
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${params.userId}),and(user_id.eq.${params.userId},friend_id.eq.${user.id})`)
        .single()

      if (existingFriendship) {
        setStatus('already_friends')
        setUserData(existingFriendship)
        setLoading(false)
        return
      }

      // Получаем данные пользователя
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.userId)
        .single()

      if (!profile) {
        setError('Пользователь не найден')
        setLoading(false)
        return
      }

      setUserData(profile)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке данных')
      setLoading(false)
    }
  }

  const handleAddFriend = async () => {
    try {
      setSending(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: params.userId,
          status: 'pending',
        })

      if (error) throw error

      setStatus('sent')
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке запроса')
      setStatus('error')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => router.push('/friends')}>
                Вернуться к друзьям
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'already_friends') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Вы уже друзья!</h2>
              <p className="text-muted-foreground mb-4">
                Этот пользователь уже добавлен в ваши друзья
              </p>
              <Button onClick={() => router.push('/friends')}>
                Вернуться к друзьям
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Запрос отправлен!</h2>
              <p className="text-muted-foreground mb-4">
                Запрос на добавление в друзья отправлен пользователю {userData?.username}
              </p>
              <Button onClick={() => router.push('/friends')}>
                Вернуться к друзьям
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Добавить в друзья</CardTitle>
          <CardDescription>
            Хотите добавить {userData?.username} в друзья?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              {userData?.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt={userData.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {userData?.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-semibold">{userData?.username}</h3>
                <p className="text-sm text-muted-foreground">
                  Пользователь AnimeTracker
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddFriend}
                disabled={sending}
                className="flex-1"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Добавить в друзья
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/friends')}
                disabled={sending}
              >
                Отмена
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
