'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Search,
  Loader2,
  Plus,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Asset {
  _id: string
  url: string
  publicId: string
  name: string
  type: 'background' | 'logo' | 'signature' | 'other'
  width?: number
  height?: number
  uploadedAt: string
}

interface AssetLibraryProps {
  onAssetSelect: (asset: Asset) => void
  open?: boolean
  onOpenChange: (open: boolean) => void
}

const ASSET_TYPES: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Assets' },
  { id: 'background', label: 'Backgrounds' },
  { id: 'logo', label: 'Logos' },
  { id: 'signature', label: 'Signatures' },
  { id: 'other', label: 'Other' },
]

// ─── Asset Library Component ─────────────────────────────────────────────────

export function AssetLibrary({ onAssetSelect, open = false, onOpenChange }: AssetLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogAsset, setDeleteDialogAsset] = useState<Asset | null>(null)
  const [deletingAsset, setDeletingAsset] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchAssets()
    }
  }, [open])

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/assets')
      const data = await response.json()
      if (Array.isArray(data)) {
        setAssets(data)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch assets from library',
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
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        setUploadProgressText(`Uploading ${i + 1} of ${fileList.length}: ${file.name}...`)

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
        let type: Asset['type'] = 'other'
        if (lowerName.includes('logo')) type = 'logo'
        else if (lowerName.includes('signature') || lowerName.includes('sign')) type = 'signature'
        else if (lowerName.includes('background') || lowerName.includes('bg')) type = 'background'

        const newAsset: Asset = {
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
    } catch (error: any) {
      toast({
        title: 'Upload Error',
        description: error.message || 'Failed to upload asset',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgressText('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteAsset = async () => {
    if (!deleteDialogAsset) return
    setDeletingAsset(true)

    try {
      const response = await fetch('/api/upload-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: deleteDialogAsset.publicId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete asset')
      }

      setAssets((prev) => prev.filter((a) => a.publicId !== deleteDialogAsset.publicId))
      toast({
        title: 'Asset Deleted',
        description: `${deleteDialogAsset.name} has been removed.`,
      })
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete asset',
        variant: 'destructive',
      })
    } finally {
      setDeletingAsset(false)
      setDeleteDialogAsset(null)
    }
  }

  const filteredAssets = assets.filter((asset) => {
    if (selectedType !== 'all' && asset.type !== selectedType) return false
    if (searchQuery) {
      return asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const typeCounts = {
    all: assets.length,
    background: assets.filter((a) => a.type === 'background').length,
    logo: assets.filter((a) => a.type === 'logo').length,
    signature: assets.filter((a) => a.type === 'signature').length,
    other: assets.filter((a) => a.type === 'other').length,
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-4xl max-h-[85vh] flex flex-col p-6 gap-4 bg-background text-foreground border-border"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Media Asset Library</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload and manage logos, signatures, and background designs.
            </DialogDescription>
          </DialogHeader>

          {/* Upload & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full sm:w-auto h-9 text-xs gap-2 shrink-0"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{uploadProgressText || 'Uploading...'}</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Assets</span>
                </>
              )}
            </Button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
            {ASSET_TYPES.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedType(item.id)}
                className={`px-3 py-1 rounded-md text-xs transition-colors shrink-0 ${
                  selectedType === item.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label} ({typeCounts[item.id as keyof typeof typeCounts] || 0})
              </button>
            ))}
          </div>

          {/* Assets Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-60 gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading asset library...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-2 opacity-40" />
              <h3 className="text-sm font-medium text-foreground mb-1">
                {searchQuery || selectedType !== 'all' ? 'No matching assets found' : 'No assets uploaded yet'}
              </h3>
              <p className="text-xs max-w-xs">
                {searchQuery || selectedType !== 'all'
                  ? 'Try clearing the search or category filter.'
                  : 'Upload certificate backgrounds, institution logos, or authorized signatures.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1">
              {filteredAssets.map((asset) => (
                <div
                  key={asset._id}
                  className="group relative aspect-square rounded-lg border border-border bg-muted/20 hover:border-primary/60 cursor-pointer transition-all overflow-hidden"
                  onClick={() => onAssetSelect(asset)}
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-contain p-2"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteDialogAsset(asset)
                        }}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm"
                        title="Delete asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="text-white text-[10px] truncate bg-black/60 px-1.5 py-0.5 rounded">
                      {asset.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deleteDialogAsset}
        onOpenChange={(open) => !open && setDeleteDialogAsset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete &quot;{deleteDialogAsset?.name}&quot;? This will permanently remove the asset from Cloudinary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAsset} className="text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAsset}
              disabled={deletingAsset}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 gap-1.5"
            >
              {deletingAsset && <Loader2 className="h-3 w-3 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
