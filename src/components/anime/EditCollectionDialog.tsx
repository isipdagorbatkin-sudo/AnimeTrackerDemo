'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type AnimeCollection = Database['public']['Tables']['anime_collection']['Row']

interface EditCollectionDialogProps {
  item: AnimeCollection
  onClose: () => void
  onUpdate: (updatedItem: AnimeCollection) => void
}

export function EditCollectionDialog({ item, onClose, onUpdate }: EditCollectionDialogProps) {
  const [status, setStatus] = useState<'watching' | 'completed' | 'plan_to_watch' | 'dropped'>(item.status)
  const [rating, setRating] = useState<number>(item.rating || 0)
  const [review, setReview] = useState(item.review || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('anime_collection')
        .update({
          status,
          rating: rating > 0 ? rating : null,
          review: review.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .select()
        .single()

      if (error) throw error

      onUpdate(data)
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать запись</DialogTitle>
          <DialogDescription>
            Anime ID: {item.anime_id}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="watching">Смотрю</SelectItem>
                <SelectItem value="completed">Просмотрено</SelectItem>
                <SelectItem value="plan_to_watch">В планах</SelectItem>
                <SelectItem value="dropped">Брошено</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Оценка (1-100)</Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="100"
              placeholder="Оцените от 1 до 100"
              value={rating || ''}
              onChange={(e) => setRating(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review">Отзыв</Label>
            <Textarea
              id="review"
              placeholder="Напишите ваш отзыв..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
