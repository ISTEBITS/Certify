'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  Award,
  User,
  Building2,
  Download,
  Loader2,
  Shield,
  FileText,
  Mail,
  GraduationCap,
  Trophy,
  Calendar,
} from 'lucide-react'
import QRCode from 'qrcode'
import { pdf } from '@react-pdf/renderer'
import { CertificatePDF } from '@/components/CertificateTemplate'

interface CertificateData {
  valid: boolean
  certificate?: {
    certificateId: string
    participantName: string
    participantEmail: string
    eventName: string
    eventDate: string
    organizationName: string
    organizationCode: string
    location: string
    collegeName?: string
    registrationNumber?: string
    position?: string
    certificateType: 'participation' | 'achievement'
    issuedAt: string
  }
  message?: string
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

interface FullCertificate {
  _id: string
  certificateId: string
  certificateType?: 'participation' | 'achievement'
  position?: string
  participantId: {
    name: string
    email: string
    collegeName?: string
    registrationNumber?: string
  }
  eventId: {
    name: string
    date: string
    organizationName: string
    organizationCode: string
    location: string
  }
  templateConfig: {
    width: number
    height: number
    backgroundImage?: string
    backgroundImagePublicId?: string
    elements: Array<{
      id: string
      type: 'text' | 'qrcode' | 'image'
      field?: 'name' | 'event' | 'date' | 'certificateId' | 'custom' | 'collegeName' | 'registrationNumber' | 'position' | 'email'
      content?: string
      x: number
      y: number
      width?: number
      height?: number
      fontSize?: number
      fontFamily?: string
      fontWeight?: string
      fontStyle?: string
      color?: string
      textAlign?: 'left' | 'center' | 'right'
      rotation?: number
      opacity?: number
      letterSpacing?: number
      lineHeight?: number
      textTransform?: 'none' | 'uppercase' | 'lowercase'
      isBold?: boolean
      isItalic?: boolean
      isUnderline?: boolean
      src?: string
      imagePublicId?: string
      richTextSegments?: Array<{
        text: string
        isBold?: boolean
        isItalic?: boolean
        isUnderline?: boolean
        fontSize?: number
        color?: string
        fontFamily?: string
        field?: string
        textTransform?: string
      }>
    }>
  }
  issuedAt: string
}

export default function VerifyPage() {
  const params = useParams()
  const certificateId = params.id as string
  const [data, setData] = useState<CertificateData | null>(null)
  const [fullCertificate, setFullCertificate] = useState<FullCertificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    verifyCertificate()
  }, [certificateId])

  const verifyCertificate = async () => {
    try {
      const response = await fetch(`/api/verify/${certificateId}`)
      const result = await response.json()

      setData(result)

      if (result.valid) {
        const certResponse = await fetch(`/api/certificates/verify/${certificateId}`)
        if (certResponse.ok) {
          const certData = await certResponse.json()
          setFullCertificate(certData.certificate)
        }
      }
    } catch (error) {
      console.error('Error verifying certificate:', error)
      setData({ valid: false, message: 'Failed to verify certificate' })
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!fullCertificate) return

    setDownloading(true)
    try {
      if (fullCertificate.templateConfig?.elements) {
        for (const el of fullCertificate.templateConfig.elements as any[]) {
          if (el.type === 'qrcode') {
            const qrUrl = `${window.location.origin}/verify/${certificateId}`
            el.qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1 })
          }
        }
      }

      await prepareCertificateForPdf(fullCertificate)

      const blob = await pdf(<CertificatePDF cert={fullCertificate} />).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${certificateId}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading certificate:', error)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl mb-2">Invalid Certificate</CardTitle>
            <CardDescription className="text-red-600 mb-6">
              {data?.message || 'This certificate could not be verified'}
            </CardDescription>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cert = data.certificate!

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Verification Success */}
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-center md:text-left flex-1">
                <CardTitle className="text-2xl mb-2 text-green-800">
                  Certificate Verified
                </CardTitle>
                <CardDescription className="text-green-700">
                  This certificate has been successfully verified and is authentic.
                </CardDescription>
                {cert.certificateType && (
                  <div className="mt-2">
                    <Badge
                      variant={cert.certificateType === 'achievement' ? 'default' : 'secondary'}
                      className="text-sm"
                    >
                      {cert.certificateType === 'achievement' ? (
                        <>
                          <Trophy className="h-3.5 w-3.5 mr-1.5" />
                          Achievement Certificate
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                          Participation Certificate
                        </>
                      )}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={downloadPDF}
                  disabled={downloading || !fullCertificate}
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recipient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Recipient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                <p className="text-base font-semibold">{cert.participantName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="text-sm text-gray-700">{cert.participantEmail}</p>
              </div>
              {cert.collegeName && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> College
                  </p>
                  <p className="text-sm text-gray-700">{cert.collegeName}</p>
                </div>
              )}
              {cert.registrationNumber && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Registration No.</p>
                  <p className="text-sm font-mono text-gray-700">{cert.registrationNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Event Name</p>
                <p className="text-base font-semibold">{cert.eventName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Event Date
                </p>
                <p className="text-sm text-gray-700">
                  {new Date(cert.eventDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {cert.certificateType === 'achievement' && cert.position && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> Position
                  </p>
                  <p className="text-base font-semibold text-amber-600">{cert.position}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certificate Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Certificate Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Certificate ID</p>
                <p className="text-sm font-mono break-all">{cert.certificateId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Organization</p>
                <p className="text-sm font-semibold">{cert.organizationName || cert.organizationCode}</p>
              </div>
              {cert.location && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                  <p className="text-sm text-gray-700">{cert.location}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Issued</p>
                <p className="text-sm text-gray-700">
                  {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificate Preview */}
        {fullCertificate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Certificate Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto bg-gray-100 rounded-lg p-4">
                <div
                  className="bg-white shadow-lg mx-auto"
                  style={{
                    width: fullCertificate.templateConfig?.width ?? 800,
                    height: fullCertificate.templateConfig?.height ?? 600,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Background */}
                  {fullCertificate.templateConfig.backgroundImage && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${fullCertificate.templateConfig.backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  )}

                  {/* Elements */}
                  {fullCertificate.templateConfig.elements.map((element) => (
                    <CertificateElement
                      key={element.id}
                      element={element}
                      certificateId={fullCertificate.certificateId}
                      participantName={fullCertificate.participantId.name}
                      eventName={fullCertificate.eventId.name}
                      eventDate={fullCertificate.eventId.date}
                      collegeName={fullCertificate.participantId.collegeName}
                      registrationNumber={fullCertificate.participantId.registrationNumber}
                      position={fullCertificate.position}
                      participantEmail={fullCertificate.participantId.email}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Verified by Certify - Certificate Management System</p>
          <p className="mt-1 text-xs">
            Verification URL: {typeof window !== 'undefined' && window.location.href}
          </p>
        </div>
      </div>
    </div>
  )
}

// Certificate Element Component - Read-only rendering only
function CertificateElement({
  element,
  certificateId,
  participantName,
  eventName,
  eventDate,
  collegeName,
  registrationNumber,
  position,
  participantEmail,
}: {
  element: any
  certificateId: string
  participantName: string
  eventName: string
  eventDate: string
  collegeName?: string
  registrationNumber?: string
  position?: string
  participantEmail?: string
}) {
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (element.type === 'qrcode' && qrRef.current) {
      QRCode.toCanvas(qrRef.current, `${window.location.origin}/verify/${certificateId}`, {
        width: element.width || 100,
      })
    }
  }, [element, certificateId])

  const getContent = () => {
    if (element.field === 'name') return participantName
    if (element.field === 'event') return eventName
    if (element.field === 'date') {
      return new Date(eventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
    if (element.field === 'certificateId') return certificateId
    if (element.field === 'collegeName') return collegeName || ''
    if (element.field === 'registrationNumber') return registrationNumber || ''
    if (element.field === 'position') return position || ''
    if (element.field === 'email') return participantEmail || ''
    return element.content || ''
  }

  // Image element - read-only, no controls
  if (element.type === 'image') {
    const imgSrc = element.src || element.content
    if (!imgSrc) return null
    return (
      <img
        src={imgSrc}
        crossOrigin="anonymous"
        style={{
          position: 'absolute',
          left: element.x,
          top: element.y,
          width: element.width || 100,
          height: element.height || 100,
          objectFit: 'contain',
          display: 'block',
          transform: element.rotation ? `rotate(${element.rotation}deg)` : '',
          transformOrigin: element.rotation ? 'center center' : undefined,
          opacity: element.opacity !== undefined ? element.opacity : undefined,
        }}
      />
    )
  }

  if (element.type === 'qrcode') {
    return (
      <canvas
        ref={qrRef}
        style={{
          position: 'absolute',
          left: element.x,
          top: element.y,
          width: element.width || 100,
          height: element.height || 100,
          transform: element.rotation ? `rotate(${element.rotation}deg)` : '',
          transformOrigin: element.rotation ? 'center center' : undefined,
          opacity: element.opacity !== undefined ? element.opacity : undefined,
        }}
      />
    )
  }

  // Text element - read-only rendering
  if (element.type === 'text') {
    // Rich text segments
    if (element.richTextSegments && element.richTextSegments.length > 0) {
      return (
        <div
          style={{
            position: 'absolute',
            left: element.x,
            top: element.y,
            width: element.width || 'auto',
            height: element.height || 'auto',
            transform: element.rotation ? `rotate(${element.rotation}deg)` : '',
            transformOrigin: element.rotation ? 'center center' : undefined,
            opacity: element.opacity !== undefined ? element.opacity : undefined,
          }}
        >
          {element.richTextSegments.map((segment: any, idx: number) => {
            let segText = segment.text || ''
            if (segment.field === 'name') segText = participantName
            else if (segment.field === 'event') segText = eventName
            else if (segment.field === 'date') segText = new Date(eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            else if (segment.field === 'certificateId') segText = certificateId
            else if (segment.field === 'collegeName') segText = collegeName || ''
            else if (segment.field === 'registrationNumber') segText = registrationNumber || ''
            else if (segment.field === 'position') segText = position || ''
            else if (segment.field === 'email') segText = participantEmail || ''

            if (segment.textTransform === 'uppercase') segText = segText.toUpperCase()
            else if (segment.textTransform === 'lowercase') segText = segText.toLowerCase()

            return (
              <span
                key={idx}
                style={{
                  fontSize: `${segment.fontSize || element.fontSize || 24}px`,
                  fontFamily: segment.fontFamily || element.fontFamily || 'Arial, sans-serif',
                  fontWeight: segment.isBold ? 'bold' : 'normal',
                  fontStyle: segment.isItalic ? 'italic' : 'normal',
                  color: segment.color || element.color || '#000000',
                  textDecoration: segment.isUnderline ? 'underline' : 'none',
                  letterSpacing: segment.letterSpacing ? `${segment.letterSpacing}px` : undefined,
                }}
              >
                {segText}
              </span>
            )
          })}
        </div>
      )
    }

    // Plain text
    let content = getContent()
    if (element.textTransform === 'uppercase') content = content.toUpperCase()
    else if (element.textTransform === 'lowercase') content = content.toLowerCase()

    return (
      <div
        style={{
          position: 'absolute',
          left: element.x,
          top: element.y,
          width: element.width || 'auto',
          height: element.height || 'auto',
          fontSize: `${element.fontSize || 24}px`,
          fontFamily: element.fontFamily || 'Arial, sans-serif',
          fontWeight: element.isBold ? 'bold' : (element.fontWeight || 'normal'),
          fontStyle: element.isItalic ? 'italic' : 'normal',
          color: element.color || '#000000',
          textAlign: element.textAlign || 'center',
          lineHeight: String(element.lineHeight || 1.2),
          letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
          textDecoration: element.isUnderline ? 'underline' : 'none',
          transform: element.rotation ? `rotate(${element.rotation}deg)` : '',
          transformOrigin: element.rotation ? 'center center' : undefined,
          opacity: element.opacity !== undefined ? element.opacity : undefined,
          whiteSpace: 'pre-wrap',
          padding: 0,
          margin: 0,
        }}
      >
        {content}
      </div>
    )
  }

  return null
}
