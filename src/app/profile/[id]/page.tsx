'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Calendar, User, MessageSquare, UserPlus, Check, Share2, Copy, Check as CheckIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AnimeDisplay } from '@/components/anime/AnimeDisplay'

type Profile = Database['public']['Tables']['profiles']['Row']
type AnimeCollection = Database['public']['Tables']['anime_collection']['Row']
type Friendship = Database['public']['Tables']['friendships']['Row']

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [collection, setCollection] = useState<AnimeCollection[]>([])
  const [friendship, setFriendship] = useState<Friendship | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadProfile()
  }, [params.id, mounted])

  const loadProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // Загружаем профиль
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!profileData) {
        router.push('/dashboard')
        return
      }

      setProfile(profileData)
      setIsCurrentUser(currentUser?.id === params.id)

      // Загружаем коллекцию
      const { data: collectionData } = await supabase
        .from('anime_collection')
        .select('*')
        .eq('user_id', params.id)
        .order('updated_at', { ascending: false })

      setCollection(collectionData || [])

      // Если это не текущий пользователь, проверяем статус дружбы
      if (currentUser && currentUser.id !== params.id) {
        const { data: friendshipData } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${params.id}),and(user_id.eq.${params.id},friend_id.eq.${currentUser.id})`)
          .single()

        setFriendship(friendshipData)
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        throw new Error('Вы не авторизованы')
      }

      const { error } = await supabase.from('friendships').insert({
        user_id: currentUser.id,
        friend_id: params.id,
        status: 'pending',
      })

      if (error) throw error

      setFriendship({
        id: '',
        user_id: currentUser.id,
        friend_id: params.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Ошибка при отправке заявки:', error)
    }
  }

  const handleAcceptFriendRequest = async () => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendship?.id)

      if (error) throw error

      loadProfile()
    } catch (error) {
      console.error('Ошибка при принятии заявки:', error)
    }
  }

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/add-friend/${params.id}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Ошибка при копировании ссылки:', error)
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

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      watching: 'Смотрю',
      completed: 'Просмотрено',
      plan_to_watch: 'В планах',
      dropped: 'Брошено',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      watching: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      plan_to_watch: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      dropped: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    }
    return colorMap[status] || ''
  }

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-muted-foreground mt-4">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Профиль не найден</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl mb-2">{profile.username}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Зарегистрирован: {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                </CardDescription>
              </div>
            </div>
            {isCurrentUser ? (
              <Button
                variant="outline"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Скопировано!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Поделиться профилем
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                {friendship?.status === 'accepted' ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/chat/${params.id}`)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Написать
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Скопировано!
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4 mr-2" />
                          Поделиться
                        </>
                      )}
                    </Button>
                  </>
                ) : friendship?.status === 'pending' ? (
                  friendship.user_id === params.id ? (
                    <Button onClick={handleAcceptFriendRequest}>
                      <Check className="h-4 w-4 mr-2" />
                      Принять заявку
                    </Button>
                  ) : (
                    <Badge variant="secondary">Заявка отправлена</Badge>
                  )
                ) : (
                  <Button onClick={handleSendFriendRequest}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Добавить в друзья
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="collection">
        <TabsList>
          <TabsTrigger value="collection">
            Коллекция ({collection.length})
          </TabsTrigger>
          <TabsTrigger value="stats">
            Статистика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collection" className="mt-6">
          {collection.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  {isCurrentUser
                    ? 'Ваша коллекция пуста. Найдите аниме в поиске!'
                    : 'У этого пользователя пока пустая коллекция.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {collection.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <AnimeDisplay animeId={item.anime_id} />
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Добавлено: {new Date(item.added_at).toLocaleDateString('ru-RU')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {item.rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Оценка:</span>
                          <span className="font-bold">{item.rating}/100</span>
                        </div>
                      )}
                      {item.review && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.review}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Всего аниме</p>
                  <p className="text-2xl font-bold">{collection.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Смотрю сейчас</p>
                  <p className="text-2xl font-bold">
                    {collection.filter(i => i.status === 'watching').length}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Просмотрено</p>
                  <p className="text-2xl font-bold">
                    {collection.filter(i => i.status === 'completed').length}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Средняя оценка</p>
                  <p className="text-2xl font-bold">
                    {collection.filter(i => i.rating).length > 0
                      ? Math.round(
                          collection.reduce((sum, i) => sum + (i.rating || 0), 0) /
                          collection.filter(i => i.rating).length
                        )
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
