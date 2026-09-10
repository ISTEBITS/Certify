export interface CertificateEmailParams {
  participantName: string
  eventName: string
  certificateId: string
  verifyUrl?: string
  fromName?: string
  eventDate?: string
  position?: string
  collegeName?: string
}


export function getCertificateDeliveryEmail({
  participantName,
  eventName,
  certificateId,
  verifyUrl,
  fromName = 'ISTE BIT Sindri',
  position,
}: CertificateEmailParams): string {
  const verificationLink = verifyUrl || `https://certify.app/verify/${certificateId}`

  return `
  <p>Dear <b>${escapeHtml(participantName)}</b>,</p>
  <p>Greetings from <b>${escapeHtml(fromName)}</b>!</p>
  <p>
    Thank you for your active participation in <b>${escapeHtml(eventName)}</b>${position ? `, achieving <strong>${escapeHtml(position)}</b>` : ''}, organized by <b>${escapeHtml(fromName)}</b>.
  </p>
  <p>
    Please find your Certificate attached to this email. We appreciate your enthusiasm and participation in the event and hope to see you in our future events as well.
  </p>
  <p>
    You can also verify and view your certificate online : <br />
    <a href="${verificationLink}" style="color: #0000ee;">${verificationLink}</a>
  </p>
  <p>
    Best regards,<br />
    <b>Team ${escapeHtml(fromName)}</b>
  </p>`
}


export function getCertificateDeliveryText({
  participantName,
  eventName,
  certificateId,
  verifyUrl,
  fromName = 'ISTE BIT Sindri',
  position,
}: CertificateEmailParams): string {
  const verificationLink = verifyUrl || `https://certify.app/verify/${certificateId}`

  return `Dear ${participantName},

Greetings from ${fromName}!

Thank you for your active participation in ${eventName}${position ? `, achieving ${position}` : ''}, organized by ${fromName}.

Please find your Certificate attached to this email. We appreciate your enthusiasm and participation in the event and hope to see you in our future events as well.

You can also verify and view your certificate online (Certificate ID: ${certificateId}):
${verificationLink}

Best regards,
Team ${fromName}
`
}


export function getCertificateEmailSubject({
  eventName,
  participantName,
}: {
  eventName: string
  participantName: string
}): string {
  return `Certificate of Participation - ${eventName}`
}

export function escapeHtml(str?: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
