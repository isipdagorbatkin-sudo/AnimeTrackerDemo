'use client'

import { JikanAnime } from '@/lib/jikan/types'
import { getAnimeById } from '@/lib/jikan/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Calendar, PlayCircle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AnimeDisplayProps {
  animeId: number
  showFullInfo?: boolean
}

export function AnimeDisplay({ animeId, showFullInfo = false }: AnimeDisplayProps) {
  const [anime, setAnime] = useState<JikanAnime | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadAnime = async () => {
      try {
        setLoading(true)
        const data = await getAnimeById(animeId)
        setAnime(data)
      } catch (err: any) {
        setError(err.message || 'Ошибка при загрузке аниме')
      } finally {
        setLoading(false)
      }
    }

    loadAnime()
  }, [animeId, mounted])

  if (!mounted) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !anime) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            {error || 'Не удалось загрузить информацию об аниме'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-4">
          {anime.images?.jpg?.image_url && (
            <img
              src={anime.images.jpg.image_url}
              alt={anime.title}
              className="w-24 h-32 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <CardTitle className="mb-2">{anime.title}</CardTitle>
            {anime.title_japanese && (
              <CardDescription className="mb-2">
                {anime.title_japanese}
              </CardDescription>
            )}
            <div className="flex flex-wrap gap-2">
              {anime.genres?.slice(0, 3).map((genre) => (
                <Badge key={genre.mal_id} variant="secondary">
                  {genre.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      {showFullInfo && (
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{anime.score || 'N/A'}</span>
              <span className="text-muted-foreground">/ 10</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{anime.year || 'TBA'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <PlayCircle className="h-4 w-4" />
              <span>{anime.episodes || '?'} эпизодов</span>
            </div>
            {anime.synopsis && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {anime.synopsis}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
