import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import { inferAssetType } from '@/lib/utils'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        {
          error: 'Cloudinary is not configured',
          configured: false,
        },
        { status: 503 }
      )
    }

    // Fetch all resources from Cloudinary
    const result = await cloudinary.search
      .expression('resource_type:image AND folder:certify/assets')
      .sort_by('created_at', 'desc')
      .max_results(500)
      .execute()

    // Transform Cloudinary resources to our Asset type
    const assets = result.resources.map((resource: any) => {
      const publicId = resource.public_id
      const tags = resource.tags || []
      const type = inferAssetType(publicId, tags)

      return {
        _id: resource.public_id,
        url: resource.secure_url,
        publicId: resource.public_id,
        name: resource.original_filename || publicId.split('/').pop() || 'Untitled',
        type,
        width: resource.width,
        height: resource.height,
        uploadedAt: resource.created_at,
      }
    })

    return NextResponse.json(assets)
  } catch (error: any) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}
