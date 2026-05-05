import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, MessageSquare, Search, Star, Zap } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: BookOpen,
      title: 'Коллекция аниме',
      description: 'Отслеживайте просмотренные аниме, ставьте оценки и пишите отзывы',
    },
    {
      icon: Search,
      title: 'Поиск аниме',
      description: 'Ищите аниме по названию через базу данных MyAnimeList',
    },
    {
      icon: Users,
      title: 'Социальная сеть',
      description: 'Находите друзей, смотрите их коллекции и общайтесь',
    },
    {
      icon: MessageSquare,
      title: 'Личные чаты',
      description: 'Общайтесь с друзьями в реальном времени',
    },
    {
      icon: Star,
      title: 'Оценки и отзывы',
      description: 'Ставьте оценки от 1 до 100 и делитесь мнением',
    },
    {
      icon: Zap,
      title: 'Быстрый старт',
      description: 'Простая регистрация и интуитивный интерфейс',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AnimeTracker
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Отслеживайте своё аниме, находите друзей и общайтесь — всё в одном месте
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Начать бесплатно
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Войти
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Возможности приложения
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Готовы начать?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к сообществу любителей аниме уже сегодня
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Создать аккаунт
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 AnimeTracker. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}
