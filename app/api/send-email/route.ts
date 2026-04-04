import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MailtrapClient } from 'mailtrap'

// Initialize the Mailtrap Client
// Note: For Sandbox (testing), use the endpoint: https://send.api.mailtrap.io
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

    // 4. Handle PDF Attachment
    // The Mailtrap SDK expects a Buffer or a base64 string for content
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

    console.log(fromName)

    // 5. Send using Mailtrap SDK
    // If using Sandbox, ensure your 'to' address is a verified inbox email
    const response = await client.send({
      from: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject: subject,
      category: "Certificate Delivery",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 26px;">Congratulations!</h1>
          </div>
          <div style="padding: 40px; background: #ffffff; border-radius: 0 0 8px 8px;">
            <p style="font-size: 18px; color: #333;">Hi ${participantName},</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              You have successfully completed <strong>${eventName}</strong>. 
              Your official certificate is attached to this email.
            </p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; border: 1px solid #edf2f7;">
              <p style="margin: 0; color: #718096; font-size: 13px; text-transform: uppercase;">Verification ID</p>
              <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 18px; color: #2d3748; font-weight: bold;">
                ${certificateId}
              </p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a 
                href="${process.env.NEXTAUTH_URL}/verify/${certificateId}" 
                style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;"
              >
                Verify Certificate
              </a>
            </p>
            <p style="font-size: 14px; color: #a0aec0; margin-top: 40px; text-align: center;">
              Sent by Certify Team
            </p>
          </div>
        </div>
      `,
      attachments: attachments as any, // Type cast for SDK compatibility if needed
    })

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