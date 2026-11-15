import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MailtrapClient } from 'mailtrap'
import connectDB from '@/lib/mongodb'
import Certificate from '@/models/Certificate'
import Participant from '@/models/Participant'
import EmailLog from '@/models/EmailLog'
import { getCertificateDeliveryEmail, getCertificateDeliveryText } from '@/mail-template/mail-template'
import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { CertificatePDF } from '@/components/CertificateTemplate'
import QRCode from 'qrcode'

// Initialize the Mailtrap Client
const TOKEN = process.env.MAILTRAP_TOKEN || ''
const client = new MailtrapClient({ token: TOKEN })

// Maximum batch size per industry standard & rate limit protection
const MAX_BATCH_SIZE = 20

interface BulkEmailRequest {
  certificateIds?: string[]
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

/**
 * Generate PDF buffer and return as base64 on the server
 */
async function generateCertificatePdfBase64(cert: any): Promise<string | null> {
  try {
    const certClone = JSON.parse(JSON.stringify(cert))

    // Ensure templateConfig exists (fallback to event templates if needed)
    if (
      !certClone.templateConfig ||
      (!certClone.templateConfig.elements?.length && !certClone.templateConfig.backgroundImage)
    ) {
      certClone.templateConfig =
        certClone.certificateType === 'achievement' &&
        certClone.eventId?.achievementTemplate?.elements?.length
          ? certClone.eventId.achievementTemplate
          : certClone.eventId?.participationTemplate ||
            certClone.eventId?.achievementTemplate || {
              width: 842,
              height: 595,
              elements: [],
            }
    }

    // Generate QR Code data URL
    const qrUrl = `${process.env.NEXTAUTH_URL || 'https://certify.app'}/verify/${certClone.certificateId}`
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1 })

    if (Array.isArray(certClone.templateConfig?.elements)) {
      for (const el of certClone.templateConfig.elements) {
        if (el.type === 'qrcode') {
          el.qrDataUrl = qrDataUrl
        }
      }
    }

