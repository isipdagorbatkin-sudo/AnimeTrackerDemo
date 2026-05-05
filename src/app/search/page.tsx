'use client'

import { useState, useEffect } from 'react'
import { searchAnime } from '@/lib/jikan/client'
import { JikanAnime } from '@/lib/jikan/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Star, Calendar, PlayCircle, Loader2 } from 'lucide-react'
import { AnimeCard } from '@/components/anime/AnimeCard'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JikanAnime[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])

    try {
      const response = await searchAnime(query)
      setResults(response.data)
    } catch (err: any) {
      setError(err.message || 'Ошибка при поиске')
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Поиск аниме</h1>
        <p className="text-muted-foreground">
          Найдите аниме и добавьте в свою коллекцию
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Введите название аниме..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Поиск...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Найти
              </>
            )}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((anime) => (
            <AnimeCard key={anime.mal_id} anime={anime} />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Ничего не найдено. Попробуйте другой запрос.
          </p>
        </div>
      )}

      {!loading && results.length === 0 && !query && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Введите название аниме для поиска
          </p>
        </div>
      )}
    </div>
  )
}
