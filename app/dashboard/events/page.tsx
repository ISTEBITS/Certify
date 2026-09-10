'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Award,
  MapPin,
  Users,
  FileText,
  Loader2,
} from 'lucide-react'

interface Event {
  _id: string
  name: string
  description?: string
  code: string
  slug: string
  date: string
  location?: string
  organizationCode: string
  certificateCount: number
  createdAt: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredEvents(
        events.filter(
          (event) =>
            event.name.toLowerCase().includes(query) ||
            event.code.toLowerCase().includes(query) ||
            event.slug.toLowerCase().includes(query) ||
            event.organizationCode.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, events])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      if (Array.isArray(data)) {
        setEvents(data)
        setFilteredEvents(data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setEvents(events.filter((e) => e._id !== id))
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading events...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-lg border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">Events</h1>
            <Badge variant="secondary" className="text-xs font-normal">
              {filteredEvents.length} Total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your events and configure certificate templates.
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events by name, code, or organization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm bg-card border-border"
        />
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <Card key={event._id} className="border-border shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-foreground truncate">{event.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[11px] font-normal">
                        Code: {event.code}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Org: {event.organizationCode}</span>
                    </div>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(event.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{event.certificateCount} certificates issued</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-border/60">
                  <Link href={`/dashboard/events/${event._id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Manage
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-semibold">Delete Event?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground">
                          Are you sure you want to delete &quot;{event.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteEvent(event._id)}
                          className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs gap-1.5"
                          disabled={deletingId === event._id}
                        >
                          {deletingId === event._id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Award className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <h3 className="text-sm font-medium text-foreground mb-1">
              {searchQuery ? 'No events found' : 'No events created yet'}
            </h3>
            <p className="text-xs max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'Create your first event to configure certificates.'}
            </p>
            {!searchQuery && (
              <Link href="/dashboard/events/new">
                <Button size="sm" className="text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Create Event
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
