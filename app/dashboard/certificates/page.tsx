'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Search,
  Mail,
  MailCheck,
  Download,
  Loader2,
  Eye,
  CheckCircle,
  Clock,
  CheckSquare,
} from 'lucide-react'
import QRCode from 'qrcode'
import { pdf } from '@react-pdf/renderer'
import { CertificatePDF } from '@/components/CertificateTemplate'
import EmailConsoleLog, { ConsoleLog, EmailResult } from '@/components/EmailConsoleLog'
import { useToast } from '@/components/ui/use-toast'

const MAX_BATCH_SELECTION = 20

interface Event {
  _id: string
  name: string
  organizationCode: string
}

interface ParticipantInfo {
  _id?: string
  name: string
  email: string
  collegeName?: string
  registrationNumber?: string
  emailSent?: boolean
  emailSentAt?: string
}

interface Certificate {
  _id: string
  certificateId: string
  participantId: ParticipantInfo
  eventId: Event
  issuedAt: string
  emailSent?: boolean
  emailSentAt?: string
}

const isDataUrl = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('data:')

const fetchAsDataUrl = async (url: string): Promise<string> => {
  if (isDataUrl(url)) return url

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn('Could not convert image to data URL:', error)
    return url
  }
}

const prepareCertificateForPdf = async (certificate: any) => {
  if (!certificate?.templateConfig) return certificate

  if (certificate.templateConfig.backgroundImage) {
    certificate.templateConfig.backgroundImage = await fetchAsDataUrl(
      certificate.templateConfig.backgroundImage
    )
  }

  if (Array.isArray(certificate.templateConfig.elements)) {
    for (const el of certificate.templateConfig.elements) {
      if (el.type === 'qrcode') {
        if (!el.qrDataUrl) {
          const qrUrl = `${window.location.origin}/verify/${certificate.certificateId}`
          el.qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1 })
        }
      }

      if (el.type === 'image') {
        const src = el.src || el.content
        if (src) {
          el.src = await fetchAsDataUrl(src)
        }
      }
    }
  }

  return certificate
}

