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

export async function POST(request: NextRequest) {
  try {
    // 1. Session Verification
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse Request Body
    const body = await request.json()
    const { 
      to, 
      subject, 
      participantName, 
      eventName, 
      certificateId, 
      pdfBase64, 
      pdfName 
    } = body

    // 3. Validation
    if (!to || !subject || !participantName || !eventName || !certificateId) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find the certificate record to obtain participant and event IDs
    const certRecord = await Certificate.findOne({ certificateId }).populate('participantId eventId')

    // 4. Handle PDF Attachment
    const attachments = []
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.includes(',') 
        ? pdfBase64.split(',')[1] 
        : pdfBase64

      attachments.push({
        filename: pdfName || `certificate-${certificateId}.pdf`,
        content: cleanBase64,
        type: 'application/pdf',
        disposition: 'attachment',
      })
    }

    const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'hello@example.com'
    const fromName = process.env.EMAIL_FROM_NAME || 'Certify'
    const verifyUrl = `${process.env.NEXTAUTH_URL || 'https://certify.app'}/verify/${certificateId}`

    const htmlContent = getCertificateDeliveryEmail({
      participantName,
      eventName,
      certificateId,
      verifyUrl,
      fromName,
      eventDate: certRecord?.eventId?.date
        ? new Date(certRecord.eventId.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : undefined,
      position: certRecord?.position,
      collegeName: certRecord?.participantId?.collegeName,
    })

    const textContent = getCertificateDeliveryText({
      participantName,
      eventName,
      certificateId,
      verifyUrl,
      fromName,
      position: certRecord?.position,
    })

    // 5. Send using Mailtrap SDK
    const response = await client.send({
      from: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject: subject,
      category: 'Certificate Delivery',
      html: htmlContent,
      text: textContent,
      attachments: attachments as any,
    })

    // 6. Update Certificate, Participant and EmailLog in MongoDB
    if (certRecord) {
      await Certificate.findByIdAndUpdate(certRecord._id, {
        emailSent: true,
        emailSentAt: new Date(),
      })

      if (certRecord.participantId) {
        const pId = certRecord.participantId._id || certRecord.participantId
        await Participant.findByIdAndUpdate(pId, {
          emailSent: true,
          emailSentAt: new Date(),
        })

        await EmailLog.create({
          participantId: pId,
          certificateId: certRecord._id,
          eventId: certRecord.eventId?._id || certRecord.eventId,
          recipientEmail: to,
          participantName,
          eventName,
          certificateNumber: certificateId,
          status: 'success',
          messageIds: response.message_ids || [],
          sentAt: new Date(),
        })
      }
    }

    return NextResponse.json({
      message: 'Email sent successfully',
      success: response.success,
      messageId: response.message_ids?.[0],
    })

  } catch (error: any) {
    console.error('Mailtrap SDK Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}