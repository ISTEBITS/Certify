import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Event, Participant, Certificate } from '@/models'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const [totalEvents, totalParticipants, totalCertificates, recentEvents] = await Promise.all([
      Event.countDocuments(),
      Participant.countDocuments(),
      Certificate.countDocuments(),
      Event.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name date certificateCount')
        .lean(),
    ])

    return NextResponse.json({
      totalEvents,
      totalParticipants,
      totalCertificates,
      recentEvents,
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
