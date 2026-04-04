import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Event } from '@/models'
import { generateEventCode, generateEventSlug } from '@/lib/utils'

// GET /api/events - List all events
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const events = await Event.find()
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean()

    return NextResponse.json(events)
  } catch (error: any) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, date, location, organizationCode, customSlug } = body

    if (!name || !date || !organizationCode) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      )
    }

    await connectDB()

    // Validate custom slug if provided
    let slug = generateEventSlug(name)
    if (customSlug) {
      const slugTrimmed = customSlug.trim().toUpperCase()
      
      if (slugTrimmed.length < 2 || slugTrimmed.length > 6) {
        return NextResponse.json(
          { error: 'Custom slug must be between 2 and 6 characters' },
          { status: 400 }
        )
      }
      
      if (!/^[A-Z0-9]+$/.test(slugTrimmed)) {
        return NextResponse.json(
          { error: 'Custom slug must contain only alphanumeric characters' },
          { status: 400 }
        )
      }
      
      // Check if slug already exists
      const existingSlugEvent = await Event.findOne({ slug: slugTrimmed })
      if (existingSlugEvent) {
        return NextResponse.json(
          { error: 'This slug is already in use' },
          { status: 400 }
        )
      }
      
      slug = slugTrimmed
    }

    // Generate unique event code
    let code = generateEventCode()
    let existingEvent = await Event.findOne({ code })

    // Ensure unique code
    while (existingEvent) {
      code = generateEventCode()
      existingEvent = await Event.findOne({ code })
    }

    const event = await Event.create({
      name,
      description,
      slug,
      code,
      date: new Date(date),
      location,
      organizationCode: organizationCode.toUpperCase(),
      certificateCount: 0,
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    )
  }
}
