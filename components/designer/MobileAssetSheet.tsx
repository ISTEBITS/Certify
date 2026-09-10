'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Upload,
  Image as ImageIcon,
  Search,
  Loader2,
  Plus,
  Trash2,
  LayoutTemplate,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

export interface AssetItem {
  _id: string
  url: string
  publicId: string
  name: string
  type: 'background' | 'logo' | 'signature' | 'other'
  width?: number
  height?: number
  uploadedAt: string
}

interface MobileAssetSheetProps {
  onAddImage: (src: string, publicId?: string) => void
  onSetAsBackground?: (src: string, publicId?: string) => void
  onClose: () => void
}

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'logo', label: 'Logos' },
  { id: 'signature', label: 'Signatures' },
  { id: 'background', label: 'Backgrounds' },
  { id: 'other', label: 'Other' },
]

export function MobileAssetSheet({
  onAddImage,
  onSetAsBackground,
  onClose,
}: MobileAssetSheetProps) {
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/assets')
      const data = await res.json()
      if (Array.isArray(data)) {
        setAssets(data)
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err)
      toast({
        title: 'Error',
        description: 'Failed to load assets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const fileList = Array.from(files)
    let successCount = 0

    try {
      for (const file of fileList) {
        const base64 = await fileToBase64(file)
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data: base64,
            folder: 'asset',
            name: file.name,
          }),
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || `Failed to upload ${file.name}`)
        }

        const lowerName = file.name.toLowerCase()
        let type: AssetItem['type'] = 'other'
        if (lowerName.includes('logo')) type = 'logo'
        else if (lowerName.includes('signature') || lowerName.includes('sign')) type = 'signature'
        else if (lowerName.includes('background') || lowerName.includes('bg')) type = 'background'

        const newAsset: AssetItem = {
          _id: result.publicId || `temp-${Date.now()}`,
          url: result.url,
          publicId: result.publicId,
          name: result.name || file.name,
          type,
          width: result.width,
          height: result.height,
          uploadedAt: new Date().toISOString(),
        }

        setAssets((prev) => [newAsset, ...prev])
        successCount++
      }

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${successCount} asset(s)`,
      })
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err.message || 'Error uploading asset',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || asset.type === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="w-full bg-card text-card-foreground rounded-t-3xl border-t border-border shadow-2xl flex flex-col font-sans select-none pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[height] duration-200 ease-out max-h-[82vh]">
      {/* Top Drag Handle */}
      <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2.5 mb-1 shrink-0" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-1.5 border-b border-border/40 shrink-0">
        <div className="w-8" />
        <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-primary" />
          <span>Asset Library</span>
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-foreground transition-colors active:scale-95"
          title="Close"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Upload and Search Bar */}
      <div className="p-3.5 pb-2 space-y-2.5 shrink-0">
        {/* Hidden File Input & Upload Trigger Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-10 rounded-lg gap-2 text-sm font-semibold"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading Image...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Upload New Images</span>
            </>
          )}
        </Button>

        {/* Category Pills Switcher */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 rounded-xl text-sm font-semibold transition shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-primary/15 text-primary py-1.5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 py-1.5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="flex-1 overflow-y-auto px-3.5 py-1">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading assets...</span>
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 pb-2">
            {filteredAssets.map((asset) => (
              <div
                key={asset._id}
                className="group relative aspect-square rounded-2xl border border-border bg-muted/20 overflow-hidden hover:border-primary/50 transition shadow-xs flex flex-col items-center justify-center p-1 cursor-pointer active:scale-95"
                onClick={() => {
                  onAddImage(asset.url, asset.publicId)
                  onClose()
                }}
              >
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-contain rounded-xl"
                  loading="lazy"
                />
                {/* Title badge overlay on hover/touch */}
                <div className="absolute inset-x-0 bottom-0 bg-background/90 backdrop-blur-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                  <span className="text-[9px] font-medium text-foreground truncate block flex-1">
                    {asset.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-1.5">
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            <p>No assets found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
