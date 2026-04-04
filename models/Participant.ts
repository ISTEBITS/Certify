import mongoose, { Schema, Document } from 'mongoose'

export interface IParticipant extends Document {
  name: string
  email: string
  eventId: mongoose.Types.ObjectId
  certificateId?: string
  certificateIssued: boolean
  certificateIssuedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    name: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    certificateId: {
      type: String,
      unique: true,
      sparse: true,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateIssuedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
ParticipantSchema.index({ eventId: 1 })
ParticipantSchema.index({ certificateId: 1 })
ParticipantSchema.index({ email: 1, eventId: 1 }, { unique: true })

export default mongoose.models.Participant || mongoose.model<IParticipant>('Participant', ParticipantSchema)
