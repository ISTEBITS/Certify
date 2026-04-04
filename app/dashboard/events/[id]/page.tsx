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
  Trash2,
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
    
    // Auto-format slug to uppercase and remove non-alphanumeric characters
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Not Found</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">The event you're looking for doesn't exist.</p>
            <Link href="/dashboard/events">
              <Button>Back to Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <Badge variant="secondary" className="font-mono">
                {event.code}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">Manage event details and certificate template</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/designer?event=${event._id}`}>
            <Button variant="outline">
              <PenTool className="h-4 w-4 mr-2" />
              Design Certificate
            </Button>
          </Link>
          <Link href={`/dashboard/participants?event=${event._id}`}>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              View Participants
            </Button>
          </Link>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Event Date</p>
              <p className="font-medium">
                {new Date(event.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Certificates Issued</p>
              <p className="font-medium">{event.certificateCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Template Status</p>
              <p className="font-medium">
                {event.templateConfig && event.templateConfig.elements?.length > 0
                  ? 'Designed'
                  : 'Not Designed'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Event Slug</p>
              <p className="font-mono font-medium">{event.slug}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Event Details</TabsTrigger>
          <TabsTrigger value="certificate">Certificate Template</TabsTrigger>
        </TabsList>

        {/* Event Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Edit the event information below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Event Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Annual Tech Conference 2025"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="description"
                      name="description"
                      placeholder="Brief description of the event"
                      value={formData.description}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      Event Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="location"
                        name="location"
                        placeholder="e.g., New York, NY"
                        value={formData.location}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationCode">
                    Organization Code <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="organizationCode"
                      name="organizationCode"
                      placeholder="e.g., ACME (3-5 characters)"
                      value={formData.organizationCode}
                      onChange={handleChange}
                      className="pl-10"
                      maxLength={5}
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    This code will be used in certificate IDs (e.g., ACME-EVENT-2025-000001-A1B2)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customSlug">
                    Custom Slug <span className="text-xs text-gray-500 font-normal">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="customSlug"
                      name="customSlug"
                      placeholder="e.g., TECH25 (2-6 characters)"
                      value={formData.customSlug}
                      onChange={handleChange}
                      className="uppercase"
                      maxLength={6}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Custom identifier for this event (2-6 alphanumeric characters). Leave empty to keep current slug.
                  </p>
                  {formData.customSlug && formData.customSlug.length > 0 && formData.customSlug.length < 2 && (
                    <p className="text-sm text-amber-600">
                      ⚠️ Slug must be at least 2 characters
                    </p>
                  )}
                  {formData.customSlug && formData.customSlug.length >= 2 && formData.customSlug.length <= 6 && (
                    <p className="text-sm text-green-600">
                      ✓ Valid slug
                    </p>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificate Template Tab */}
        <TabsContent value="certificate">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Template</CardTitle>
              <CardDescription>
                Design your certificate template using the certificate designer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {event.templateConfig && event.templateConfig.elements?.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Template Configured</p>
                        <p className="text-sm text-green-600">
                          Certificate template has {event.templateConfig.elements.length} elements configured
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Canvas Size</p>
                      <p className="font-medium">
                        {event.templateConfig.width} x {event.templateConfig.height}px
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Background</p>
                      <p className="font-medium">
                        {event.templateConfig.backgroundImage ? 'Custom Image' : 'None'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Template Elements</p>
                    <div className="space-y-2">
                      {event.templateConfig.elements.map((el: any) => (
                        <div
                          key={el.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {el.type}
                            </Badge>
                            <span className="font-medium">
                              {el.field === 'custom' ? el.content : el.field}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            ({el.x}, {el.y})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/designer?event=${event._id}`} className="flex-1">
                      <Button className="w-full">
                        <PenTool className="h-4 w-4 mr-2" />
                        Edit Template
                      </Button>
                    </Link>
                    <Link href={`/dashboard/participants?event=${event._id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Certificates
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Certificate Template Yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Design a beautiful certificate template for this event using our drag-and-drop designer
                  </p>
                  <Link href={`/dashboard/designer?event=${event._id}`}>
                    <Button size="lg">
                      <PenTool className="h-4 w-4 mr-2" />
                      Open Certificate Designer
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
