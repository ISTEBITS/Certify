# 🎓 Certify - Certificate Management Platform

A full-stack certificate management web application built with Next.js, TypeScript, MongoDB, and react-konva. Create, manage, and issue beautiful certificates with QR code verification.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-8.5-green?logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)

---

## ✨ Features

### 🔐 Admin System
- Secure admin authentication with NextAuth.js
- Protected dashboard with role-based access
- Session management with JWT tokens

### 📅 Event Management
- Create and manage events with detailed metadata
- Auto-generated unique event codes
- Manual event code generation
- Event search and filtering

### 👥 Participant Management
- Add participants manually
- Bulk import via CSV upload with preview
- Search and filter participants by event
- Track certificate issuance status

### 🎨 Certificate Designer
- Canva-like drag-and-drop interface
- Powered by react-konva for canvas rendering
- Upload custom certificate backgrounds
- Add draggable elements:
  - Participant Name
  - Event Name
  - Event Date
  - Certificate ID
  - Custom Text
  - QR Code for verification
- Resize and rotate elements with transformer
- Save template configuration as JSON

### 📜 Certificate Generation
- Client-side PDF generation (no server storage)
- html2canvas + jsPDF for high-quality PDFs
- Unique certificate IDs with checksum validation
- Format: `ORG-EVENTSLUG-2025-000001-A4F9`
- Dynamic regeneration on demand

### 📧 Email Integration
- Send certificates via Resend (Mailtrap)
- Beautiful HTML email templates
- PDF attachments
- Demo mode for development (console logging)

### 🔍 QR-Based Verification
- Unique QR code embedded in each certificate
- Public verification page: `/verify/{certificate_id}`
- Real-time validation with checksum verification
- Certificate metadata display

### 🔄 Dynamic Regeneration
- Fetch certificate data + template_config
- Rebuild certificate UI on demand
- Preview before download
- PDF generation on click

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.5 |
| **Styling** | Tailwind CSS 3.4 |
| **UI Components** | Radix UI + shadcn/ui patterns |
| **Icons** | Lucide React |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | NextAuth.js 4.24 |
| **Certificate Designer** | react-konva + Konva |
| **PDF Generation** | html2canvas + jsPDF |
| **QR Codes** | qrcode |
| **Email** | Resend |
| **CSV Parsing** | PapaParse |
| **Deployment** | Vercel (recommended) |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 (LTS recommended)
- **pnpm** >= 8.0.0 (or npm/yarn)
- **MongoDB** (local or Atlas connection string)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd certify
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Install Additional Dependencies

```bash
pnpm add -D tsx
pnpm add tailwindcss-animate
```

