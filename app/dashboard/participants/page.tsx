'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
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
  Download,
  GraduationCap,
  Trophy,
  Building2,
  Eye,
  AlertCircle,
} from 'lucide-react'
import Papa from 'papaparse'

interface Event {
  _id: string
  name: string
  organizationCode: string
  participationTemplate?: any
  achievementTemplate?: any
}

interface Participant {
  _id: string
  name: string
  email: string
  collegeName?: string
  registrationNumber?: string
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
    collegeName: '',
    registrationNumber: '',
  })
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  // Issue certificate dialog state
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [issueParticipant, setIssueParticipant] = useState<Participant | null>(null)
  const [certificateType, setCertificateType] = useState<'participation' | 'achievement'>('participation')
  const [position, setPosition] = useState('')
  const [issuing, setIssuing] = useState(false)

  const { toast } = useToast()
  const [addError, setAddError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [issueError, setIssueError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
    fetchParticipants()
  }, [])

  useEffect(() => {
    let filtered = participants

    if (selectedEvent !== 'all') {
      filtered = filtered.filter((p) => p.eventId?._id === selectedEvent)
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          (p.collegeName || '').toLowerCase().includes(query) ||
          (p.registrationNumber || '').toLowerCase().includes(query)
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
    setAddError(null)
    if (!newParticipant.name || !newParticipant.email || !newParticipant.eventId) {
      setAddError('Please provide all required fields (Event, Full Name, Email).')
      return
    }

    setAdding(true)
    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newParticipant),
      })

      const data = await response.json()

      if (response.ok) {
        setShowAddDialog(false)
        setNewParticipant({ name: '', email: '', eventId: '', collegeName: '', registrationNumber: '' })
        setAddError(null)
        fetchParticipants()
      } else {
        const errorMsg = data.error || 'Failed to add participant'
        setAddError(errorMsg)
      }
    } catch (error: any) {
      console.error('Error adding participant:', error)
      const errorMsg = error.message || 'An unexpected error occurred while adding participant'
      setAddError(errorMsg)
    } finally {
      setAdding(false)
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
    setCsvError(null)
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

          const data = await response.json()

          if (response.ok) {
            setShowCSVDialog(false)
            setCsvFile(null)
            setCsvPreview([])
            setCsvError(null)
            setNewParticipant({ name: '', email: '', eventId: '', collegeName: '', registrationNumber: '' })
            toast({
              title: 'CSV Import Successful',
              description: `Imported ${results.data.length} participants into the event.`,
            })
            fetchParticipants()
          } else {
            const errorMsg = data.error || 'Failed to import CSV'
            setCsvError(errorMsg)
            toast({
              title: 'CSV Import Failed',
              description: errorMsg,
              variant: 'destructive',
            })
          }
        } catch (error: any) {
          console.error('Error uploading CSV:', error)
          const errorMsg = error.message || 'Error processing CSV upload'
          setCsvError(errorMsg)
          toast({
            title: 'Upload Error',
            description: errorMsg,
            variant: 'destructive',
          })
        } finally {
          setUploading(false)
        }
      },
    })
  }

  const openIssueDialog = (participant: Participant) => {
    setIssueParticipant(participant)
    setCertificateType('participation')
    setPosition('')
    setIssueError(null)
    setIssueDialogOpen(true)
  }

  const issueCertificate = async () => {
    if (!issueParticipant) return

    setIssuing(true)
    setIssueError(null)
    try {
      const body: any = { certificateType }
      if (certificateType === 'achievement' && position.trim()) {
        body.position = position.trim()
      }

      const response = await fetch(`/api/participants/${issueParticipant._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        setIssueDialogOpen(false)
        setIssueParticipant(null)
        setIssueError(null)
        toast({
          title: 'Certificate Issued',
          description: `Certificate ${data.certificateId || ''} successfully issued to ${issueParticipant.name}.`,
        })
        fetchParticipants()
      } else {
        const errorMsg = data.error || 'Failed to issue certificate'
        setIssueError(errorMsg)
        toast({
          title: 'Issue Failed',
          description: errorMsg,
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Error issuing certificate:', error)
      const errorMsg = error.message || 'An unexpected error occurred while issuing certificate'
      setIssueError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      setIssuing(false)
    }
  }

  const deleteParticipant = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/participants/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setParticipants((prev) => prev.filter((p) => p._id !== id))
        toast({
          title: 'Participant Deleted',
          description: 'The participant record has been removed.',
        })
      } else {
        const data = await response.json()
        toast({
          title: 'Delete Failed',
          description: data.error || 'Failed to delete participant',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Error deleting participant:', error)
      toast({
        title: 'Delete Error',
        description: error.message || 'Failed to delete participant',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const downloadSampleCSV = () => {
    const csv = 'name,email,collegeName,registrationNumber\nJohn Doe,john@example.com,University of Technology,REG-2026-001\nJane Smith,jane@example.com,State College,REG-2026-002'
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
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading participants...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-lg border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">Participants</h1>
            <Badge variant="secondary" className="text-xs font-normal">
              {filteredParticipants.length} Total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage candidates, import rosters via CSV, and issue official certificates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* CSV Dialog */}
          <Dialog open={showCSVDialog} onOpenChange={setShowCSVDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Import Participants from CSV</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Upload a CSV file containing name, email, collegeName, and registrationNumber.
                </DialogDescription>
              </DialogHeader>

              {csvError && (
                <Alert variant="destructive" className="py-2.5 px-3 text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <div className="ml-2">
                    <AlertTitle className="text-xs font-semibold">Import Error</AlertTitle>
                    <AlertDescription className="text-xs">{csvError}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="space-y-4 py-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Select Event</Label>
                  <Select
                    value={newParticipant.eventId}
                    onValueChange={(value) =>
                      setNewParticipant({ ...newParticipant, eventId: value })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
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
                <div className="space-y-1.5">
                  <Label className="text-xs">CSV File</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="text-xs h-9"
                  />
                </div>
                {csvPreview.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Preview (first 5 rows)</Label>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-left">College</th>
                            <th className="px-3 py-2 text-left">Reg. No.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {csvPreview.map((row, i) => (
                            <tr key={i}>
                              <td className="px-3 py-1.5">{row.name}</td>
                              <td className="px-3 py-1.5">{row.email}</td>
                              <td className="px-3 py-1.5">{row.collegeName || '-'}</td>
                              <td className="px-3 py-1.5">{row.registrationNumber || '-'}</td>
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
                  className="text-primary text-xs gap-1.5 p-0 h-auto"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download sample CSV template
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setShowCSVDialog(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={processCSVUpload}
                  disabled={!csvFile || !newParticipant.eventId || uploading}
                  className="text-xs gap-1.5"
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Import Candidates
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Single Participant Dialog */}
          <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) setAddError(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setAddError(null)}>
                <Plus className="h-3.5 w-3.5" />
                Add Participant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Add New Participant</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Enter participant information below.
                </DialogDescription>
              </DialogHeader>

              {addError && (
                <Alert variant="destructive" className="py-2.5 px-3 text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <div className="ml-2">
                    <AlertTitle className="text-xs font-semibold">Registration Error</AlertTitle>
                    <AlertDescription className="text-xs">{addError}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="space-y-3 py-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event" className="text-xs">Event *</Label>
                  <Select
                    value={newParticipant.eventId}
                    onValueChange={(value) => {
                      setNewParticipant({ ...newParticipant, eventId: value })
                      if (addError) setAddError(null)
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
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
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">Full Name *</Label>
                  <Input
                    id="name"
                    value={newParticipant.name}
                    onChange={(e) => {
                      setNewParticipant({ ...newParticipant, name: e.target.value })
                      if (addError) setAddError(null)
                    }}
                    placeholder="e.g., Alex Morgan"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newParticipant.email}
                    onChange={(e) => {
                      setNewParticipant({ ...newParticipant, email: e.target.value })
                      if (addError) setAddError(null)
                    }}
                    placeholder="alex@domain.com"
                    className="h-9 text-xs"
                  />
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label htmlFor="collegeName" className="text-xs">College / Institution</Label>
                  <Input
                    id="collegeName"
                    value={newParticipant.collegeName}
                    onChange={(e) =>
                      setNewParticipant({ ...newParticipant, collegeName: e.target.value })
                    }
                    placeholder="e.g., State University"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="registrationNumber" className="text-xs">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={newParticipant.registrationNumber}
                    onChange={(e) =>
                      setNewParticipant({ ...newParticipant, registrationNumber: e.target.value })
                    }
                    placeholder="e.g., REG-2026-001"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddParticipant}
                  disabled={!newParticipant.name || !newParticipant.email || !newParticipant.eventId}
                  className="text-xs"
                >
                  Add Participant
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="sm:col-span-8 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by participant name, email, or institution..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="sm:col-span-4">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full h-9 text-sm">
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
      </div>

      {/* Participants Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filteredParticipants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Participant</th>
                    <th className="px-5 py-3 hidden md:table-cell">Institution / Reg. No.</th>
                    <th className="px-5 py-3">Event</th>
                    <th className="px-5 py-3 text-center">Certificate Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredParticipants.map((participant) => (
                    <tr key={participant._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-foreground text-sm">{participant.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          <span>{participant.email}</span>
                        </p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="text-xs">
                          {participant.collegeName ? (
                            <>
                              <p className="text-foreground font-medium">{participant.collegeName}</p>
                              {participant.registrationNumber && (
                                <p className="text-muted-foreground mt-0.5">{participant.registrationNumber}</p>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-medium text-foreground">{participant.eventId?.name || 'Unknown'}</p>
                        <p className="text-[11px] text-muted-foreground">{participant.eventId?.organizationCode}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {participant.certificateIssued ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-normal inline-flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            Issued
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs font-normal">
                            Not Issued
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!participant.certificateIssued ? (
                            <Button
                              size="sm"
                              onClick={() => openIssueDialog(participant)}
                              className="h-8 text-xs gap-1"
                            >
                              <Award className="h-3.5 w-3.5" />
                              Issue
                            </Button>
                          ) : (
                            <Link href={`/verify/${participant.certificateId}`} target="_blank">
                              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                Verify
                              </Button>
                            </Link>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-base font-semibold">Delete Participant?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-muted-foreground">
                                  Are you sure you want to delete {participant.name}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteParticipant(participant._id)}
                                  className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                                  disabled={deletingId === participant._id}
                                >
                                  {deletingId === participant._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete'}
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
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <h3 className="text-sm font-medium text-foreground mb-1">
                {searchQuery || selectedEvent !== 'all' ? 'No matching participants' : 'No participants yet'}
              </h3>
              <p className="text-xs max-w-sm mx-auto mb-4">
                {searchQuery || selectedEvent !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'Import a CSV roster or add participants manually to issue certificates.'}
              </p>
              {!searchQuery && selectedEvent === 'all' && (
                <Button size="sm" onClick={() => setShowAddDialog(true)} className="text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Participant
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Certificate Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" />
              Issue Certificate
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Issue a certificate for <strong className="text-foreground">{issueParticipant?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {issueError && (
            <Alert variant="destructive" className="py-2.5 px-3 text-xs">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <AlertTitle className="text-xs font-semibold">Cannot Issue Certificate</AlertTitle>
                <AlertDescription className="text-xs">{issueError}</AlertDescription>
              </div>
            </Alert>
          )}

          {issueParticipant && (
            <div className="space-y-4 py-2">
              <Tabs value={certificateType} onValueChange={(v) => setCertificateType(v as 'participation' | 'achievement')}>
                <TabsList className="w-full h-8">
                  <TabsTrigger value="participation" className="flex-1 text-xs">
                    <GraduationCap className="h-3.5 w-3.5 mr-1" />
                    Participation
                  </TabsTrigger>
                  <TabsTrigger value="achievement" className="flex-1 text-xs">
                    <Trophy className="h-3.5 w-3.5 mr-1" />
                    Achievement
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="achievement" className="mt-3 space-y-2">
                  <Label className="text-xs">Position / Rank (e.g. 1st Place)</Label>
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g., 1st Prize Winner"
                    className="h-8 text-xs"
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIssueDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={issueCertificate} disabled={issuing} className="text-xs gap-1.5">
              {issuing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
              Issue Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