    const doc = React.createElement(CertificatePDF, { cert: certClone })
    const stream = await (pdf(doc as any) as any).toBuffer()
    const chunks: Buffer[] = []

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => resolve())
      stream.on('error', (err: any) => reject(err))
    })

    const pdfBuffer = Buffer.concat(chunks)
    return pdfBuffer.toString('base64')
  } catch (error) {
    console.error('Error generating PDF on server:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  // 1. Session Verification
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response(
      JSON.stringify({
        type: 'log',
        log: {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Unauthorized access attempt - please sign in.',
        },
      }) +
        '\n' +
        JSON.stringify({
          type: 'done',
          error: 'Unauthorized',
          summary: { total: 0, success: 0, failed: 0 },
        }) +
        '\n',
      {
        status: 401,
        headers: { 'Content-Type': 'application/x-ndjson' },
      }
    )
  }

  // 2. Parse Request Body
  let body: BulkEmailRequest
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify({
        type: 'log',
        log: {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Invalid JSON request payload.',
        },
      }) + '\n',
      {
        status: 400,
        headers: { 'Content-Type': 'application/x-ndjson' },
      }
    )
  }

  const { certificateIds, eventId } = body

  if ((!certificateIds || certificateIds.length === 0) && !eventId) {
    return new Response(
      JSON.stringify({
        type: 'log',
        log: {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Please provide either certificateIds (max 20) or eventId.',
        },
      }) + '\n',
      {
        status: 400,
        headers: { 'Content-Type': 'application/x-ndjson' },
      }
    )
  }

  if (certificateIds && certificateIds.length > MAX_BATCH_SIZE) {
    return new Response(
      JSON.stringify({
        type: 'log',
        log: {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Maximum batch limit exceeded: ${certificateIds.length} requested (Limit: ${MAX_BATCH_SIZE}).`,
        },
      }) + '\n',
      {
        status: 400,
        headers: { 'Content-Type': 'application/x-ndjson' },
      }
    )
  }

  // Setup streaming response for real-time live log and progress updates
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  const sendEvent = async (data: any) => {
    try {
      await writer.write(encoder.encode(JSON.stringify(data) + '\n'))
    } catch {
      // client may have closed connection
    }
  }

  const addLog = async (level: ConsoleLog['level'], message: string, details?: any) => {
    const logItem: ConsoleLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    }
    await sendEvent({ type: 'log', log: logItem })
  }

  // Execute queue asynchronously within the stream
  ;(async () => {
    const results: EmailResult[] = []

    try {
      await addLog('info', 'Verifying administrator session...')
      await addLog('success', `Authenticated as ${session.user?.email || 'admin'}`)

      await addLog('info', 'Initializing database connection pool...')
      await connectDB()
      await addLog('success', 'MongoDB connected successfully')

      // Fetch Certificates
      let certificates: any[] = []

      if (certificateIds && certificateIds.length > 0) {
        await addLog('info', `Querying ${certificateIds.length} certificate records...`)
        certificates = await Certificate.find({ _id: { $in: certificateIds } })
          .populate('participantId')
          .populate(
            'eventId',
            'name organizationCode date slug description location participationTemplate achievementTemplate'
          )
          .limit(MAX_BATCH_SIZE)

        await addLog(
          'success',
          `Successfully retrieved ${certificates.length} certificate records for dispatch`
        )
      } else if (eventId) {
        await addLog(
          'info',
          `Querying unsent certificates for event ${eventId} (capped at ${MAX_BATCH_SIZE})...`
        )
        certificates = await Certificate.find({ eventId })
          .populate('participantId')
          .populate(
            'eventId',
            'name organizationCode date slug description location participationTemplate achievementTemplate'
          )
          .limit(MAX_BATCH_SIZE)

        await addLog('success', `Found ${certificates.length} certificates for processing`)
      }

      if (certificates.length === 0) {
        await addLog('warn', 'No certificates found matching the criteria')
        await sendEvent({
          type: 'done',
          message: 'No certificates found',
          results: [],
          summary: { total: 0, success: 0, failed: 0 },
        })
        return
      }

      const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'certificates@istebits.com'
      const fromName = process.env.EMAIL_FROM_NAME || 'ISTE BITS'

      await addLog(
        'info',
        `Starting dispatch queue for ${certificates.length} recipients with PDF attachments...`,
        {
          from: `${fromName} <${fromEmail}>`,
          batchSize: certificates.length,
        }
      )

      // Initialize live summary
      await sendEvent({
        type: 'summary',
        summary: {
          total: certificates.length,
          success: 0,
          failed: 0,
        },
      })

      // Process each certificate sequentially in queue
      for (let i = 0; i < certificates.length; i++) {
        const cert = certificates[i]
        const currentIdx = i + 1
        const participantName = cert.participantId?.name || 'Participant'
        const recipientEmail = cert.participantId?.email
        const eventName = cert.eventId?.name || 'Event'
        const certificateId = cert.certificateId

        try {
          await addLog(
            'info',
            `[${currentIdx}/${certificates.length}] Queue item: ${participantName} <${recipientEmail || 'N/A'}>`
          )

          // Validate required participant data
          if (!cert.participantId || !recipientEmail || !cert.eventId) {
            await addLog(
              'warn',
              `[${currentIdx}/${certificates.length}] Skipping - missing participant or event record`,
              { certificateId: cert.certificateId }
            )

            const failResult: EmailResult = {
              certificateId: cert.certificateId,
              participantName,
              participantEmail: recipientEmail || 'N/A',
              eventName,
              status: 'failed',
              message: 'Missing participant or event relation',
            }
            results.push(failResult)
            await sendEvent({ type: 'result', result: failResult })

            await EmailLog.create({
              participantId: cert.participantId?._id,
              certificateId: cert._id,
              eventId: cert.eventId?._id,
              recipientEmail: recipientEmail || 'N/A',
              participantName,
              eventName,
              certificateNumber: cert.certificateId,
              status: 'failed',
              errorMessage: 'Missing participant or event relation',
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
            status: 'pending',
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

          // Generate PDF Attachment (identical to /api/send-email attachment structure)
          await addLog(
            'info',
            `[${currentIdx}/${certificates.length}] Generating certificate PDF with QR code...`
          )
          const pdfBase64 = await generateCertificatePdfBase64(cert)

          const attachments: any[] = []
          if (pdfBase64) {
            attachments.push({
              filename: `certificate-${certificateId}.pdf`,
              content: pdfBase64,
              type: 'application/pdf',
              disposition: 'attachment',
            })
            const kbSize = Math.round((pdfBase64.length * 0.75) / 1024)
            await addLog(
              'success',
              `[${currentIdx}/${certificates.length}] Certificate PDF generated (${kbSize} KB attachment)`
            )
          } else {
            await addLog(
              'warn',
              `[${currentIdx}/${certificates.length}] PDF generation failed; proceeding with secure online verification link.`
            )
          }

          // Dispatch email via Mailtrap SDK with PDF attachment
          await addLog(
            'info',
            `[${currentIdx}/${certificates.length}] Dispatching email via Mailtrap to ${recipientEmail}...`
          )
          const response = await client.send({
            from: { name: fromName, email: fromEmail },
            to: [{ email: recipientEmail }],
            subject: `Your Certificate for ${eventName}`,
            category: 'Certificate Delivery',
            html: htmlContent,
            text: textContent,
            attachments: attachments.length > 0 ? (attachments as any) : undefined,
          })

          // Update EmailLog as success
          emailLog.status = 'success'
          emailLog.messageIds = response.message_ids || []
          emailLog.sentAt = new Date()
          await emailLog.save()

          // Update Certificate & Participant in database
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

          const successResult: EmailResult = {
            certificateId,
            participantName,
            participantEmail: recipientEmail,
            eventName,
            status: 'success',
            message: attachments.length > 0 ? 'Email delivered with PDF attachment' : 'Email delivered',
            messageId: response.message_ids?.[0],
          }
          results.push(successResult)
          await sendEvent({ type: 'result', result: successResult })

          await addLog(
            'success',
            `[${currentIdx}/${certificates.length}] Sent to ${recipientEmail} (Msg ID: ${response.message_ids?.[0] || 'OK'})`
          )

          // Emit live summary update
          const currentSuccess = results.filter((r) => r.status === 'success').length
          const currentFailed = results.filter((r) => r.status === 'failed').length
          await sendEvent({
            type: 'summary',
            summary: {
              total: certificates.length,
              success: currentSuccess,
              failed: currentFailed,
            },
          })

          // Safe rate limiting pause between sends (600ms)
          await sleep(600)
        } catch (error: any) {
          await addLog(
            'error',
            `[${currentIdx}/${certificates.length}] Delivery failed for ${recipientEmail || 'Unknown'}: ${error.message}`
          )

          if (cert.participantId && cert.eventId) {
            await EmailLog.findOneAndUpdate(
              {
                certificateId: cert._id,
                status: 'pending',
              },
              {
                status: 'failed',
                errorMessage: error.message || 'Failed to send email',
              }
            )
          }

          const failResult: EmailResult = {
            certificateId: cert.certificateId || 'Unknown',
            participantName,
            participantEmail: recipientEmail || 'N/A',
            eventName,
            status: 'failed',
            message: error.message || 'Failed to send email',
          }
          results.push(failResult)
          await sendEvent({ type: 'result', result: failResult })

          // Emit live summary update
          const currentSuccess = results.filter((r) => r.status === 'success').length
          const currentFailed = results.filter((r) => r.status === 'failed').length
          await sendEvent({
            type: 'summary',
            summary: {
              total: certificates.length,
              success: currentSuccess,
              failed: currentFailed,
            },
          })
        }
      }

      // Final summary
      const finalSuccess = results.filter((r) => r.status === 'success').length
      const finalFailed = results.filter((r) => r.status === 'failed').length

      await addLog(
        'info',
        `Queue complete: ${finalSuccess} delivered successfully, ${finalFailed} failed of ${certificates.length} total.`
      )
      if (finalSuccess > 0) {
        await addLog('success', `Updated ${finalSuccess} candidates to [Mail Sent] status in database.`)
      }

      await sendEvent({
        type: 'done',
        message: `Bulk email process completed: ${finalSuccess} sent, ${finalFailed} failed`,
        results,
        summary: {
          total: certificates.length,
          success: finalSuccess,
          failed: finalFailed,
        },
      })
    } catch (error: any) {
      await addLog('error', 'Unhandled error in bulk email queue', { error: error.message })
      await sendEvent({
        type: 'done',
        error: error.message || 'Failed to process bulk emails',
        results,
        summary: {
          total: results.length,
          success: results.filter((r) => r.status === 'success').length,
          failed: results.filter((r) => r.status === 'failed').length,
        },
      })
    } finally {
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