### 4. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/certify
# Or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/certify

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Resend Email Service
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM_ADDRESS=onboarding@resend.dev
EMAIL_FROM_NAME=Certify
```

**Generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 5. Set Up MongoDB

**Option A: Local MongoDB**
1. Install MongoDB locally: https://www.mongodb.com/docs/manual/installation/
2. Start MongoDB: `mongod`
3. The app will connect to `mongodb://localhost:27017/certify`

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env.local`

### 6. Seed the Admin User

Create the default admin user:

```bash
pnpm seed:admin
```

This will create an admin user with:
- **Email:** `admin@certify.com`
- **Password:** `admin123`

> ⚠️ **Important:** Change the default password after first login!

### 7. Start the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
certify/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with SessionProvider
│   ├── page.tsx                  # Home page (redirects to login/dashboard)
│   ├── globals.css               # Global styles and Tailwind
│   ├── login/                    # Login page
│   │   └── page.tsx
│   ├── verify/[id]/              # Public certificate verification
│   │   └── page.tsx
│   ├── dashboard/                # Protected admin dashboard
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home with stats
│   │   ├── events/               # Event management
│   │   │   ├── page.tsx          # Events list
│   │   │   ├── new/page.tsx      # Create event
│   │   │   └── [id]/page.tsx     # Event detail/edit
│   │   ├── participants/         # Participant management
│   │   │   └── page.tsx
│   │   ├── certificates/         # Certificate management
│   │   │   └── page.tsx
│   │   └── designer/             # Certificate designer
│   │       └── page.tsx
│   └── api/                      # API routes
│       ├── auth/                 # NextAuth endpoints
│       ├── events/               # Event CRUD
│       ├── participants/         # Participant management
│       ├── certificates/         # Certificate operations
│       ├── send-email/           # Email sending
│       └── verify/               # Verification endpoints
├── components/
│   └── ui/                       # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── toast.tsx             # Toast notifications
│       ├── toaster.tsx           # Toast provider
│       └── ...
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── mongodb.ts                # MongoDB connection
│   └── utils.ts                  # Helper functions
├── models/                       # Mongoose schemas
│   ├── User.ts
│   ├── Event.ts
│   ├── Participant.ts
│   ├── Certificate.ts
│   └── index.ts
├── types/                        # TypeScript interfaces
│   └── index.ts
├── scripts/
│   └── seed-admin.ts             # Admin user seeding script
├── .env.example                  # Environment variables template
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

---

## 🎯 Usage Guide

### Creating Your First Event

1. Log in with admin credentials
2. Click **"New Event"** on the dashboard or Events page
3. Fill in event details:
   - Event name
   - Description (optional)
   - Date
   - Location (optional)
   - Organization code (3-5 characters)
4. Click **"Create Event"**

### Designing a Certificate Template

1. Navigate to an event's detail page
2. Click **"Design Certificate"**
3. In the designer:
   - Upload a background image (optional)
   - Add elements from the toolbar:
     - Participant Name
     - Event Name
     - Event Date
     - Certificate ID
     - Custom Text
     - QR Code
   - Drag elements to position them
   - Use the transformer to resize/rotate
   - Adjust properties (font size, color, etc.)
4. Click **"Save Template"**

### Adding Participants

**Manual Addition:**
1. Go to **Participants** page
2. Click **"Add Participant"**
3. Enter name, email, and select event
4. Click **"Add"**

**CSV Import:**
1. Click **"Import CSV"**
2. Upload a CSV file with `name` and `email` columns
3. Preview the data (first 5 rows)
4. Click **"Import"**

Sample CSV format:
```csv
name,email
John Doe,john@example.com
Jane Smith,jane@example.com
```

### Issuing Certificates

1. Go to **Participants** page
2. Find the participant
3. Click **"Issue Certificate"** (if not already issued)
4. The system will:
   - Generate a unique certificate ID
   - Create the certificate record
   - Update the participant status

### Downloading Certificates

1. Go to **Certificates** page
2. Find the certificate
3. Click **"Download PDF"**
4. The PDF is generated client-side and downloaded automatically

### Sending Certificates via Email

1. Go to **Certificates** page
2. Find the certificate
3. Click **"Email"**
4. The system will:
   - Generate the PDF
   - Send an email with the certificate attached
   - Show a success/error message

### Verifying a Certificate

1. Visit the verification URL: `https://yourdomain.com/verify/{certificate_id}`
2. Or scan the QR code on the certificate
3. The system will:
   - Validate the certificate ID format
   - Verify the checksum
   - Display certificate details if valid
   - Show an error if invalid

---

## 🔧 API Routes

### Authentication
- `POST /api/auth/register` - Register new admin user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `GET /api/events/[id]` - Get single event
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

### Participants
- `GET /api/participants` - List participants (optional `?eventId` filter)
- `POST /api/participants` - Create participant
- `PATCH /api/participants` - Bulk import from CSV
- `GET /api/participants/[id]` - Get participant
- `PUT /api/participants/[id]` - Update participant
- `PATCH /api/participants/[id]` - Issue certificate
- `DELETE /api/participants/[id]` - Delete participant

### Certificates
- `GET /api/certificates` - List all certificates
- `GET /api/certificates/[id]` - Get certificate by MongoDB ID
- `GET /api/certificates/verify/[id]` - Get certificate by certificate ID (for rendering)

### Email
- `POST /api/send-email` - Send certificate email with PDF attachment

### Verification
- `GET /api/verify/[id]` - Verify certificate (public)

---

## 🗄️ Database Models

