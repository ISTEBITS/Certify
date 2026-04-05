import mongoose, { Schema, Document } from 'mongoose'

export interface IEvent extends Document {
  name: string
  description?: string
  slug: string
  code: string
  date: Date
  location?: string
  organizationName: string
  organizationCode: string
  participationTemplate?: {
    width: number
    height: number
    backgroundImage?: string
    backgroundImagePublicId?: string
    elements: Array<{
      id: string
      type: 'text' | 'qrcode' | 'image'
      field?: 'name' | 'event' | 'date' | 'certificateId' | 'custom' | 'collegeName' | 'registrationNumber' | 'position' | 'email'
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
      opacity?: number
      letterSpacing?: number
      lineHeight?: number
      textTransform?: 'none' | 'uppercase' | 'lowercase'
      isBold?: boolean
      isItalic?: boolean
      isUnderline?: boolean
      src?: string
      imagePublicId?: string
      richTextSegments?: Array<{
        text: string
        isBold?: boolean
        isItalic?: boolean
        isUnderline?: boolean
        fontSize?: number
        color?: string
        fontFamily?: string
        field?: string
        textTransform?: string
      }>
    }>
  }
  achievementTemplate?: {
    width: number
    height: number
    backgroundImage?: string
    backgroundImagePublicId?: string
    elements: Array<{
      id: string
      type: 'text' | 'qrcode' | 'image'
      field?: 'name' | 'event' | 'date' | 'certificateId' | 'custom' | 'collegeName' | 'registrationNumber' | 'position' | 'email'
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
      opacity?: number
      letterSpacing?: number
      lineHeight?: number
      textTransform?: 'none' | 'uppercase' | 'lowercase'
      isBold?: boolean
      isItalic?: boolean
      isUnderline?: boolean
      src?: string
      imagePublicId?: string
      richTextSegments?: Array<{
        text: string
        isBold?: boolean
        isItalic?: boolean
        isUnderline?: boolean
        fontSize?: number
        color?: string
        fontFamily?: string
        field?: string
        textTransform?: string
      }>
    }>
  }
  certificateCount: number
  createdAt: Date
  updatedAt: Date
}

const TemplateElementSchema = {
  id: String,
  type: { type: String, enum: ['text', 'qrcode', 'image'] },
  field: { type: String, enum: ['name', 'event', 'date', 'certificateId', 'custom', 'collegeName', 'registrationNumber', 'position', 'email'] },
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
  src: String,
  imagePublicId: String,
  richTextSegments: [{
    text: String,
    isBold: Boolean,
    isItalic: Boolean,
    isUnderline: Boolean,
    fontSize: Number,
    color: String,
    fontFamily: String,
    field: String,
    textTransform: String,
  }],
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
      minlength: [2, 'Slug must be at least 2 characters'],
      maxlength: [6, 'Slug cannot exceed 6 characters'],
      validate: {
        validator: function(v: string) {
          return /^[a-zA-Z0-9]+$/.test(v);
        },
        message: 'Slug must contain only alphanumeric characters'
      }
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
    organizationName: {
      type: String,
      required: [true, 'Organization Name is required'],
    },
    organizationCode: {
      type: String,
      required: [true, 'Organization code is required'],
      trim: true,
      uppercase: true,
    },
    participationTemplate: {
      width: { type: Number, default: 842 },
      height: { type: Number, default: 595 },
      backgroundImage: String,
      backgroundImagePublicId: String,
      elements: [TemplateElementSchema],
    },
    achievementTemplate: {
      width: { type: Number, default: 842 },
      height: { type: Number, default: 595 },
      backgroundImage: String,
      backgroundImagePublicId: String,
      elements: [TemplateElementSchema],
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
