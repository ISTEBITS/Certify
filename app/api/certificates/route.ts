import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Certificate } from '@/models'

// GET /api/certificates - List all certificates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const certificates = await Certificate.find()
      .sort({ issuedAt: -1 })
      .populate('participantId', 'name email collegeName registrationNumber')
      .populate('eventId', 'name organizationCode date')
      .select('-__v')
      .lean()

    return NextResponse.json(certificates)
  } catch (error: any) {
    console.error('Get certificates error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificates' },
      { status: 500 }
    )
  }
}