### User
```typescript
{
  email: string (unique, lowercase)
  password: string (hashed with bcrypt)
  name: string
  role: 'admin' | 'user'
}
```

### Event
```typescript
{
  name: string
  description?: string
  code: string (unique, auto-generated)
  slug: string (max 8 chars)
  date: Date
  location?: string
  organizationCode: string (3-5 chars, uppercase)
  templateConfig: {
    width: number
    height: number
    backgroundImage?: string
    elements: Array<TemplateElement>
  }
  certificateCount: number
}
```

### Participant
```typescript
{
  name: string
  email: string
  eventId: ObjectId (ref: Event)
  certificateId?: string (unique, sparse)
  certificateIssued: boolean
  certificateIssuedAt?: Date
}
```

### Certificate
```typescript
{
  certificateId: string (unique, format: ORG-SLUG-YEAR-SEQ-CHECKSUM)
  participantId: ObjectId (ref: Participant)
  eventId: ObjectId (ref: Event)
  templateConfig: TemplateConfig (embedded)
  issuedAt: Date
}
```

---

## 🔒 Security Features

- **Password Hashing:** bcrypt with salt rounds
- **Session Management:** JWT tokens with NextAuth
- **Certificate IDs:** SHA-256 checksum validation prevents forgery
- **Protected Routes:** Server-side authentication on all API routes
- **Input Validation:** Mongoose schema validation
- **No PDF Storage:** Certificates generated on-demand, reducing storage risks

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Configure environment variables:
   - `MONGODB_URI` (MongoDB Atlas recommended)
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your production URL)
   - `RESEND_API_KEY`
   - `EMAIL_FROM_ADDRESS`
   - `EMAIL_FROM_NAME`
5. Deploy!

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/certify
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://your-app.vercel.app
RESEND_API_KEY=<your-resend-key>
EMAIL_FROM_ADDRESS=certificates@yourdomain.com
EMAIL_FROM_NAME=Certify
```

> **Note:** For Resend, you need to verify your domain in the Resend dashboard before sending emails.

---

## 🧪 Development Tips

### Running the Seed Script

```bash
pnpm seed:admin
```

### Resetting the Database

```bash
# Drop all collections (WARNING: This deletes all data!)
mongosh certify --eval "db.dropDatabase()"
```

### Viewing Logs

```bash
pnpm dev
# Logs appear in the terminal where you ran the command
```

### Testing Email in Development

If `RESEND_API_KEY` is not set, emails are logged to the console instead of sent. This allows you to test the email flow without actually sending emails.

---

## 📝 Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/certify` |
| `NEXTAUTH_SECRET` | Yes | Secret for JWT token signing | `your-secret-key-change-in-production` |
| `NEXTAUTH_URL` | Yes | Application URL | `http://localhost:3000` |
| `RESEND_API_KEY` | No | Resend API key for email | (empty - demo mode) |
| `EMAIL_FROM_ADDRESS` | No | From address for emails | `onboarding@resend.dev` |
| `EMAIL_FROM_NAME` | No | From name for emails | `Certify` |
| `ADMIN_EMAIL` | No | Seed script admin email | `admin@certify.com` |
| `ADMIN_PASSWORD` | No | Seed script admin password | `admin123` |
| `ADMIN_NAME` | No | Seed script admin name | `Admin User` |

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
MongooseServerSelectionError: connect ECONNREFUSED
```
- Ensure MongoDB is running: `mongod`
- Check your `MONGODB_URI` in `.env.local`

### NextAuth Error
```
Error: [next-auth][error][NO_SECRET]
```
- Set `NEXTAUTH_SECRET` in your `.env.local`
- Generate one with: `openssl rand -base64 32`

### Email Not Sending
- Check that `RESEND_API_KEY` is set
- Verify your domain in Resend dashboard
- Check `EMAIL_FROM_ADDRESS` is using a verified domain

### Certificate Designer Not Loading
- Ensure `react-konva` and `konva` are installed
- Check browser console for errors
- Clear browser cache

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
pnpm build
```

---

## 📄 License

MIT

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, TypeScript, and MongoDB
