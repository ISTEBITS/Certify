/**
 * Seed Admin User Script
 *
 * Creates a default admin user in the database.
 * Run with: npx tsx scripts/seed-admin.ts
 *
 * Environment variables (optional - defaults provided):
 * - ADMIN_EMAIL (default: admin@certify.com)
 * - ADMIN_PASSWORD (default: admin123)
 * - ADMIN_NAME (default: Admin User)
 * - MONGODB_URI (default: mongodb://localhost:27017/certify)
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// Schema definition (inline to avoid import issues in script context)
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'admin',
    },
  },
  { timestamps: true }
)

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@certify.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const name = process.env.ADMIN_NAME || 'Admin User'
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/certify'

  console.log('🌱 Seeding admin user...')
  console.log(`   Email: ${email}`)
  console.log(`   Name: ${name}`)

  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Check if admin user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('⚠️  Admin user already exists. Skipping creation.')
      console.log(`   ID: ${existingUser._id}`)
      await mongoose.disconnect()
      console.log('👋 Disconnected from MongoDB')
      return
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create admin user
    const adminUser = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'admin',
    })

    console.log('✅ Admin user created successfully!')
    console.log(`   ID: ${adminUser._id}`)
    console.log('')
    console.log('🔐 Login credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('')
    console.log('⚠️  Please change the password after first login!')

    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  } catch (error: any) {
    console.error('❌ Error seeding admin user:', error.message)
    process.exit(1)
  }
}

seedAdmin()
