export interface User {
  _id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  _id: string
  name: string
  description?: string
  slug: string
  code: string
  date: Date
  location?: string
  organizationName: string
  organizationCode: string
  participationTemplate?: TemplateConfig
  achievementTemplate?: TemplateConfig
  certificateCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Participant {
  _id: string
  name: string
  email: string
  eventId: string
  collegeName?: string
  registrationNumber?: string
  certificateId?: string
  certificateIssued: boolean
  certificateIssuedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Certificate {
  _id: string
  certificateId: string
  participantId: string
  eventId: string
  certificateType: 'participation' | 'achievement'
  position?: string
  templateConfig: TemplateConfig
  issuedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface TemplateConfig {
  width: number
  height: number
  backgroundImage?: string
  elements: TemplateElement[]
}

export interface TemplateElement {
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
  // Rich text segments for per-word formatting
  richTextSegments?: Array<{
    text: string
    isBold?: boolean
    isItalic?: boolean
    isUnderline?: boolean
    fontSize?: number
    color?: string
    fontFamily?: string
  }>
}

export interface CertificateData {
  certificateId: string
  participantName: string
  eventName: string
  eventDate: string
  organizationCode: string
  qrCodeUrl: string
}

export interface EmailData {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}

export interface VerificationResult {
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
