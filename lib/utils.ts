import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a SHA-256 hash using Web Crypto API (works in both Node.js and browser)
 */
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)

  // Use Web Crypto API (available in both browser and Node.js 19+)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Synchronous SHA-256 hash using Web Crypto API with synchronous fallback
 * Note: In Node.js server context, this uses the synchronous approach
 */
function sha256Sync(text: string): string {
  // For Node.js environments, use require('crypto')
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto')
      return crypto.createHash('sha256').update(text).digest('hex')
    } catch {
      // Fall through to async version if require fails
    }
  }
  // This should not be called directly for certificate generation
  return ''
}

export function generateCertificateId(
  orgCode: string,
  eventSlug: string,
  year: number,
  sequence: number
): string {
  const paddedSequence = sequence.toString().padStart(6, '0')
  const baseString = `${orgCode}-${eventSlug}-${year}-${paddedSequence}`

  // Generate checksum using SHA-256 (first 4 characters)
  // This function should only be called server-side
  const hash = sha256Sync(baseString)
  const checksum = hash.substring(0, 4).toUpperCase()

  return `${baseString}-${checksum}`
}

export function validateCertificateId(certId: string): { valid: boolean; error?: string } {
  const parts = certId.split('-')
  if (parts.length !== 5) {
    return { valid: false, error: 'Invalid certificate ID format' }
  }

  const [orgCode, eventSlug, year, sequence, checksum] = parts

  // Basic validation
  if (!orgCode || !eventSlug || !year || !sequence || !checksum) {
    return { valid: false, error: 'Missing certificate segments' }
  }

  if (year.length !== 4) {
    return { valid: false, error: 'Invalid year format' }
  }

  if (checksum.length !== 4) {
    return { valid: false, error: 'Invalid checksum length' }
  }

  // Reconstruct base string and verify checksum
  const baseString = `${orgCode}-${eventSlug}-${year}-${sequence}`
  const hash = sha256Sync(baseString)
  const expectedChecksum = hash.substring(0, 4).toUpperCase()

  if (checksum !== expectedChecksum) {
    return { valid: false, error: 'Certificate checksum mismatch' }
  }

  return { valid: true }
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateEventSlug(eventName: string): string {
  return eventName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8)
}

export function generateEventCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
