import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/layout/Navigation'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'AnimeTracker - Отслеживай своё аниме',
  description: 'Приложение для отслеживания аниме с социальной сетью',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userData = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    userData = profile
  }

  const showNavigation = !!user?.id

  return (
    <html lang="ru">
      <body className={inter.className}>
        {showNavigation ? (
          <>
            <Navigation
              username={userData?.username}
              avatarUrl={userData?.avatar_url}
            />
            <main className="min-h-[calc(100vh-4rem)] pb-16 md:pb-0">
              {children}
            </main>
            <MobileNavigation />
          </>
        ) : (
          <main className="min-h-screen">
            {children}
          </main>
        )}
        <Analytics />
      </body>
    </html>
  )
}
