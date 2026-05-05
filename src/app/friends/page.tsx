'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, Check, X, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']
type Friendship = Database['public']['Tables']['friendships']['Row']

export default function FriendsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [friends, setFriends] = useState<(Friendship & { friend: Profile })[]>([])
  const [pendingRequests, setPendingRequests] = useState<(Friendship & { user: Profile })[]>([])
  const [sentRequests, setSentRequests] = useState<(Friendship & { friend: Profile })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFriendsData()
  }, [])

  const loadFriendsData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Вы не авторизованы')
      }

      // Загружаем принятые друзья
      const { data: acceptedFriends } = await supabase
        .from('friendships')
        .select('*, friend:profiles!friendships_friend_id_fkey(*)')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      // Загружаем входящие заявки
      const { data: incomingRequests } = await supabase
        .from('friendships')
        .select('*, user:profiles!friendships_user_id_fkey(*)')
        .eq('friend_id', user.id)
        .eq('status', 'pending')

      // Загружаем отправленные заявки
      const { data: outgoingRequests } = await supabase
        .from('friendships')
        .select('*, friend:profiles!friendships_friend_id_fkey(*)')
        .eq('user_id', user.id)
        .eq('status', 'pending')

      setFriends(acceptedFriends || [])
      setPendingRequests(incomingRequests || [])
      setSentRequests(outgoingRequests || [])
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке данных')
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .limit(10)

      if (error) throw error

      setSearchResults(data || [])
    } catch (err: any) {
      setError(err.message || 'Ошибка при поиске')
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Вы не авторизованы')
      }

      const { error } = await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      })

      if (error) throw error

      // Добавляем в отправленные заявки
      const friend = searchResults.find(p => p.id === friendId)
      if (friend) {
        setSentRequests([...sentRequests, {
          id: '',
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          friend,
        }])
      }

      setSearchResults(searchResults.filter(p => p.id !== friendId))
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке заявки')
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) throw error

      loadFriendsData()
    } catch (err: any) {
      setError(err.message || 'Ошибка при принятии заявки')
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) throw error

      loadFriendsData()
    } catch (err: any) {
      setError(err.message || 'Ошибка при отклонении заявки')
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Друзья</h1>
        <p className="text-muted-foreground">
          Найдите друзей и общайтесь
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="friends">
            Друзья ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Заявки ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="search">
            Поиск
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          {friends.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  У вас пока нет друзей. Найдите их в поиске!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {friends.map((friendship) => (
                <Card key={friendship.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={friendship.friend.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(friendship.friend.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{friendship.friend.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Друзья с {new Date(friendship.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/chat/${friendship.friend.id}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Написать
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  У вас нет входящих заявок
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={request.user.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(request.user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Хочет добавить вас в друзья
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acceptFriendRequest(request.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Принять
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectFriendRequest(request.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Поиск пользователей</CardTitle>
              <CardDescription>
                Найдите друзей по имени пользователя
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <Input
                  type="text"
                  placeholder="Введите имя пользователя..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !searchQuery.trim()}>
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? 'Поиск...' : 'Найти'}
                </Button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchResults.map((profile) => {
                    const isRequestSent = sentRequests.some(r => r.friend_id === profile.id)
                    return (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {getInitials(profile.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.username}</p>
                            <p className="text-sm text-muted-foreground">
                              Зарегистрирован: {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        {isRequestSent ? (
                          <Badge variant="secondary">Заявка отправлена</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendFriendRequest(profile.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Добавить
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {!loading && searchResults.length === 0 && searchQuery && (
                <p className="text-center text-muted-foreground py-8">
                  Пользователи не найдены
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
