import { JikanAnime, JikanSearchResponse, JikanErrorResponse } from './types'

const JIKAN_API_BASE = 'https://api.jikan.moe/v4'

export class JikanError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'JikanError'
  }
}

async function fetchJikan<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${JIKAN_API_BASE}${endpoint}`, {
      next: { revalidate: 3600 }, // Кешируем на 1 час
    })

    if (!response.ok) {
      const error: JikanErrorResponse = await response.json()
      throw new JikanError(error.message || 'Ошибка Jikan API', error.status)
    }

    return response.json()
  } catch (error) {
    if (error instanceof JikanError) {
      throw error
    }
    throw new JikanError('Не удалось подключиться к Jikan API')
  }
}

export async function searchAnime(query: string, page = 1, limit = 20): Promise<JikanSearchResponse> {
  if (!query.trim()) {
    throw new JikanError('Поисковый запрос не может быть пустым')
  }

  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString(),
  })

  return fetchJikan<JikanSearchResponse>(`/anime?${params.toString()}`)
}

export async function getAnimeById(id: number): Promise<JikanAnime> {
  return fetchJikan<JikanAnime>(`/anime/${id}`)
}

export async function getTopAnime(page = 1, limit = 20): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  return fetchJikan<JikanSearchResponse>(`/top/anime?${params.toString()}`)
}
