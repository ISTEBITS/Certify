'use client'

import React, { useRef } from 'react'
import {
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { ASSET_CATEGORIES } from './types'
import { useAssetManager } from './useAssetManager'

interface MobileAssetSheetProps {
  onAddImage: (src: string, publicId?: string) => void
  onSetAsBackground?: (src: string, publicId?: string) => void
  onClose: () => void
}

export function MobileAssetSheet({
  onAddImage,
  onClose,
}: MobileAssetSheetProps) {
  const {
    loading,
    uploading,
    activeCategory,
    setActiveCategory,
    filteredAssets,
    uploadFiles,
  } = useAssetManager()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

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

      {/* Upload and Category Bar */}
      <div className="p-3.5 pb-2 space-y-2.5 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
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

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {ASSET_CATEGORIES.map((cat) => (
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
                <Image
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-contain rounded-xl"
                  width={100}
                  height={100}
                  quality={80}
                  loading="lazy"
                />
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
