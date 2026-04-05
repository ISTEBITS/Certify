import mongoose, { Schema, Document } from 'mongoose'

export interface ICertificate extends Document {
  certificateId: string
  participantId: mongoose.Types.ObjectId
  eventId: mongoose.Types.ObjectId
  certificateType: 'participation' | 'achievement'
  position?: string
  templateConfig: {
    width: number
    height: number
    backgroundImage?: string
    backgroundImagePublicId?: string
    elements: Array<{
      id: string
      type: 'text' | 'qrcode' | 'image'
      field?: 'name' | 'event' | 'date' | 'certificateId' | 'custom'
      content?: string
      x: number
      y: number
      width?: number
      height?: number
      fontSize?: number
      fontFamily?: string
      fontWeight?: string
      fontStyle?: string
      color?: string
      textAlign?: 'left' | 'center' | 'right'
      rotation?: number
      opacity?: number
      letterSpacing?: number
      lineHeight?: number
      textTransform?: 'none' | 'uppercase' | 'lowercase'
      isBold?: boolean
      isItalic?: boolean
      isUnderline?: boolean
      src?: string
      imagePublicId?: string
    }>
  }
  issuedAt: Date
  createdAt: Date
  updatedAt: Date
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    participantId: {
      type: Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    certificateType: {
      type: String,
      enum: ['participation', 'achievement'],
      default: 'participation',
    },
    position: {
      type: String,
      trim: true,
    },
    templateConfig: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      backgroundImage: String,
      backgroundImagePublicId: String,
      elements: [{
        id: String,
        type: { type: String, enum: ['text', 'qrcode', 'image'], required: true },
        field: { type: String, enum: ['name', 'event', 'date', 'certificateId', 'custom', 'collegeName', 'registrationNumber', 'position', 'email'] },
        content: String,
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, default: 200 },
        height: { type: Number, default: 50 },
        fontSize: Number,
        fontFamily: String,
        fontWeight: String,
        fontStyle: String,
        color: String,
        textAlign: { type: String, enum: ['left', 'center', 'right'] },
        rotation: { type: Number, default: 0 },
        opacity: { type: Number, default: 1 },
        letterSpacing: { type: Number, default: 0 },
        lineHeight: { type: Number, default: 1.2 },
        textTransform: { type: String, enum: ['none', 'uppercase', 'lowercase'], default: 'none' },
        isBold: Boolean,
        isItalic: Boolean,
        isUnderline: Boolean,
        src: String, // for image elements (logos, signatures)
        imagePublicId: String, // Cloudinary public ID
      }],
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for faster queries
// Note: certificateId already has a unique index from `unique: true` in schema definition
CertificateSchema.index({ participantId: 1 })
CertificateSchema.index({ eventId: 1 })

export default mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema)
