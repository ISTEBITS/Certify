'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Users,
  FileText,
  Award,
  TrendingUp,
  Plus,
  ArrowRight,
  PenTool,
  Loader2,
} from 'lucide-react'

interface DashboardStats {
  totalEvents: number
  totalParticipants: number
  totalCertificates: number
  recentEvents: Array<{
    _id: string
    name: string
    date: string
    certificateCount: number
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading dashboard overview...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-lg border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your events, participants, and certificate issuance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/events/new">
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-semibold text-foreground mt-1.5">
                  {stats?.totalEvents || 0}
                </p>
              </div>
              <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Participants</p>
                <p className="text-2xl font-semibold text-foreground mt-1.5">
                  {stats?.totalParticipants || 0}
                </p>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Certificates Issued</p>
                <p className="text-2xl font-semibold text-foreground mt-1.5">
                  {stats?.totalCertificates || 0}
                </p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg border border-purple-100">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Issuance Rate</p>
                <p className="text-2xl font-semibold text-foreground mt-1.5">
                  {stats && stats.totalParticipants > 0
                    ? Math.round((stats.totalCertificates / stats.totalParticipants) * 100)
                    : 0}%
                </p>
              </div>
              <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg border border-amber-100">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Recent Events</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Your most recently created events</CardDescription>
          </div>
          <Link href="/dashboard/events">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentEvents && stats.recentEvents.length > 0 ? (
            <div className="space-y-2.5">
              {stats.recentEvents.map((event) => (
                <div
                  key={event._id}
                  className="flex items-center justify-between p-3.5 bg-muted/40 rounded-lg hover:bg-muted transition-colors border border-border/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">
                        {event.certificateCount}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Certificates</p>
                    </div>
                    <Link href={`/dashboard/events/${event._id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-foreground">No events yet</p>
              <p className="text-xs mt-0.5">Create your first event to get started</p>
              <Link href="/dashboard/events/new">
                <Button variant="outline" size="sm" className="mt-3 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Create Event
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/events/new">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full border-border shadow-sm">
            <CardContent className="p-5 flex items-start gap-3.5">
              <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Create Event</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Set up an event with name, location, and certificate settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/participants">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full border-border shadow-sm">
            <CardContent className="p-5 flex items-start gap-3.5">
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Add Participants</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Import participant rosters via CSV or add them manually.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/designer">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full border-border shadow-sm">
            <CardContent className="p-5 flex items-start gap-3.5">
              <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg border border-purple-100">
                <PenTool className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Design Certificate</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Craft certificate designs with our Canva-style visual designer.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