export default function CertificatesPage() {
  const { toast } = useToast()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [selectedEmailStatus, setSelectedEmailStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  
  // Bulk email states
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set())
  const [sendingBulkEmails, setSendingBulkEmails] = useState(false)
  const [showConsoleLog, setShowConsoleLog] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
  const [emailResults, setEmailResults] = useState<EmailResult[]>([])
  const [emailSummary, setEmailSummary] = useState<any>(null)
  const [selectMode, setSelectMode] = useState(false)

  useEffect(() => {
    fetchEvents()
    fetchCertificates()
  }, [])

  useEffect(() => {
    let filtered = certificates

    if (selectedEvent !== 'all') {
      filtered = filtered.filter((c) => c.eventId?._id === selectedEvent)
    }

    if (selectedEmailStatus === 'sent') {
      filtered = filtered.filter((c) => c.emailSent || c.participantId?.emailSent === true)
    } else if (selectedEmailStatus === 'unsent') {
      filtered = filtered.filter((c) => !(c.emailSent || c.participantId?.emailSent))
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.certificateId?.toLowerCase().includes(query) ||
          c.participantId?.name?.toLowerCase().includes(query) ||
          c.participantId?.email?.toLowerCase().includes(query)
      )
    }

    setFilteredCertificates(filtered)
  }, [searchQuery, selectedEvent, selectedEmailStatus, certificates])

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

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/certificates')
      const data = await response.json()
      if (Array.isArray(data)) {
        setCertificates(data)
        setFilteredCertificates(data)
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendCertificateEmail = async (certificate: Certificate) => {
    setSendingId(certificate._id)
    try {
      const response = await fetch(`/api/certificates/${certificate._id}`)
      const fullCert = await response.json()

      if (fullCert.templateConfig?.elements) {
        for (const el of fullCert.templateConfig.elements) {
          if (el.type === 'qrcode') {
            const qrUrl = `${window.location.origin}/verify/${fullCert.certificateId}`
            el.qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1 })
          }
        }
      }

      await prepareCertificateForPdf(fullCert)
      const blob = await pdf(<CertificatePDF cert={fullCert} />).toBlob()

      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = async () => {
        const base64data = reader.result as string
        const pdfBase64 = base64data.split(',')[1]

        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: certificate.participantId.email,
            subject: `Your Certificate for ${certificate.eventId.name}`,
            participantName: certificate.participantId.name,
            eventName: certificate.eventId.name,
            certificateId: certificate.certificateId,
            pdfBase64,
            pdfName: `certificate-${certificate.certificateId}.pdf`,
          }),
        })

        if (emailResponse.ok) {
          toast({
            title: 'Email Sent',
            description: `Certificate delivered to ${certificate.participantId.email}`,
          })
          fetchCertificates()
        } else {
          toast({
            variant: 'destructive',
            title: 'Failed to Send Email',
            description: 'Could not deliver email through Mailtrap. Check API logs.',
          })
        }
        setSendingId(null)
      }
    } catch (error: any) {
      console.error('Error sending certificate:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to process certificate PDF',
      })
      setSendingId(null)
    }
  }

  const downloadCertificate = async (certificate: Certificate) => {
    setDownloadingId(certificate._id)
    try {
      const response = await fetch(`/api/certificates/${certificate._id}`)
      const fullCert = await response.json()

      if (fullCert.templateConfig?.elements) {
        for (const el of fullCert.templateConfig.elements) {
          if (el.type === 'qrcode') {
            const qrUrl = `${window.location.origin}/verify/${fullCert.certificateId}`
            el.qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1 })
          }
        }
      }

      await prepareCertificateForPdf(fullCert)
      const blob = await pdf(<CertificatePDF cert={fullCert} />).toBlob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${certificate.certificateId}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF Generation Error:', error)
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: 'Check template configuration and images.',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const toggleSelectMode = () => {
    setSelectMode(!selectMode)
    if (selectMode) {
      setSelectedCertificates(new Set())
    }
  }

  const toggleCertificateSelection = (certificateId: string) => {
    const newSelected = new Set(selectedCertificates)
    if (newSelected.has(certificateId)) {
      newSelected.delete(certificateId)
    } else {
      if (newSelected.size >= MAX_BATCH_SELECTION) {
        toast({
          title: 'Maximum Batch Limit Reached',
          description: `You can select a maximum of ${MAX_BATCH_SELECTION} certificates at a time.`,
        })
        return
      }
      newSelected.add(certificateId)
    }
    setSelectedCertificates(newSelected)
  }

  const selectFirst20Unsent = () => {
    const unsent = filteredCertificates.filter((c) => !(c.emailSent || c.participantId?.emailSent))
    const toSelect = unsent.slice(0, MAX_BATCH_SELECTION).map((c) => c._id)
    setSelectedCertificates(new Set(toSelect))
    setSelectMode(true)
    toast({
      title: 'Batch Selected',
      description: `Selected ${toSelect.length} unsent certificate(s).`,
    })
  }

  const selectAllUpToMax = () => {
    if (selectedCertificates.size > 0) {
      setSelectedCertificates(new Set())
    } else {
      const toSelect = filteredCertificates.slice(0, MAX_BATCH_SELECTION).map((c) => c._id)
      setSelectedCertificates(new Set(toSelect))
    }
  }

  const sendBulkEmails = async () => {
    if (selectedCertificates.size === 0) {
      toast({
        title: 'No Certificates Selected',
        description: 'Please select up to 20 certificates to begin sending.',
      })
      return
    }

    if (selectedCertificates.size > MAX_BATCH_SELECTION) {
      toast({
        variant: 'destructive',
        title: 'Batch Limit Exceeded',
        description: `Maximum selection is ${MAX_BATCH_SELECTION} at a time.`,
      })
      return
    }

    setSendingBulkEmails(true)
    setConsoleLogs([])
    setEmailResults([])
    setEmailSummary({
      total: selectedCertificates.size,
      success: 0,
      failed: 0,
    })
    setShowConsoleLog(true)

    try {
      const response = await fetch('/api/send-bulk-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateIds: Array.from(selectedCertificates),
        }),
      })

      const data = await response.json()
      
      if (data.logs) {
        setConsoleLogs(data.logs)
      }
      if (data.results) {
        setEmailResults(data.results)
      }
      if (data.summary) {
        setEmailSummary(data.summary)
      }

      if (response.ok) {
        setSelectedCertificates(new Set())
        setSelectMode(false)
        fetchCertificates()
      }
    } catch (error: any) {
      console.error('Error sending bulk emails:', error)
      setConsoleLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Failed to execute bulk send: ${error.message}`,
          details: error,
        },
      ])
    } finally {
      setSendingBulkEmails(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading certificates...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-5 rounded-lg border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">Certificates</h1>
            <Badge variant="secondary" className="text-xs font-normal">
              {filteredCertificates.length} Total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage, verify, and dispatch certificates with automated email delivery.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/email-logs">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
            >
              <MailCheck className="h-4 w-4" />
              Email Logs
            </Button>
          </Link>
          {!selectMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={selectFirst20Unsent}
                className="text-xs"
              >
                Select 20 Unsent
              </Button>
              <Button
                size="sm"
                onClick={toggleSelectMode}
                className="text-xs gap-1.5"
              >
                <CheckSquare className="h-4 w-4" />
                Select Batch
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-md text-xs text-foreground">
                <span>Selected:</span>
                <span className="font-semibold text-primary">
                  {selectedCertificates.size} / {MAX_BATCH_SELECTION}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={selectAllUpToMax}
                className="text-xs"
              >
                {selectedCertificates.size > 0 ? 'Deselect All' : `Select Up To ${Math.min(filteredCertificates.length, MAX_BATCH_SELECTION)}`}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectMode}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={sendBulkEmails}
                disabled={sendingBulkEmails || selectedCertificates.size === 0}
                className="text-xs gap-1.5"
              >
                {sendingBulkEmails ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                Send Batch ({selectedCertificates.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by participant name, email, or certificate ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm h-9"
          />
        </div>

        <div className="sm:col-span-3">
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

        <div className="sm:col-span-3">
          <Select value={selectedEmailStatus} onValueChange={setSelectedEmailStatus}>
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="Email status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sent">Mail Sent</SelectItem>
              <SelectItem value="unsent">Unsent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Certificates Table & Mobile Cards */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filteredCertificates.length > 0 ? (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
                    <tr>
                      {selectMode && (
                        <th className="px-4 py-3 w-10 text-center">
                          <input
                            type="checkbox"
                            aria-label="Select batch"
                            checked={
                              selectedCertificates.size > 0 &&
                              selectedCertificates.size === Math.min(filteredCertificates.length, MAX_BATCH_SELECTION)
                            }
                            onChange={selectAllUpToMax}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                        </th>
                      )}
                      <th className="px-5 py-3">Certificate ID</th>
                      <th className="px-5 py-3">Candidate</th>
                      <th className="px-5 py-3">Event</th>
                      <th className="px-5 py-3 text-center">Mail Status</th>
                      <th className="px-5 py-3">Issued Date</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredCertificates.map((certificate) => {
                      const isSelected = selectedCertificates.has(certificate._id)
                      const isSent = certificate.emailSent || certificate.participantId?.emailSent
                      return (
                        <tr
                          key={certificate._id}
                          className={`hover:bg-muted/40 transition-colors ${
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                        >
                          {selectMode && (
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="checkbox"
                                aria-label={`Select certificate ${certificate.certificateId}`}
                                checked={isSelected}
                                onChange={() => toggleCertificateSelection(certificate._id)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                            </td>
                          )}

                          {/* Certificate ID */}
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-medium text-foreground">
                              {certificate.certificateId}
                            </span>
                          </td>

                          {/* Participant Info */}
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-foreground text-sm">
                              {certificate.participantId?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {certificate.participantId?.email || 'N/A'}
                            </p>
                          </td>

                          {/* Event */}
                          <td className="px-5 py-3.5">
                            <span className="text-xs text-muted-foreground">
                              {certificate.eventId?.name || 'Unknown Event'}
                            </span>
                          </td>

                          {/* Mail Status Badge */}
                          <td className="px-5 py-3.5 text-center">
                            {isSent ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-normal inline-flex items-center gap-1"
                              >
                                <CheckCircle className="h-3 w-3 text-emerald-600" />
                                Sent
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-muted text-muted-foreground border-border text-xs font-normal inline-flex items-center gap-1"
                              >
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                Unsent
                              </Badge>
                            )}
                          </td>

                          {/* Issued Date */}
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">
                            {new Date(certificate.issuedAt).toLocaleDateString()}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/verify/${certificate.certificateId}`}
                                target="_blank"
                                title="Public Verification Portal"
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadCertificate(certificate)}
                                disabled={downloadingId === certificate._id}
                                className="h-8 px-2.5 text-xs gap-1"
                              >
                                {downloadingId === certificate._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Download className="h-3.5 w-3.5" />
                                    PDF
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendCertificateEmail(certificate)}
                                disabled={sendingId === certificate._id}
                                className={`h-8 px-2.5 text-xs gap-1 ${
                                  isSent ? 'text-muted-foreground' : 'text-primary border-primary/30 hover:bg-primary/5'
                                }`}
                              >
                                {sendingId === certificate._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Mail className="h-3.5 w-3.5" />
                                    {isSent ? 'Resend' : 'Send'}
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (<md) */}
              <div className="md:hidden divide-y divide-border">
                {filteredCertificates.map((certificate) => {
                  const isSelected = selectedCertificates.has(certificate._id)
                  const isSent = certificate.emailSent || certificate.participantId?.emailSent
                  return (
                    <div
                      key={certificate._id}
                      className={`p-4 space-y-3 transition-colors ${
                        isSelected ? 'bg-primary/5' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          {selectMode && (
                            <input
                              type="checkbox"
                              aria-label={`Select certificate ${certificate.certificateId}`}
                              checked={isSelected}
                              onChange={() => toggleCertificateSelection(certificate._id)}
                              className="mt-1 rounded border-border text-primary focus:ring-primary"
                            />
                          )}
                          <div>
                            <span className="text-xs font-medium text-foreground">
                              {certificate.certificateId}
                            </span>
                            <p className="font-medium text-sm text-foreground mt-0.5">
                              {certificate.participantId?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {certificate.participantId?.email}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isSent ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-normal gap-1">
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs font-normal gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              Unsent
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                        <span>Event: <strong className="text-foreground font-medium">{certificate.eventId?.name}</strong></span>
                        <span>{new Date(certificate.issuedAt).toLocaleDateString()}</span>
                      </div>

                      {/* Action buttons on mobile */}
                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/verify/${certificate.certificateId}`}
                          target="_blank"
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full text-xs h-8">
                            Verify
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCertificate(certificate)}
                          disabled={downloadingId === certificate._id}
                          className="flex-1 text-xs h-8 gap-1"
                        >
                          {downloadingId === certificate._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'PDF'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => sendCertificateEmail(certificate)}
                          disabled={sendingId === certificate._id}
                          className="flex-1 text-xs h-8 gap-1"
                        >
                          {sendingId === certificate._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            isSent ? 'Resend' : 'Send'
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-medium text-foreground mb-1">No certificates found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                {searchQuery || selectedEvent !== 'all' || selectedEmailStatus !== 'all'
                  ? 'No certificates match the current search or filters.'
                  : 'Certificates will appear here once issued.'}
              </p>
              {(searchQuery || selectedEvent !== 'all' || selectedEmailStatus !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedEvent('all')
                    setSelectedEmailStatus('all')
                  }}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Email Telemetry Dialog */}
      <EmailConsoleLog
        open={showConsoleLog}
        onOpenChange={setShowConsoleLog}
        logs={consoleLogs}
        results={emailResults}
        summary={emailSummary}
        isSending={sendingBulkEmails}
        onClose={fetchCertificates}
      />
    </div>
  )
}
