'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  PenTool,
  LogOut,
  Award,
  Loader2,
  MailCheck,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/events', label: 'Events', icon: Calendar },
  { href: '/dashboard/participants', label: 'Participants', icon: Users },
  { href: '/dashboard/certificates', label: 'Certificates', icon: FileText },
  { href: '/dashboard/designer', label: 'Designer', icon: PenTool },
  { href: '/dashboard/email-logs', label: 'Email Logs', icon: MailCheck },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading session...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isDesigner = pathname === '/dashboard/designer'

  if (isDesigner) {
    return <div className="h-dvh max-h-dvh w-full overflow-hidden bg-background">{children}</div>
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Desktop Nav */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="bg-primary p-2 rounded-lg text-primary-foreground">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold text-foreground tracking-tight hidden sm:block">Certify</span>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end mr-1">
                <p className="text-sm font-medium text-foreground leading-none">
                  {session.user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[160px] mt-0.5">
                  {session.user?.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex h-8 text-xs gap-1.5"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
              {/* Mobile Logout */}
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden h-8 w-8 text-muted-foreground"
                onClick={() => signOut({ callbackUrl: '/login' })}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Scroll Nav (hidden on designer for full immersion) */}
        {!isDesigner && (
          <div className="lg:hidden border-t border-border bg-card overflow-x-auto">
            <nav className="flex px-4 py-2 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    pathname === item.href
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}