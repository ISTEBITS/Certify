import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmailLog from '@/models/EmailLog'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || 'all'
    const eventId = searchParams.get('eventId') || 'all'
    const search = searchParams.get('search') || ''

    const query: any = {}

    if (status !== 'all') {
      query.status = status
    }

    if (eventId !== 'all') {
      query.eventId = eventId
    }

    if (search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i')
      query.$or = [
        { participantName: regex },
        { recipientEmail: regex },
        { eventName: regex },
        { certificateNumber: regex },
      ]
    }

    const skip = (page - 1) * limit

    const [logs, total, totalSuccess, totalFailed, totalPending] = await Promise.all([
      EmailLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmailLog.countDocuments(query),
      EmailLog.countDocuments({ status: 'success' }),
      EmailLog.countDocuments({ status: 'failed' }),
      EmailLog.countDocuments({ status: 'pending' }),
    ])

    const totalAll = totalSuccess + totalFailed + totalPending

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        total: totalAll,
        success: totalSuccess,
        failed: totalFailed,
        pending: totalPending,
        successRate: totalAll > 0 ? Math.round((totalSuccess / totalAll) * 100) : 0,
      },
    })
  } catch (error: any) {
    console.error('Error fetching email logs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email logs' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const logId = searchParams.get('id')

    if (logId) {
      await EmailLog.findByIdAndDelete(logId)
      return NextResponse.json({ message: 'Email log deleted successfully' })
    } else {
      // Clear all logs
      await EmailLog.deleteMany({})
      return NextResponse.json({ message: 'All email logs cleared successfully' })
    }
  } catch (error: any) {
    console.error('Error deleting email logs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete email logs' },
      { status: 500 }
    )
  }
}
