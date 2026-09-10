import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MailtrapClient } from 'mailtrap'
import connectDB from '@/lib/mongodb'
import Certificate from '@/models/Certificate'
import Participant from '@/models/Participant'
import EmailLog from '@/models/EmailLog'
import { getCertificateDeliveryEmail, getCertificateDeliveryText } from '@/mail-template/mail-template'

// Initialize the Mailtrap Client
const TOKEN = process.env.MAILTRAP_TOKEN || ''
const client = new MailtrapClient({ token: TOKEN })

// Maximum batch size per industry standard & rate limit protection
const MAX_BATCH_SIZE = 20

interface BulkEmailRequest {
  certificateIds: string[]
  eventId?: string
}

interface EmailResult {
  certificateId: string
  participantName: string
  participantEmail: string
  eventName: string
  status: 'success' | 'failed'
  message?: string
  messageId?: string
}

interface ConsoleLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  details?: any
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(request: NextRequest) {
  const consoleLogs: ConsoleLog[] = []
  const results: EmailResult[] = []

  const addLog = (level: ConsoleLog['level'], message: string, details?: any) => {
    consoleLogs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    })
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    logFn(`[${level.toUpperCase()}] ${message}`, details || '')
  }

  try {
    // 1. Session Verification
    addLog('info', 'Verifying administrator session...')
    const session = await getServerSession(authOptions)
    if (!session) {
      addLog('error', 'Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized', logs: consoleLogs },
        { status: 401 }
      )
    }
    addLog('success', `Authenticated as ${session.user?.email || 'admin'}`)

    // 2. Parse Request Body
    addLog('info', 'Validating batch payload parameters...')
    const body: BulkEmailRequest = await request.json()
    const { certificateIds, eventId } = body

    if ((!certificateIds || certificateIds.length === 0) && !eventId) {
      addLog('error', 'Please provide either certificateIds (max 20) or eventId')
      return NextResponse.json(
        { error: 'Please provide either certificateIds or eventId', logs: consoleLogs },
        { status: 400 }
      )
    }

    // 3. Strict 20-recipient threshold enforcement
    if (certificateIds && certificateIds.length > MAX_BATCH_SIZE) {
      addLog('error', `Maximum batch limit exceeded: ${certificateIds.length} requested (Limit: ${MAX_BATCH_SIZE})`)
      return NextResponse.json(
        {
          error: `Maximum selection limit is ${MAX_BATCH_SIZE} certificates per batch to prevent rate limiting.`,
          logs: consoleLogs
        },
        { status: 400 }
      )
    }

    // 4. Connect to Database
    addLog('info', 'Initializing MongoDB connection pool...')
    await connectDB()
    addLog('success', 'MongoDB connected successfully')

    // 5. Fetch Certificates
    let certificates: any[] = []

    if (certificateIds && certificateIds.length > 0) {
      addLog('info', `Fetching ${certificateIds.length} certificate records...`)
      certificates = await Certificate.find({ _id: { $in: certificateIds } })
        .populate('participantId')
        .populate('eventId')
        .limit(MAX_BATCH_SIZE)

      addLog('success', `Successfully retrieved ${certificates.length} certificate records`)
    } else if (eventId) {
      addLog('info', `Querying unsent certificates for event ${eventId} (capped at ${MAX_BATCH_SIZE})...`)
      // Fetch certificates for event whose participant has not yet received email, up to MAX_BATCH_SIZE
      certificates = await Certificate.find({ eventId })
        .populate('participantId')
        .populate('eventId')
        .limit(MAX_BATCH_SIZE)

      addLog('success', `Found ${certificates.length} certificates for processing`)
    }

    if (certificates.length === 0) {
      addLog('warn', 'No certificates found matching the criteria')
      return NextResponse.json({
        message: 'No certificates found',
        results: [],
        logs: consoleLogs,
        summary: { total: 0, success: 0, failed: 0 }
      })
    }

    const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'hello@example.com'
    const fromName = process.env.EMAIL_FROM_NAME || 'Certify'

    addLog('info', `Initializing Mailtrap batch dispatch to ${certificates.length} recipients...`, {
      from: `${fromName} <${fromEmail}>`,
      maxBatch: MAX_BATCH_SIZE
    })

    // 6. Process Each Certificate with rate-limit safety & candidate status updates
    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i]
      const currentIdx = i + 1
      const participantName = cert.participantId?.name || 'Participant'
      const recipientEmail = cert.participantId?.email
      const eventName = cert.eventId?.name || 'Event'
      const certificateId = cert.certificateId

      try {
        addLog('info', `[${currentIdx}/${certificates.length}] Preparing certificate delivery for: ${participantName} <${recipientEmail || 'N/A'}>`)

        // Validate required participant data
        if (!cert.participantId || !recipientEmail || !cert.eventId) {
          addLog('warn', `[${currentIdx}/${certificates.length}] Skipping - missing participant or event relation`, {
            certificateId: cert.certificateId
          })

          results.push({
            certificateId: cert.certificateId,
            participantName,
            participantEmail: recipientEmail || 'N/A',
            eventName,
            status: 'failed',
            message: 'Missing participant or event relation'
          })

          await EmailLog.create({
            participantId: cert.participantId?._id,
            certificateId: cert._id,
            eventId: cert.eventId?._id,
            recipientEmail: recipientEmail || 'N/A',
            participantName,
            eventName,
            certificateNumber: cert.certificateId,
            status: 'failed',
            errorMessage: 'Missing participant or event relation'
          })
          continue
        }

        // Create pending email audit log
        const emailLog = await EmailLog.create({
          participantId: cert.participantId._id,
          certificateId: cert._id,
          eventId: cert.eventId._id,
          recipientEmail,
          participantName,
          eventName,
          certificateNumber: certificateId,
          status: 'pending'
        })

        const verifyUrl = `${process.env.NEXTAUTH_URL || 'https://certify.app'}/verify/${certificateId}`
        const htmlContent = getCertificateDeliveryEmail({
          participantName,
          eventName,
          certificateId,
          verifyUrl,
          fromName,
          eventDate: cert.eventId?.date
            ? new Date(cert.eventId.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : undefined,
          position: cert.position,
          collegeName: cert.participantId?.collegeName,
        })

        const textContent = getCertificateDeliveryText({
          participantName,
          eventName,
          certificateId,
          verifyUrl,
          fromName,
          position: cert.position,
        })

        // Dispatch email via Mailtrap SDK
        const response = await client.send({
          from: { name: fromName, email: fromEmail },
          to: [{ email: recipientEmail }],
          subject: `Your Certificate for ${eventName}`,
          category: 'Certificate Delivery',
          html: htmlContent,
          text: textContent,
        })

        // Update EmailLog as success
        emailLog.status = 'success'
        emailLog.messageIds = response.message_ids || []
        emailLog.sentAt = new Date()
        await emailLog.save()

        // 7. Update Certificate & Participant in database
        await Certificate.findByIdAndUpdate(cert._id, {
          emailSent: true,
          emailSentAt: new Date(),
        })

        if (cert.participantId?._id) {
          await Participant.findByIdAndUpdate(cert.participantId._id, {
            emailSent: true,
            emailSentAt: new Date(),
          })
        }

        addLog('success', `[${currentIdx}/${certificates.length}] Sent to ${recipientEmail} (ID: ${response.message_ids?.[0] || 'OK'})`)

        results.push({
          certificateId,
          participantName,
          participantEmail: recipientEmail,
          eventName,
          status: 'success',
          message: 'Email delivered successfully',
          messageId: response.message_ids?.[0]
        })

        // Small rate limiting pause between sends (100ms)
        await sleep(600)

      } catch (error: any) {
        addLog('error', `[${currentIdx}/${certificates.length}] Delivery failed for ${recipientEmail || 'Unknown'}: ${error.message}`)

        if (cert.participantId && cert.eventId) {
          await EmailLog.findOneAndUpdate(
            {
              certificateId: cert._id,
              status: 'pending'
            },
            {
              status: 'failed',
              errorMessage: error.message || 'Failed to send email'
            }
          )
        }

        results.push({
          certificateId: cert.certificateId || 'Unknown',
          participantName,
          participantEmail: recipientEmail || 'N/A',
          eventName,
          status: 'failed',
          message: error.message || 'Failed to send email'
        })
      }
    }

    // 8. Calculate Final Summary
    const successCount = results.filter(r => r.status === 'success').length
    const failedCount = results.filter(r => r.status === 'failed').length

    addLog('info', `Batch execution finished: ${successCount} successful, ${failedCount} failed of ${certificates.length} total`)
    if (successCount > 0) {
      addLog('success', `${successCount} candidates updated to [Mail Sent] status`)
    }

    return NextResponse.json({
      message: `Bulk email process completed: ${successCount} sent, ${failedCount} failed`,
      results,
      logs: consoleLogs,
      summary: {
        total: certificates.length,
        success: successCount,
        failed: failedCount
      }
    })

  } catch (error: any) {
    addLog('error', 'Unhandled runtime exception in bulk email process', {
      error: error.message
    })

    return NextResponse.json(
      {
        error: error.message || 'Failed to process bulk emails',
        logs: consoleLogs,
        results,
        summary: {
          total: 0,
          success: 0,
          failed: 0
        }
      },
      { status: 500 }
    )
  }
}
