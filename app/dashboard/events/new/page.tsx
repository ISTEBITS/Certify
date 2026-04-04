'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, Calendar, Building2, MapPin, FileText } from 'lucide-react'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    organizationCode: '',
    customSlug: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event')
      }

      router.push('/dashboard/events')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
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

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
          <p className="text-gray-500 mt-1">Set up a new event for certificate generation</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Fill in the details below to create your event. An auto-generated event code will be created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                Custom identifier for this event (2-6 alphanumeric characters). Auto-generated from event name if not provided.
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
              <Link href="/dashboard/events" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
