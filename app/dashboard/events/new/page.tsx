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
    organizationName: '',
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
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 bg-card p-5 rounded-lg border border-border shadow-sm">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Create Event</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Set up a new event for automated certificate generation.</p>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-foreground">Event Details</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Fill in the details below. An auto-generated event code will be created for certificates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Event Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Annual Tech Conference 2026"
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
                placeholder="Brief description of the event"
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
                  placeholder="e.g., Campus Auditorium"
                  value={formData.location}
                  onChange={handleChange}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="organizationName" className="text-xs">
                Organisation Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="organizationName"
                name="organizationName"
                placeholder="e.g., Indian Society for Technical Education"
                value={formData.organizationName}
                onChange={handleChange}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="organizationCode" className="text-xs">
                Organization Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="organizationCode"
                name="organizationCode"
                placeholder="e.g., ISTE (3-5 characters)"
                value={formData.organizationCode}
                onChange={handleChange}
                className="h-9 text-sm"
                maxLength={5}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Prefix used in certificate IDs (e.g., ISTE-EVENT-2026-000001)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customSlug" className="text-xs">
                Custom Slug <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="customSlug"
                name="customSlug"
                placeholder="e.g., TECH26 (2-6 characters)"
                value={formData.customSlug}
                onChange={handleChange}
                className="h-9 text-sm uppercase"
                maxLength={6}
              />
              <p className="text-[11px] text-muted-foreground">
                Short identifier for URLs (2-6 uppercase alphanumeric characters).
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/dashboard/events" className="flex-1">
                <Button type="button" variant="outline" className="w-full text-xs h-9">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1 text-xs h-9" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Creating Event...
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
