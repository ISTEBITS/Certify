'use client'

import React, { useState, useRef } from 'react'
import {
  Upload,
  Trash2,
  Search,
  Loader2,
  Plus,
  LayoutTemplate,
  X,
  FileImage,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'
import { TemplateConfig, AssetItem, ASSET_CATEGORIES } from './types'
import { useAssetManager } from './useAssetManager'

interface UploadsPanelProps {
  onAddImage: (src: string, publicId?: string) => void
  onSetAsBackground: (src: string, publicId?: string) => void
  template?: TemplateConfig
  onClose?: () => void
  className?: string
}

export function UploadsPanel({
  onAddImage,
  onSetAsBackground,
  template,
  onClose,
  className = '',
}: UploadsPanelProps) {
  const {
    loading,
    uploading,
    uploadProgressText,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    filteredAssets,
    typeCounts,
    fetchAssets,
    uploadFiles,
    deleteAsset,
  } = useAssetManager()

  const [isDragging, setIsDragging] = useState(false)
  const [deleteDialogAsset, setDeleteDialogAsset] = useState<AssetItem | null>(null)
  const [deletingAsset, setDeletingAsset] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files)
    }
  }

  const handleDeleteAsset = async () => {
    if (!deleteDialogAsset) return
    setDeletingAsset(true)
    try {
      await deleteAsset(deleteDialogAsset.publicId)
    } finally {
      setDeletingAsset(false)
      setDeleteDialogAsset(null)
    }
  }

  return (
    <div className={`flex flex-col h-full bg-card text-card-foreground select-none ${className}`}>
      {/* 1. Header */}
      <div className="h-10 px-4 border-b border-border flex items-center justify-between shrink-0 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Upload className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Uploads & Assets</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={fetchAssets}
            disabled={loading}
            title="Refresh assets"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              title="Close panel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Actions & Upload Zone */}
      <div className="p-3 space-y-2.5 border-b border-border shrink-0 bg-muted/20">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />

        {/* Drag & drop upload box */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)
          }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[0.99]'
              : 'border-border/80 hover:border-primary/60 hover:bg-card bg-background/50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center py-1 gap-1.5">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-[11px] font-medium text-foreground">
                {uploadProgressText || 'Uploading...'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center py-0.5 text-center gap-1">
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <Upload className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground">Upload images</span>
                <span className="text-[11px] text-muted-foreground block">
                  Click or drag files (PNG, JPG, SVG, WebP)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-7 h-7 text-xs bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
          {ASSET_CATEGORIES.map((cat) => {
            const count = typeCounts[cat.id] || 0
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-full ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background/80 text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Asset Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Loading library...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground">
            <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center mb-2">
              <FileImage className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-xs font-medium text-foreground mb-0.5">
              {searchQuery || activeCategory !== 'all'
                ? 'No matching assets found'
                : 'No assets uploaded yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map((asset) => {
              const isCurrentBackground =
                template?.backgroundImage === asset.url ||
                template?.backgroundImagePublicId === asset.publicId

              return (
                <div
                  key={asset._id}
                  className={`group relative aspect-square rounded-lg border bg-muted/30 overflow-hidden cursor-pointer transition-all shadow-xs flex flex-col justify-between ${
                    isCurrentBackground
                      ? 'border-primary ring-1 ring-primary/40'
                      : 'border-border hover:border-primary/60 hover:shadow-sm'
                  }`}
                  onClick={() => onAddImage(asset.url, asset.publicId)}
                  title={`Click to add ${asset.name} to canvas`}
                >
                  {/* Checkerboard background for transparent images */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)',
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                    }}
                  />

                  {/* Thumbnail Image */}
                  <div className="relative w-full h-full p-2 flex items-center justify-center">
                    <Image
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-200"
                      width={120}
                      height={120}
                      quality={80}
                      loading="lazy"
                    />
                  </div>

                  {/* Top Badge: Type Indicator */}
                  <div className="absolute top-1 left-1 pointer-events-none">
                    {isCurrentBackground ? (
                      <span className="text-[8px] font-semibold bg-primary text-primary-foreground px-1 py-0.5 rounded shadow-xs">
                        BG
                      </span>
                    ) : (
                      asset.type !== 'other' && (
                        <span className="text-[8px] uppercase tracking-wider font-semibold bg-background/80 backdrop-blur-xs text-muted-foreground px-1 py-0.5 rounded border border-border/50">
                          {asset.type}
                        </span>
                      )
                    )}
                  </div>

                  {/* Bottom Filename Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-background/90 backdrop-blur-xs px-1.5 py-1 border-t border-border/40 transition-opacity">
                    <p className="text-[10px] font-medium text-foreground truncate">{asset.name}</p>
                  </div>

                  {/* Hover Actions Bar */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-10">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteDialogAsset(asset)
                        }}
                        className="p-1 rounded bg-red-600/90 hover:bg-red-600 text-white shadow-xs transition-colors"
                        title="Delete asset"
                      >
                        {deletingAsset ? <Loader2 className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <Button
                        type="button"
                        size="sm"
                        className="w-full h-6 text-[10px] gap-1 px-1.5 bg-primary text-primary-foreground font-medium shadow-xs hover:bg-primary/90"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddImage(asset.url, asset.publicId)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Element</span>
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full h-6 text-[10px] gap-1 px-1.5 bg-background/90 hover:bg-background text-foreground font-medium shadow-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSetAsBackground(asset.url, asset.publicId)
                        }}
                      >
                        <LayoutTemplate className="h-3 w-3 text-primary" />
                        <span>Set Background</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deleteDialogAsset}
        onOpenChange={(open) => {
          if (!deletingAsset && !open) {
            setDeleteDialogAsset(null)
          }
        }}
      >
        <AlertDialogContent className="max-w-xs sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete &quot;{deleteDialogAsset?.name}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deletingAsset} className="text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteAsset()
              }}
              disabled={deletingAsset}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 gap-1.5 min-w-[75px]"
            >
              {deletingAsset ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
