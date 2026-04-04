import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Certificate } from '@/models'
import { validateCertificateId } from '@/lib/utils'

// GET /api/certificates/verify/[id] - Get certificate by certificateId for verification rendering
// This is a PUBLIC route - no authentication required
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificateId } = await params

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 })
    }

    // Validate the certificate ID format and checksum
    const validation = validateCertificateId(certificateId)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid certificate ID format', valid: false },
        { status: 400 }
      )
    }

    await connectDB()

    const certificate = await Certificate.findOne({ certificateId })
      .populate('participantId', 'name email')
      .populate('eventId', 'name organizationCode date slug description location')
      .select('-__v')
      .lean()

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found', valid: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      certificate,
    })
  } catch (error: any) {
    console.error('Certificate verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify certificate', valid: false },
      { status: 500 }
    )
  }
}
