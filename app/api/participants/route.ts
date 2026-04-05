import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Participant, Event, Certificate } from '@/models'
import { generateCertificateId } from '@/lib/utils'
import mongoose from 'mongoose'

// GET /api/participants - List participants (optionally filtered by event)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    await connectDB()

    const query: any = {}
    if (eventId) {
      query.eventId = eventId
    }

    const participants = await Participant.find(query)
      .sort({ createdAt: -1 })
      .populate('eventId', 'name organizationCode date slug participationTemplate achievementTemplate')
      .select('-__v')
      .lean()

    return NextResponse.json(participants)
  } catch (error: any) {
    console.error('Get participants error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch participants' },
      { status: 500 }
    )
  }
}

// POST /api/participants - Create a new participant
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, eventId, collegeName, registrationNumber } = body

    if (!name || !email || !eventId) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if event exists
    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if participant already exists for this event
    const existingParticipant = await Participant.findOne({ email, eventId })
    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Participant with this email already exists for this event' },
        { status: 409 }
      )
    }

    const participant = await Participant.create({
      name,
      email,
      eventId,
      collegeName,
      registrationNumber,
      certificateIssued: false,
    })

    const populatedParticipant = await Participant.findById(participant._id)
      .populate('eventId', 'name organizationCode date slug')
      .select('-__v')

    return NextResponse.json(populatedParticipant, { status: 201 })
  } catch (error: any) {
    console.error('Create participant error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create participant' },
      { status: 500 }
    )
  }
}

// POST /api/participants/bulk - Bulk create participants from CSV
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { participants, eventId } = body

    if (!participants || !Array.isArray(participants) || !eventId) {
      return NextResponse.json(
        { error: 'Please provide participants array and eventId' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if event exists
    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const participantData of participants) {
      try {
        const { name, email, collegeName, registrationNumber } = participantData

        if (!name || !email) {
          results.skipped++
          continue
        }

        // Check if participant already exists
        const existing = await Participant.findOne({ email, eventId })
        if (existing) {
          results.skipped++
          continue
        }

        await Participant.create({
          name,
          email,
          eventId,
          collegeName,
          registrationNumber,
          certificateIssued: false,
        })

        results.created++
      } catch (err: any) {
        results.errors.push(`Failed to add ${participantData.email}: ${err.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Bulk create participants error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create participants' },
      { status: 500 }
    )
  }
}
