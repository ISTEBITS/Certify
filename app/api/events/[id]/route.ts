import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Event, Participant, Certificate } from '@/models'
import { v2 as cloudinary } from 'cloudinary'
import mongoose from 'mongoose'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function deleteCloudinaryImages(templateConfig: any) {
  if (!templateConfig) return

  // Delete background image
  if (templateConfig.backgroundImagePublicId && process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      await cloudinary.uploader.destroy(templateConfig.backgroundImagePublicId)
    } catch (err) {
      console.error('Failed to delete background image from Cloudinary:', err)
    }
  }

  // Delete element images
  if (Array.isArray(templateConfig.elements)) {
    for (const el of templateConfig.elements) {
      if (el.imagePublicId && process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          await cloudinary.uploader.destroy(el.imagePublicId)
        } catch (err) {
          console.error('Failed to delete element image from Cloudinary:', err)
        }
      }
    }
  }
}

// GET /api/events/[id] - Get a single event
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
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    await connectDB()

    const event = await Event.findById(id).select('-__v').lean()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Get event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id] - Update an event
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
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, date, location, organizationCode, templateConfig, customSlug } = body

    await connectDB()

    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (date) updateData.date = new Date(date)
    if (location !== undefined) updateData.location = location
    if (organizationCode) updateData.organizationCode = organizationCode.toUpperCase()
    if (templateConfig) updateData.templateConfig = templateConfig
    
    // Handle custom slug update
    if (customSlug !== undefined) {
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
      
      // Check if slug already exists (excluding current event)
      const existingSlugEvent = await Event.findOne({ slug: slugTrimmed, _id: { $ne: id } })
      if (existingSlugEvent) {
        return NextResponse.json(
          { error: 'This slug is already in use' },
          { status: 400 }
        )
      }
      
      updateData.slug = slugTrimmed
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-__v')

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Update event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Delete an event
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
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    await connectDB()

    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete all Cloudinary images associated with this event's template
    if (event.templateConfig) {
      await deleteCloudinaryImages(event.templateConfig)
    }

    await Event.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error: any) {
    console.error('Delete event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete event' },
      { status: 500 }
    )
  }
}
