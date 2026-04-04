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
  organizationCode: string
  templateConfig?: TemplateConfig
  certificateCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Participant {
  _id: string
  name: string
  email: string
  eventId: string
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
  field?: 'name' | 'event' | 'date' | 'certificateId' | 'custom'
  content?: string
  x: number
  y: number
  width?: number
  height?: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  rotation?: number
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
    eventName: string
    eventDate: string
    issuedAt: string
  }
  message?: string
}
