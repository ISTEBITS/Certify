'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { AssetItem, ASSET_CATEGORIES } from './types'
import { fileToBase64, inferAssetType } from '@/lib/utils'

export function useAssetManager(autoFetch = true) {
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const { toast } = useToast()

  const fetchAssets = useCallback(async () => {
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
        description: 'Failed to load assets from library',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (autoFetch) {
      fetchAssets()
    }
  }, [autoFetch, fetchAssets])

  const uploadFiles = useCallback(
    async (files: FileList | File[]): Promise<number> => {
      const fileList = Array.from(files).filter((file) => file.type.startsWith('image/'))
      if (fileList.length === 0) {
        toast({
          title: 'Invalid File',
          description: 'Please upload image files (PNG, JPG, SVG, WebP)',
          variant: 'destructive',
        })
        return 0
      }

      setUploading(true)
      let successCount = 0

      try {
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i]
          setUploadProgressText(`Uploading ${i + 1}/${fileList.length}: ${file.name}`)

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

          const type = inferAssetType(file.name)
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
          title: 'Upload Successful',
          description: `Added ${successCount} image${successCount > 1 ? 's' : ''} to library.`,
        })
      } catch (err: any) {
        toast({
          title: 'Upload Failed',
          description: err.message || 'Error uploading images',
          variant: 'destructive',
        })
      } finally {
        setUploading(false)
        setUploadProgressText('')
      }
      return successCount
    },
    [toast]
  )

  const deleteAsset = useCallback(
    async (publicId: string): Promise<boolean> => {
      try {
        const response = await fetch('/api/upload-image', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete asset')
        }

        setAssets((prev) => prev.filter((a) => a.publicId !== publicId))
        return true
      } catch (error: any) {
        toast({
          title: 'Delete Failed',
          description: error.message || 'Failed to delete asset',
          variant: 'destructive',
        })
        return false
      }
    },
    [toast]
  )

  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return assets.filter((asset) => {
      const matchesCategory = activeCategory === 'all' || asset.type === activeCategory
      const matchesSearch = q ? asset.name.toLowerCase().includes(q) : true
      return matchesCategory && matchesSearch
    })
  }, [assets, activeCategory, searchQuery])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: assets.length }
    ASSET_CATEGORIES.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = assets.filter((a) => a.type === cat.id).length
      }
    })
    return counts
  }, [assets])

  return {
    assets,
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
  }
}
