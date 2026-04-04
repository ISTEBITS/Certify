import mongoose, { Schema, Document } from 'mongoose'

export interface IEvent extends Document {
  name: string
  description?: string
  slug: string
  code: string
  date: Date
  location?: string
  organizationCode: string
  templateConfig?: {
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
      color?: string
      textAlign?: 'left' | 'center' | 'right'
      rotation?: number
    }>
  }
  certificateCount: number
  createdAt: Date
  updatedAt: Date
}

const EventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    location: {
      type: String,
      trim: true,
    },
    organizationCode: {
      type: String,
      required: [true, 'Organization code is required'],
      trim: true,
      uppercase: true,
    },
    templateConfig: {
      width: { type: Number, default: 842 },
      height: { type: Number, default: 595 },
      backgroundImage: String,
      backgroundImagePublicId: String,
      elements: [{
        id: String,
        type: { type: String, enum: ['text', 'qrcode', 'image'] },
        field: { type: String, enum: ['name', 'event', 'date', 'certificateId', 'custom'] },
        content: String,
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
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
        imagePublicId: String, // Cloudinary public ID for deletion
      }],
    },
    certificateCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema)
