import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Certificate, Participant, Event } from '@/models'
import { validateCertificateId } from '@/lib/utils'

// GET /api/verify/[id] - Verify a certificate by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { valid: false, message: 'Certificate ID is required' },
        { status: 400 }
      )
    }

    // Validate certificate ID format and checksum
    const validation = validateCertificateId(id)
    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, message: validation.error || 'Invalid certificate ID format' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find certificate
    const certificate: any = await Certificate.findOne({ certificateId: id })
      .populate('participantId', 'name email')
      .populate('eventId', 'name date organizationName organizationCode location')
      .lean()

    if (!certificate) {
      return NextResponse.json(
        { valid: false, message: 'Certificate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        certificateId: certificate.certificateId,
        participantName: certificate.participantId?.name,
        participantEmail: certificate.participantId?.email,
        eventName: certificate.eventId?.name,
        eventDate: certificate.eventId?.date,
        organizationName: certificate.eventId?.organizationName,
        organizationCode: certificate.eventId?.organizationCode,
        location: certificate.eventId?.location,
        collegeName: certificate.participantId?.collegeName,
        registrationNumber: certificate.participantId?.registrationNumber,
        position: certificate.position,
        certificateType: certificate.certificateType || 'participation',
        issuedAt: certificate.issuedAt,
      },
    })
  } catch (error: any) {
    console.error('Verify certificate error:', error)
    return NextResponse.json(
      { valid: false, message: error.message || 'Failed to verify certificate' },
      { status: 500 }
    )
  }
}
