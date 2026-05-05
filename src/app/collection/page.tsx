'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, Trash2, Edit, Loader2 } from 'lucide-react'
import { EditCollectionDialog } from '@/components/anime/EditCollectionDialog'
import { AnimeDisplay } from '@/components/anime/AnimeDisplay'

type AnimeCollection = Database['public']['Tables']['anime_collection']['Row']

export default function CollectionPage() {
  const [collection, setCollection] = useState<AnimeCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [editingItem, setEditingItem] = useState<AnimeCollection | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadCollection()
  }, [mounted])

  const loadCollection = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Вы не авторизованы')
      }

      const { data, error } = await supabase
        .from('anime_collection')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      setCollection(data || [])
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке коллекции')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это аниме из коллекции?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('anime_collection')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCollection(collection.filter(item => item.id !== id))
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении')
    }
  }

  const handleUpdate = (updatedItem: AnimeCollection) => {
    setCollection(collection.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    ))
    setEditingItem(null)
  }

  const filteredCollection = activeTab === 'all'
    ? collection
    : collection.filter(item => item.status === activeTab)

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
          <p className="text-muted-foreground mt-4">Загрузка коллекции...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Моя коллекция</h1>
        <p className="text-muted-foreground">
          Всего аниме: {collection.length}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Все ({collection.length})</TabsTrigger>
          <TabsTrigger value="watching">
            Смотрю ({collection.filter(i => i.status === 'watching').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Просмотрено ({collection.filter(i => i.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="plan_to_watch">
            В планах ({collection.filter(i => i.status === 'plan_to_watch').length})
          </TabsTrigger>
          <TabsTrigger value="dropped">
            Брошено ({collection.filter(i => i.status === 'dropped').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredCollection.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {activeTab === 'all'
                ? 'Ваша коллекция пуста. Найдите аниме в поиске!'
                : 'В этом разделе пока ничего нет.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCollection.map((item) => (
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
                <div className="space-y-3">
                  {item.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{item.rating}/100</span>
                    </div>
                  )}
                  {item.review && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.review}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Изменить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingItem && (
        <EditCollectionDialog
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
