import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Certificate } from '@/models'
import mongoose from 'mongoose'

// GET /api/certificates/[id] - Get a single certificate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 })
    }

    await connectDB()

    const certificate = await Certificate.findById(id)
      .populate('participantId', 'name email')
      .populate('eventId', 'name organizationCode date slug')
      .select('-__v')
      .lean()

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    return NextResponse.json(certificate)
  } catch (error: any) {
    console.error('Get certificate error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificate' },
      { status: 500 }
    )
  }
}
