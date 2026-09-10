import mongoose, { Schema, Document } from 'mongoose'

export interface IEmailLog extends Document {
  participantId: mongoose.Types.ObjectId
  certificateId: mongoose.Types.ObjectId
  eventId: mongoose.Types.ObjectId
  recipientEmail: string
  participantName: string
  eventName: string
  certificateNumber: string
  status: 'pending' | 'success' | 'failed'
  errorMessage?: string
  messageIds?: string[]
  sentAt?: Date
  createdAt: Date
  updatedAt: Date
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    participantId: {
      type: Schema.Types.ObjectId,
      ref: 'Participant',
      required: [true, 'Participant ID is required'],
    },
    certificateId: {
      type: Schema.Types.ObjectId,
      ref: 'Certificate',
      required: [true, 'Certificate ID is required'],
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email is required'],
      trim: true,
      lowercase: true,
    },
    participantName: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
    },
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    certificateNumber: {
      type: String,
      required: [true, 'Certificate ID is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    messageIds: {
      type: [String],
      default: [],
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
EmailLogSchema.index({ eventId: 1 })
EmailLogSchema.index({ certificateId: 1 })
EmailLogSchema.index({ status: 1 })
EmailLogSchema.index({ createdAt: -1 })

export default mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema)
