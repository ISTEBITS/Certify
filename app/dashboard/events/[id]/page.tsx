'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Building2,
  MapPin,
  FileText,
  Save,
  Users,
  Award,
  PenTool,
  Eye,
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
  templateConfig?: {
    width: number
    height: number
    backgroundImage?: string
    elements: any[]
  }
  createdAt: string
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('details')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    organizationCode: '',
    customSlug: '',
  })

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch event')
      }
      const data = await response.json()
      setEvent(data)
      setFormData({
        name: data.name,
        description: data.description || '',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
        location: data.location || '',
        organizationCode: data.organizationCode,
        customSlug: data.slug || '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event')
      }

      setEvent(data)
      setSuccess('Event updated successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'customSlug') {
      const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
      setFormData({
        ...formData,
        [name]: formatted,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading event details...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Event Not Found</h1>
        </div>
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm mb-4">The event you are looking for does not exist.</p>
            <Link href="/dashboard/events">
              <Button size="sm" className="text-xs">Back to Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{event.name}</h1>
              <Badge variant="secondary" className="text-xs font-normal">
                {event.code}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Manage event parameters and design certificate templates.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/designer?event=${event._id}`}>
            <Button size="sm" className="text-xs gap-1.5">
              <PenTool className="h-3.5 w-3.5" />
              Design Certificate
            </Button>
          </Link>
          <Link href={`/dashboard/participants?event=${event._id}`}>
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Participants
            </Button>
          </Link>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <AlertDescription className="text-xs">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Event Date</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(event.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Certificates Issued</p>
              <p className="text-sm font-medium text-foreground">{event.certificateCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-purple-50 text-purple-600 p-2 rounded-lg">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Template Status</p>
              <p className="text-sm font-medium text-foreground">
                {event.templateConfig && event.templateConfig.elements?.length > 0
                  ? 'Configured'
                  : 'Pending Design'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-50 text-amber-600 p-2 rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Event Slug</p>
              <p className="text-sm font-medium text-foreground">{event.slug}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-8">
          <TabsTrigger value="details" className="text-xs">Event Details</TabsTrigger>
          <TabsTrigger value="certificate" className="text-xs">Certificate Template</TabsTrigger>
        </TabsList>

        {/* Event Details Tab */}
        <TabsContent value="details" className="mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Event Details</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Edit event settings and identifiers</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">
                    Event Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-xs">
                      Event Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="h-9 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-xs">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="organizationCode" className="text-xs">
                    Organization Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="organizationCode"
                    name="organizationCode"
                    value={formData.organizationCode}
                    onChange={handleChange}
                    className="h-9 text-sm"
                    maxLength={5}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customSlug" className="text-xs">Custom Slug</Label>
                  <Input
                    id="customSlug"
                    name="customSlug"
                    value={formData.customSlug}
                    onChange={handleChange}
                    className="h-9 text-sm uppercase"
                    maxLength={6}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" size="sm" className="text-xs gap-1.5" disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificate Template Tab */}
        <TabsContent value="certificate" className="mt-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Certificate Design</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Customize canvas dimensions and elements in the visual designer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Link href={`/dashboard/designer?event=${event._id}`}>
                  <Button size="sm" className="text-xs gap-1.5">
                    <PenTool className="h-3.5 w-3.5" />
                    Open Certificate Designer
                  </Button>
                </Link>
                <Link href={`/dashboard/participants?event=${event._id}`}>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    View Participants
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
