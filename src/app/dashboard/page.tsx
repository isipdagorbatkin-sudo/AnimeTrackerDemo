import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, MessageSquare, TrendingUp } from 'lucide-react'
import { AnimeDisplayServer } from '@/components/anime/AnimeDisplayServer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Получаем статистику пользователя
  const [
    collectionCount,
    watchingCount,
    friendsCount,
    unreadMessagesCount
  ] = await Promise.all([
    supabase
      .from('anime_collection')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('anime_collection')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'watching'),
    supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'accepted'),
    supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .is('read_at', null),
  ])

  const stats = [
    {
      title: 'Всего аниме',
      value: collectionCount.count || 0,
      description: 'В вашей коллекции',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Смотрю сейчас',
      value: watchingCount.count || 0,
      description: 'Активное просмотр',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Друзья',
      value: friendsCount.count || 0,
      description: 'В друзьях',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Непрочитанные',
      value: unreadMessagesCount.count || 0,
      description: 'Сообщения',
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ]

  // Получаем последние добавленные аниме
  const { data: recentAnime } = await supabase
    .from('anime_collection')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })
    .limit(5)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Добро пожаловать!</h1>
        <p className="text-muted-foreground">
          Вот ваша статистика и последние добавления
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Последние добавления</CardTitle>
          <CardDescription>
            Аниме, которые вы недавно добавили в коллекцию
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAnime && recentAnime.length > 0 ? (
            <div className="space-y-4">
              {recentAnime.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <AnimeDisplayServer animeId={item.anime_id} />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Статус: {getStatusText(item.status)}
                    </span>
                    {item.rating && (
                      <div className="text-sm font-medium">
                        Оценка: {item.rating}/100
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Вы пока не добавили аниме в коллекцию
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    watching: 'Смотрю',
    completed: 'Просмотрено',
    plan_to_watch: 'В планах',
    dropped: 'Брошено',
  }
  return statusMap[status] || status
}
