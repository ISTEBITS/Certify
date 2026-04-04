'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  FileText,
  Search,
  Mail,
  Download,
  Award,
  Loader2,
  Eye,
  Send,
  CheckCircle,
  QrCode,
} from 'lucide-react'
import QRCode from 'qrcode'
import { pdf } from '@react-pdf/renderer'
import { CertificatePDF } from '@/components/CertificateTemplate'

interface Event {
  _id: string
  name: string
  organizationCode: string
}

interface Certificate {
  _id: string
  certificateId: string
  participantId: {
    name: string
    email: string
  }
  eventId: Event
  issuedAt: string
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
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
    fetchCertificates()
  }, [])

  useEffect(() => {
    let filtered = certificates

    if (selectedEvent !== 'all') {
      filtered = filtered.filter((c) => c.eventId._id === selectedEvent)
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.certificateId.toLowerCase().includes(query) ||
          c.participantId.name.toLowerCase().includes(query) ||
          c.participantId.email.toLowerCase().includes(query)
      )
    }

    setFilteredCertificates(filtered)
  }, [searchQuery, selectedEvent, certificates])

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

      // Pre-process elements to generate QR Code Data URLs
      if (fullCert.templateConfig?.elements) {
        for (const el of fullCert.templateConfig.elements) {
          if (el.type === 'qrcode') {
            const qrUrl = `${window.location.origin}/verify/${fullCert.certificateId}`
            el.qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1 })
          }
        }
      }

      await prepareCertificateForPdf(fullCert)

      // Generate PDF
      const blob = await pdf(<CertificatePDF cert={fullCert} />).toBlob()

      // Convert to base64 for email
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
          alert('Certificate sent successfully!')
        } else {
          alert('Failed to send certificate')
        }
        setSendingId(null)
      }
    } catch (error) {
      console.error('Error sending certificate:', error)
      setSendingId(null)
    }
  }




const downloadCertificate = async (certificate: Certificate) => {
  setDownloadingId(certificate._id);
  try {
    const response = await fetch(`/api/certificates/${certificate._id}`);
    const fullCert = await response.json();

    // 1. Pre-process elements to generate QR Code Data URLs and embed remote images
    if (fullCert.templateConfig?.elements) {
      for (const el of fullCert.templateConfig.elements) {
        if (el.type === 'qrcode') {
          // Generate QR code as Base64 string
          const qrUrl = `${window.location.origin}/verify/${fullCert.certificateId}`;
          el.qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1 });
        }
      }
    }

    await prepareCertificateForPdf(fullCert)

    // 2. Now generate the PDF
    const blob = await pdf(<CertificatePDF cert={fullCert} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${certificate.certificateId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('Could not generate PDF. Check console for details.');
  } finally {
    setDownloadingId(null);
  }
};

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
          <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-500 mt-1">
            View, download, and send certificates to participants
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search certificates..."
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

      {/* Certificates Table */}
      <Card>
        <CardContent className="p-0">
          {filteredCertificates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Certificate ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Participant
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Event
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Issued Date
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="font-mono text-sm">
                            {certificate.certificateId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {certificate.participantId.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {certificate.participantId.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {certificate.eventId.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">
                          {new Date(certificate.issuedAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/verify/${certificate.certificateId}`}
                            target="_blank"
                          >
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCertificate(certificate)}
                            disabled={downloadingId === certificate._id}
                          >
                            {downloadingId === certificate._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendCertificateEmail(certificate)}
                            disabled={sendingId === certificate._id}
                          >
                            {sendingId === certificate._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || selectedEvent !== 'all'
                  ? 'No certificates found'
                  : 'No certificates yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedEvent !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Issue certificates to participants from the Participants page'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
