import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Participant, Event, Certificate } from '@/models'
import { generateCertificateId } from '@/lib/utils'
import mongoose from 'mongoose'

// GET /api/participants/[id] - Get a single participant
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
      return NextResponse.json({ error: 'Invalid participant ID' }, { status: 400 })
    }

    await connectDB()

    const participant = await Participant.findById(id)
      .populate('eventId', 'name organizationCode date slug templateConfig')
      .select('-__v')
      .lean()

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    return NextResponse.json(participant)
  } catch (error: any) {
    console.error('Get participant error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch participant' },
      { status: 500 }
    )
  }
}

// PUT /api/participants/[id] - Update a participant
export async function PUT(
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
      return NextResponse.json({ error: 'Invalid participant ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, email, collegeName, registrationNumber } = body

    await connectDB()

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (collegeName !== undefined) updateData.collegeName = collegeName
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber

    const participant = await Participant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('eventId', 'name organizationCode date slug')
      .select('-__v')

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    return NextResponse.json(participant)
  } catch (error: any) {
    console.error('Update participant error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update participant' },
      { status: 500 }
    )
  }
}

// DELETE /api/participants/[id] - Delete a participant
export async function DELETE(
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
      return NextResponse.json({ error: 'Invalid participant ID' }, { status: 400 })
    }

    await connectDB()

    const participant = await Participant.findById(id)
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // Delete associated certificate if exists
    if (participant.certificateId) {
      await Certificate.deleteOne({ certificateId: participant.certificateId })
      
      // Decrement event certificate count
      await Event.findByIdAndUpdate(participant.eventId, {
        $inc: { certificateCount: -1 },
      })
    }

    await Participant.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Participant deleted successfully' })
  } catch (error: any) {
    console.error('Delete participant error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete participant' },
      { status: 500 }
    )
  }
}

// POST /api/participants/[id]/issue-certificate - Issue certificate to participant
export async function PATCH(
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
      return NextResponse.json({ error: 'Invalid participant ID' }, { status: 400 })
    }

    const body = await request.json()
    const { certificateType = 'participation', position } = body

    await connectDB()

    const participant: any = await Participant.findById(id).populate('eventId')
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    if (participant.certificateIssued) {
      return NextResponse.json(
        { error: 'Certificate already issued to this participant' },
        { status: 400 }
      )
    }

    const event = participant.eventId as any

    // Select the correct template based on certificate type
    const templateConfig = certificateType === 'achievement'
      ? event.achievementTemplate
      : event.participationTemplate

    // Check if event has the required template
    if (!templateConfig) {
      const templateName = certificateType === 'achievement' ? 'achievement' : 'participation'
      return NextResponse.json(
        { error: `No ${templateName} certificate template designed for this event. Please design one in the Certificate Designer.` },
        { status: 400 }
      )
    }

    // Increment certificate count and get new sequence number
    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { $inc: { certificateCount: 1 } },
      { new: true }
    )

    // Generate certificate ID
    const certificateId = generateCertificateId(
      event.organizationCode,
      event.slug,
      new Date(event.date).getFullYear(),
      updatedEvent!.certificateCount
    )

    // Deep clone templateConfig to avoid reference issues
    const clonedTemplate = JSON.parse(JSON.stringify(templateConfig))

    // Create certificate record
    const certificate = await Certificate.create({
      certificateId,
      participantId: participant._id,
      eventId: event._id,
      certificateType,
      position: certificateType === 'achievement' ? position : undefined,
      templateConfig: clonedTemplate,
      issuedAt: new Date(),
    })

    // Update participant
    participant.certificateId = certificateId
    participant.certificateIssued = true
    participant.certificateIssuedAt = new Date()
    await participant.save()

    return NextResponse.json({
      message: 'Certificate issued successfully',
      certificateId,
      participant: await Participant.findById(id)
        .populate('eventId', 'name organizationCode date slug')
        .select('-__v'),
    })
  } catch (error: any) {
    console.error('Issue certificate error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to issue certificate' },
      { status: 500 }
    )
  }
}
