'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Users,
  Plus,
  Search,
  Upload,
  Trash2,
  Award,
  Mail,
  Loader2,
  CheckCircle,
  FileText,
  Download,
} from 'lucide-react'
import Papa from 'papaparse'

interface Event {
  _id: string
  name: string
  organizationCode: string
}

interface Participant {
  _id: string
  name: string
  email: string
  eventId: Event
  certificateId?: string
  certificateIssued: boolean
  certificateIssuedAt?: string
  createdAt: string
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showCSVDialog, setShowCSVDialog] = useState(false)
  const [issuingId, setIssuingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    eventId: '',
  })
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchEvents()
    fetchParticipants()
  }, [])

  useEffect(() => {
    let filtered = participants

    if (selectedEvent !== 'all') {
      filtered = filtered.filter((p) => p.eventId._id === selectedEvent)
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query)
      )
    }

    setFilteredParticipants(filtered)
  }, [searchQuery, selectedEvent, participants])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      if (Array.isArray(data)) {
        setEvents(data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchParticipants = async () => {
    try {
      const response = await fetch('/api/participants')
      const data = await response.json()
      if (Array.isArray(data)) {
        setParticipants(data)
        setFilteredParticipants(data)
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddParticipant = async () => {
    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newParticipant),
      })

      if (response.ok) {
        setShowAddDialog(false)
        setNewParticipant({ name: '', email: '', eventId: '' })
        fetchParticipants()
      }
    } catch (error) {
      console.error('Error adding participant:', error)
    }
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCsvFile(file)
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        preview: 5,
        complete: (results) => {
          setCsvPreview(results.data)
        },
      })
    }
  }

  const processCSVUpload = async () => {
    if (!csvFile || !newParticipant.eventId) return

    setUploading(true)
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('/api/participants', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participants: results.data,
              eventId: newParticipant.eventId,
            }),
          })

          if (response.ok) {
            setShowCSVDialog(false)
            setCsvFile(null)
            setCsvPreview([])
            setNewParticipant({ name: '', email: '', eventId: '' })
            fetchParticipants()
          }
        } catch (error) {
          console.error('Error uploading CSV:', error)
        } finally {
          setUploading(false)
        }
      },
    })
  }

  const issueCertificate = async (id: string) => {
    setIssuingId(id)
    try {
      const response = await fetch(`/api/participants/${id}`, {
        method: 'PATCH',
      })

      if (response.ok) {
        fetchParticipants()
      }
    } catch (error) {
      console.error('Error issuing certificate:', error)
    } finally {
      setIssuingId(null)
    }
  }

  const deleteParticipant = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/participants/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setParticipants(participants.filter((p) => p._id !== id))
      }
    } catch (error) {
      console.error('Error deleting participant:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const downloadSampleCSV = () => {
    const csv = 'name,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'participants-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Participants</h1>
          <p className="text-gray-500 mt-1">
            Manage participants and issue certificates
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showCSVDialog} onOpenChange={setShowCSVDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Import Participants from CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with name and email columns
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Event</Label>
                  <Select
                    value={newParticipant.eventId}
                    onValueChange={(value) =>
                      setNewParticipant({ ...newParticipant, eventId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event._id} value={event._id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CSV File</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                  />
                </div>
                {csvPreview.length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview (first 5 rows)</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.map((row, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-4 py-2">{row.name}</td>
                              <td className="px-4 py-2">{row.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadSampleCSV}
                  className="text-blue-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download sample CSV
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCSVDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={processCSVUpload}
                  disabled={!csvFile || !newParticipant.eventId || uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Participant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Participant</DialogTitle>
                <DialogDescription>
                  Enter the participant details below
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="event">Event</Label>
                  <Select
                    value={newParticipant.eventId}
                    onValueChange={(value) =>
                      setNewParticipant({ ...newParticipant, eventId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event._id} value={event._id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newParticipant.name}
                    onChange={(e) =>
                      setNewParticipant({ ...newParticipant, name: e.target.value })
                    }
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newParticipant.email}
                    onChange={(e) =>
                      setNewParticipant({ ...newParticipant, email: e.target.value })
                    }
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddParticipant}
                  disabled={!newParticipant.name || !newParticipant.email || !newParticipant.eventId}
                >
                  Add Participant
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map((event) => (
              <SelectItem key={event._id} value={event._id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Participants Table */}
      <Card>
        <CardContent className="p-0">
          {filteredParticipants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Participant
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Event
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Certificate
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredParticipants.map((participant) => (
                    <tr key={participant._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {participant.name}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {participant.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {participant.eventId.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {participant.eventId.organizationCode}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {participant.certificateIssued ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-xs text-green-600 font-medium">
                                Issued
                              </p>
                              <p className="text-xs text-gray-400 font-mono">
                                {participant.certificateId}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not issued</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!participant.certificateIssued && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => issueCertificate(participant._id)}
                              disabled={issuingId === participant._id}
                            >
                              {issuingId === participant._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Award className="h-4 w-4 mr-1" />
                                  Issue
                                </>
                              )}
                            </Button>
                          )}
                          {participant.certificateIssued && (
                            <Link
                              href={`/verify/${participant.certificateId}`}
                              target="_blank"
                            >
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Participant</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {participant.name}? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteParticipant(participant._id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={deletingId === participant._id}
                                >
                                  {deletingId === participant._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Delete'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || selectedEvent !== 'all'
                  ? 'No participants found'
                  : 'No participants yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedEvent !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add participants to get started'}
              </p>
              {!searchQuery && selectedEvent === 'all' && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Participant
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
