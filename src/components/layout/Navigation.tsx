'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/ui/button'
import { Home, BookOpen, Search, Users, MessageSquare, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Главная', icon: Home },
  { href: '/collection', label: 'Коллекция', icon: BookOpen },
  { href: '/search', label: 'Поиск', icon: Search },
  { href: '/friends', label: 'Друзья', icon: Users },
  { href: '/chat', label: 'Чаты', icon: MessageSquare },
]

interface NavigationProps {
  username?: string
  avatarUrl?: string | null
}

export function Navigation({ username, avatarUrl }: NavigationProps) {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl hidden sm:inline-block">AnimeTracker</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'gap-2',
                        isActive && 'bg-secondary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <UserMenu username={username} avatarUrl={avatarUrl} />
          </div>
        </div>
      </div>
    </nav>
  )
}
