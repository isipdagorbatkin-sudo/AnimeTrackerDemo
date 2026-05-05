'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Camera, Save } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Вы не авторизованы')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setUsername(data.username)
      setAvatarUrl(data.avatar_url || '')
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке профиля')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Вы не авторизованы')
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          avatar_url: avatarUrl.trim() || null,
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Настройки профиля</h1>
        <p className="text-muted-foreground">
          Управляйте своим профилем
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Информация профиля</CardTitle>
            <CardDescription>
              Обновите свои данные
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md text-sm">
                  Профиль успешно обновлён!
                </div>
              )}

              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-3xl">
                    {getInitials(username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Аватар
                  </p>
                  <Button type="button" variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Загрузить фото
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Функция загрузки будет добавлена позже
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">URL аватара</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Вставьте ссылку на изображение для аватара
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="animefan2024"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={saving}
                  required
                  minLength={3}
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  От 3 до 30 символов
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Опасная зона</CardTitle>
            <CardDescription>
              Удаление аккаунта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              После удаления аккаунта все ваши данные будут безвозвратно удалены.
            </p>
            <Button variant="destructive" size="sm">
              Удалить аккаунт
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
