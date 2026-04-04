'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Stage,
  Layer,
  Text,
  Rect,
  Image as KonvaImage,
  Transformer,
  Group,
  Line,
} from 'react-konva'
import {
  PenTool,
  Type,
  QrCode,
  Image as ImageIcon,
  Save,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Magnet,
  Crop,
  Undo2,
  Redo2,
  Upload,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  Layers,
  BringToFront,
  SendToBack,
  Copy,
  FilePlus,
  Settings2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Event {
  _id: string
  name: string
  templateConfig?: TemplateConfig
}

interface TemplateElement {
  id: string
  type: 'text' | 'qrcode' | 'image'
  field?: 'name' | 'event' | 'date' | 'certificateId' | 'custom'
  content?: string
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  rotation?: number
  opacity?: number
  letterSpacing?: number
  lineHeight?: number
  textTransform?: 'none' | 'uppercase' | 'lowercase'
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  src?: string // for image elements (Cloudinary URL)
  imagePublicId?: string // Cloudinary public ID for deletion
}

interface TemplateConfig {
  width: number
  height: number
  backgroundImage?: string
  backgroundImagePublicId?: string
  elements: TemplateElement[]
}

interface DesignerSettings {
  zoom: number
  showGrid: boolean
  gridSize: number
  snapToGrid: boolean
  showRulers: boolean
  showSafeMargins: boolean
  safeMarginPadding: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_TEMPLATE: TemplateConfig = {
  width: 842,
  height: 595,
  elements: [],
}

const DEFAULT_SETTINGS: DesignerSettings = {
  zoom: 1,
  showGrid: true,
  gridSize: 20,
  snapToGrid: false,
  showRulers: true,
  showSafeMargins: true,
  safeMarginPadding: 40,
}

const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Helvetica',
  'Verdana',
  'Courier New',
  'Palatino',
  'Garamond',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
]

// ─── Helper Functions ────────────────────────────────────────────────────────

function snapToGrid(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled) return value
  return Math.round(value / gridSize) * gridSize
}

function getTransformedElementProps(el: TemplateElement): {
  x: number
  y: number
  width: number
  height: number
  rotation: number
} {
  return {
    x: el.x,
    y: el.y,
    width: el.width || 200,
    height: el.height || 50,
    rotation: el.rotation || 0,
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DesignerPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [template, setTemplate] = useState<TemplateConfig>(DEFAULT_TEMPLATE)
  const [settings, setSettings] = useState<DesignerSettings>(DEFAULT_SETTINGS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customFonts, setCustomFonts] = useState<string[]>([])

  // Undo/Redo history
  const [history, setHistory] = useState<TemplateConfig[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const stageRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bgFileInputRef = useRef<HTMLInputElement>(null)
  const transformerRef = useRef<any>(null)
  const trMultiRef = useRef<any>(null)

  // ─── Fetch Events ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      const event = events.find((e) => e._id === selectedEvent)
      if (event?.templateConfig) {
        setTemplate(event.templateConfig)
        setHistory([event.templateConfig])
        setHistoryIndex(0)
        if (event.templateConfig.backgroundImage) {
          loadBackgroundImage(event.templateConfig.backgroundImage)
        } else {
          setBackgroundImage(null)
        }
      } else {
        const newTemplate = { ...DEFAULT_TEMPLATE, elements: [] }
        setTemplate(newTemplate)
        setHistory([newTemplate])
        setHistoryIndex(0)
        setBackgroundImage(null)
      }
    }
  }, [selectedEvent, events])

  // ─── Keyboard Shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Delete selected element(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          deleteElements(selectedIds)
          e.preventDefault()
        } else if (selectedId) {
          deleteElement(selectedId)
          e.preventDefault()
        }
      }

      // Undo (Ctrl+Z)
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        undo()
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault()
        redo()
      }

      // Copy (Ctrl+C)
      if (e.ctrlKey && e.key === 'c' && selectedId) {
        e.preventDefault()
        copyElement(selectedId)
      }

      // Paste (Ctrl+V)
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault()
        pasteElement()
      }

      // Duplicate (Ctrl+D)
      if (e.ctrlKey && e.key === 'd' && selectedId) {
        e.preventDefault()
        duplicateElement(selectedId)
      }

      // Select All (Ctrl+A)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        setSelectedIds(template.elements.map((el) => el.id))
      }

      // Zoom shortcuts
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setSettings((s) => ({ ...s, zoom: Math.min(s.zoom + 0.1, 3) }))
      }
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault()
        setSettings((s) => ({ ...s, zoom: Math.max(s.zoom - 0.1, 0.1) }))
      }
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault()
        setSettings((s) => ({ ...s, zoom: 1 }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, selectedIds, template, historyIndex])

  // ─── History (Undo/Redo) ─────────────────────────────────────────────────

  const pushHistory = useCallback(
    (newTemplate: TemplateConfig) => {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newTemplate)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    },
    [history, historyIndex]
  )

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setTemplate(history[newIndex])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setTemplate(history[newIndex])
    }
  }

  // ─── Clipboard ────────────────────────────────────────────────────────────

  const clipboardRef = useRef<TemplateElement | null>(null)

  const copyElement = (id: string) => {
    const el = template.elements.find((e) => e.id === id)
    if (el) clipboardRef.current = { ...el }
  }

  const pasteElement = () => {
    if (!clipboardRef.current) return
    const newEl: TemplateElement = {
      ...clipboardRef.current,
      id: `element-${Date.now()}`,
      x: clipboardRef.current.x + 20,
      y: clipboardRef.current.y + 20,
    }
    const newTemplate = {
      ...template,
      elements: [...template.elements, newEl],
    }
    setTemplate(newTemplate)
    pushHistory(newTemplate)
    setSelectedId(newEl.id)
  }

  const duplicateElement = (id: string) => {
    const el = template.elements.find((e) => e.id === id)
    if (!el) return
    const newEl: TemplateElement = {
      ...el,
      id: `element-${Date.now()}`,
      x: el.x + 20,
      y: el.y + 20,
    }
    const newTemplate = {
      ...template,
      elements: [...template.elements, newEl],
    }
    setTemplate(newTemplate)
    pushHistory(newTemplate)
    setSelectedId(newEl.id)
  }

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      if (Array.isArray(data)) setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBackgroundImage = (src: string) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = src
    img.onload = () => setBackgroundImage(img)
  }

  // ─── Template Operations ─────────────────────────────────────────────────

  const saveTemplate = async () => {
    if (!selectedEvent) {
      setError('Please select an event first')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/events/${selectedEvent}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateConfig: template }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess('Template saved successfully!')
        fetchEvents()
      } else {
        setError(data.error || 'Failed to save template')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  // ─── Element CRUD ────────────────────────────────────────────────────────

  const addElement = (type: TemplateElement['type'], field?: TemplateElement['field']) => {
    const centerX = template.width / 2
    const centerY = template.height / 2

    const defaults: Record<string, Partial<TemplateElement>> = {
      name: { content: 'John Doe', fontSize: 36, fontWeight: 'bold', width: 400, height: 50 },
      event: { content: 'Event Name', fontSize: 24, width: 300, height: 40 },
      date: { content: 'January 1, 2025', fontSize: 18, width: 200, height: 30 },
      certificateId: { content: 'CERT-2025-000001', fontSize: 14, width: 200, height: 25 },
      custom: { content: 'Custom Text', fontSize: 20, width: 250, height: 35 },
      qrcode: { width: 100, height: 100 },
    }

    const d = defaults[field || 'custom'] || defaults.custom

    const newElement: TemplateElement = {
      id: `element-${Date.now()}`,
      type,
      field,
      x: snapToGrid(centerX - (d.width || 200) / 2, settings.gridSize, settings.snapToGrid),
      y: snapToGrid(centerY - (d.height || 40) / 2, settings.gridSize, settings.snapToGrid),
      width: d.width || 200,
      height: d.height || 40,
      fontSize: d.fontSize || 24,
      fontFamily: 'Arial',
      fontWeight: d.fontWeight || 'normal',
      color: '#000000',
      textAlign: 'center',
      rotation: 0,
      opacity: 1,
      letterSpacing: 0,
      lineHeight: 1.2,
      textTransform: 'none',
      isBold: d.fontWeight === 'bold',
      isItalic: false,
      isUnderline: false,
    }

    const newTemplate = {
      ...template,
      elements: [...template.elements, newElement],
    }
    setTemplate(newTemplate)
    pushHistory(newTemplate)
    setSelectedId(newElement.id)
  }

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    const newTemplate = {
      ...template,
      elements: template.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }
    setTemplate(newTemplate)
  }

  const commitUpdate = (id: string | null, updates: Partial<TemplateElement> & Partial<{ backgroundImage: string; backgroundImagePublicId: string }>) => {
    let newTemplate: TemplateConfig

    if (id === null) {
      // Top-level template update (background image, etc.)
      newTemplate = {
        ...template,
        ...updates,
        elements: template.elements, // preserve elements
      } as TemplateConfig
    } else {
      // Element update
      newTemplate = {
        ...template,
        elements: template.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      }
    }
    setTemplate(newTemplate)
    pushHistory(newTemplate)
  }

  const deleteElement = async (id: string) => {
    const el = template.elements.find((e) => e.id === id)
    // Delete image from Cloudinary if it's an image element
    if (el?.type === 'image' && el.imagePublicId) {
      await deleteFromCloudinary(el.imagePublicId)
    }
    const newTemplate = {
      ...template,
      elements: template.elements.filter((e) => e.id !== id),
    }
    setTemplate(newTemplate)
    pushHistory(newTemplate)
    if (selectedId === id) setSelectedId(null)
  }

  const deleteElements = async (ids: string[]) => {
    // Delete images from Cloudinary
    for (const id of ids) {
      const el = template.elements.find((e) => e.id === id)
      if (el?.type === 'image' && el.imagePublicId) {
        await deleteFromCloudinary(el.imagePublicId)
      }
    }
    const newTemplate = {
      ...template,
      elements: template.elements.filter((el) => !ids.includes(el.id)),
    }
    setTemplate(newTemplate)
    pushHistory(newTemplate)
    setSelectedId(null)
    setSelectedIds([])
  }

  // ─── Element Alignment ───────────────────────────────────────────────────

  const alignElements = (alignment: string) => {
    const targets = selectedIds.length > 1
      ? template.elements.filter((el) => selectedIds.includes(el.id))
      : selectedId
        ? template.elements.filter((el) => el.id === selectedId)
        : []

    if (targets.length === 0) return

    let updates: { id: string; x?: number; y?: number }[] = []

    if (targets.length === 1) {
      const el = targets[0]
      switch (alignment) {
        case 'left':
          updates = [{ id: el.id, x: 0 }]
          break
        case 'center-h':
          updates = [{ id: el.id, x: (template.width - el.width) / 2 }]
          break
        case 'right':
          updates = [{ id: el.id, x: template.width - el.width }]
          break
        case 'top':
          updates = [{ id: el.id, y: 0 }]
          break
        case 'center-v':
          updates = [{ id: el.id, y: (template.height - el.height) / 2 }]
          break
        case 'bottom':
          updates = [{ id: el.id, y: template.height - el.height }]
          break
      }
    } else {
      // Multi-element alignment
      const minX = Math.min(...targets.map((e) => e.x))
      const maxX = Math.max(...targets.map((e) => e.x + e.width))
      const minY = Math.min(...targets.map((e) => e.y))
      const maxY = Math.max(...targets.map((e) => e.y + e.height))
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2

      switch (alignment) {
        case 'left':
          updates = targets.map((el) => ({ id: el.id, x: minX }))
          break
        case 'center-h':
          updates = targets.map((el) => ({
            id: el.id,
            x: centerX - el.width / 2,
          }))
          break
        case 'right':
          updates = targets.map((el) => ({ id: el.id, x: maxX - el.width }))
          break
        case 'top':
          updates = targets.map((el) => ({ id: el.id, y: minY }))
          break
        case 'center-v':
          updates = targets.map((el) => ({
            id: el.id,
            y: centerY - el.height / 2,
          }))
          break
        case 'bottom':
          updates = targets.map((el) => ({ id: el.id, y: maxY - el.height }))
          break
      }
    }

    const newTemplate = {
      ...template,
      elements: template.elements.map((el) => {
        const u = updates.find((u) => u.id === el.id)
        return u ? { ...el, ...u } : el
      }),
    }
    setTemplate(newTemplate)
    pushHistory(newTemplate)
  }

  const distributeElements = (axis: 'horizontal' | 'vertical') => {
    if (selectedIds.length < 3) return

    const targets = template.elements
      .filter((el) => selectedIds.includes(el.id))
      .sort((a, b) =>
        axis === 'horizontal' ? a.x - b.x : a.y - b.y
      )

    const first = targets[0]
    const last = targets[targets.length - 1]
    const totalSize = axis === 'horizontal'
      ? (last.x + last.width) - first.x
      : (last.y + last.height) - first.y

    const contentSize = targets.reduce((sum, el) => {
      return sum + (axis === 'horizontal' ? el.width : el.height)
    }, 0)

    const gap = (totalSize - contentSize) / (targets.length - 1)

    let pos = axis === 'horizontal' ? first.x : first.y

    const updates = targets.map((el, i) => {
      if (i === 0 || i === targets.length - 1) return null
      const newPos = pos + (axis === 'horizontal' ? targets[i - 1].width : targets[i - 1].height) + gap
      pos = newPos
      return {
        id: el.id,
        [axis === 'horizontal' ? 'x' : 'y']: newPos,
      }
    }).filter(Boolean)

    const newTemplate = {
      ...template,
      elements: template.elements.map((el) => {
        const u = updates.find((u: any) => u?.id === el.id)
        return u ? { ...el, ...u } : el
      }),
    }
    setTemplate(newTemplate)
    pushHistory(newTemplate)
  }

  // ─── Layer Ordering ──────────────────────────────────────────────────────

  const moveLayer = (id: string, direction: 'up' | 'down' | 'front' | 'back') => {
    const idx = template.elements.findIndex((el) => el.id === id)
    if (idx === -1) return
    const elements = [...template.elements]
    const [el] = elements.splice(idx, 1)

    if (direction === 'front') elements.push(el)
    else if (direction === 'back') elements.unshift(el)
    else if (direction === 'up' && idx < elements.length) elements.splice(idx + 1, 0, el)
    else if (direction === 'down' && idx > 0) elements.splice(idx - 1, 0, el)
    else elements.splice(idx, 0, el)

    const newTemplate = { ...template, elements }
    setTemplate(newTemplate)
    pushHistory(newTemplate)
  }

  // ─── Cloudinary Upload Helper ────────────────────────────────────────────
  // Returns { url, publicId } on success, null on failure
  const uploadToCloudinary = async (base64Data: string, folder: 'background' | 'asset'): Promise<{ url: string; publicId: string } | null> => {
    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, folder }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to upload image')
        return null
      }

      if (!result.configured) {
        setError(result.error || 'Cloudinary is not configured')
        return null
      }

      return { url: result.url, publicId: result.publicId }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
      return null
    }
  }

  // ─── Cloudinary Delete Helper ────────────────────────────────────────────
  const deleteFromCloudinary = async (publicId: string) => {
    try {
      await fetch('/api/upload-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      })
    } catch (err) {
      console.error('Failed to delete from Cloudinary:', err)
    }
  }

  // ─── Background Upload ──────────────────────────────────────────────────

  const [uploadingBg, setUploadingBg] = useState(false)

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBg(true)
    setError('')

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string

      const uploadResult = await uploadToCloudinary(base64, 'background')

      if (uploadResult) {
        loadBackgroundImage(uploadResult.url)
        commitUpdate(null, {
          backgroundImage: uploadResult.url,
          backgroundImagePublicId: uploadResult.publicId,
        } as any)
        setSuccess('Background image uploaded successfully!')
      }
      setUploadingBg(false)
    }
    reader.onerror = () => {
      setError('Failed to read image file')
      setUploadingBg(false)
    }
    reader.readAsDataURL(file)
  }

  // ─── Image Element Upload ────────────────────────────────────────────────

  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageElementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError('')

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string

      const uploadResult = await uploadToCloudinary(base64, 'asset')

      if (uploadResult) {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const aspectRatio = img.width / img.height
          const width = 150
          const height = width / aspectRatio

          const newElement: TemplateElement = {
            id: `element-${Date.now()}`,
            type: 'image',
            x: snapToGrid(template.width / 2 - width / 2, settings.gridSize, settings.snapToGrid),
            y: snapToGrid(template.height / 2 - height / 2, settings.gridSize, settings.snapToGrid),
            width,
            height,
            src: uploadResult.url,
            imagePublicId: uploadResult.publicId,
            rotation: 0,
            opacity: 1,
          }
          const newTemplate = {
            ...template,
            elements: [...template.elements, newElement],
          }
          setTemplate(newTemplate)
          pushHistory(newTemplate)
          setSelectedId(newElement.id)
          setSuccess('Image uploaded successfully!')
          setUploadingImage(false)
        }
        img.onerror = () => {
          setError('Failed to load image')
          setUploadingImage(false)
        }
        img.src = uploadResult.url
      } else {
        setUploadingImage(false)
      }
    }
    reader.onerror = () => {
      setError('Failed to read image file')
      setUploadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  // ─── Custom Font Upload ──────────────────────────────────────────────────

  const handleCustomFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const src = ev.target?.result as string
      const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '')
      try {
        const fontFace = new FontFace(fontName, `url(${src})`)
        const loaded = await fontFace.load()
        document.fonts.add(loaded)
        setCustomFonts((prev) => [...prev, fontName])
        setSuccess(`Font "${fontName}" loaded successfully!`)
      } catch (err) {
        setError('Failed to load font file')
      }
    }
    reader.readAsDataURL(file)
  }

  // ─── Preview Download ────────────────────────────────────────────────────

  const downloadPreview = () => {
    if (stageRef.current) {
      // Temporarily hide grid and safe margins for clean export
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `certificate-preview-${selectedEvent}.png`
      link.href = dataURL
      link.click()
    }
  }

  // ─── Drag & Snap ─────────────────────────────────────────────────────────

  const handleDragEnd = (e: any, id: string) => {
    const node = e.target
    const newX = snapToGrid(node.x(), settings.gridSize, settings.snapToGrid)
    const newY = snapToGrid(node.y(), settings.gridSize, settings.snapToGrid)
    updateElement(id, { x: newX, y: newY })
  }

  const commitDragEnd = (e: any, id: string) => {
    const node = e.target
    const newX = snapToGrid(node.x(), settings.gridSize, settings.snapToGrid)
    const newY = snapToGrid(node.y(), settings.gridSize, settings.snapToGrid)
    commitUpdate(id, { x: newX, y: newY })
  }

  const handleTransformEnd = (e: any, id: string) => {
    const node = e.target
    commitUpdate(id, {
      x: snapToGrid(node.x(), settings.gridSize, settings.snapToGrid),
      y: snapToGrid(node.y(), settings.gridSize, settings.snapToGrid),
      rotation: node.rotation(),
      width: Math.max(10, snapToGrid(node.width() * node.scaleX(), settings.gridSize, settings.snapToGrid)),
      height: Math.max(10, snapToGrid(node.height() * node.scaleY(), settings.gridSize, settings.snapToGrid)),
    })
    node.scaleX(1)
    node.scaleY(1)
  }

  // ─── Selected Element ────────────────────────────────────────────────────

  const selectedElement = template.elements.find((el) => el.id === selectedId)

  // ─── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">Certificate Designer</h1>
          <Separator orientation="vertical" className="h-6" />
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-56 h-8 text-sm">
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event._id} value={event._id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zoom Controls */}
        {selectedEvent && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSettings((s) => ({ ...s, zoom: Math.max(s.zoom - 0.1, 0.1) }))}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono w-12 text-center">
              {Math.round(settings.zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSettings((s) => ({ ...s, zoom: Math.min(s.zoom + 0.1, 3) }))}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSettings((s) => ({ ...s, zoom: 1 }))}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Undo/Redo */}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={historyIndex <= 0}>
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Grid */}
            <Button
              variant={settings.showGrid ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setSettings((s) => ({ ...s, showGrid: !s.showGrid }))}
              title="Toggle Grid"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>

            {/* Snap */}
            <Button
              variant={settings.snapToGrid ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setSettings((s) => ({ ...s, snapToGrid: !s.snapToGrid }))}
              title="Snap to Grid"
            >
              <Magnet className="h-3.5 w-3.5" />
            </Button>

            {/* Rulers */}
            <Button
              variant={settings.showRulers ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setSettings((s) => ({ ...s, showRulers: !s.showRulers }))}
              title="Toggle Rulers"
            >
              <Crop className="h-3.5 w-3.5" />
            </Button>

            {/* Safe Margins */}
            <Button
              variant={settings.showSafeMargins ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setSettings((s) => ({ ...s, showSafeMargins: !s.showSafeMargins }))}
              title="Toggle Safe Margins"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadPreview} disabled={!selectedEvent}>
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview
          </Button>
          <Button size="sm" onClick={saveTemplate} disabled={saving || !selectedEvent}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mx-4 mt-2 flex-shrink-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mx-4 mt-2 flex-shrink-0 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {!selectedEvent ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <PenTool className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select an event to start designing</p>
            </div>
          </div>
        ) : (
          <>
            {/* Left Sidebar - Tools & Elements */}
            <div className="w-56 border-r bg-white flex-shrink-0 overflow-y-auto">
              <div className="p-3 space-y-3">
                {/* Add Elements */}
                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-xs">Elements</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-1.5">
                    <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => addElement('text', 'name')}>
                      <Type className="h-3 w-3 mr-1.5" /> Participant Name
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => addElement('text', 'event')}>
                      <Type className="h-3 w-3 mr-1.5" /> Event Name
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => addElement('text', 'date')}>
                      <Type className="h-3 w-3 mr-1.5" /> Event Date
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => addElement('text', 'certificateId')}>
                      <Type className="h-3 w-3 mr-1.5" /> Certificate ID
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => addElement('text', 'custom')}>
                      <Type className="h-3 w-3 mr-1.5" /> Custom Text
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => addElement('qrcode')}>
                      <QrCode className="h-3 w-3 mr-1.5" /> QR Code
                    </Button>
                  </CardContent>
                </Card>

                {/* Upload */}
                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-xs">Upload</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-1.5">
                    <input type="file" accept="image/*" ref={bgFileInputRef} onChange={handleBackgroundUpload} className="hidden" disabled={uploadingBg} />
                    <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => bgFileInputRef.current?.click()} disabled={uploadingBg}>
                      <ImageIcon className="h-3 w-3 mr-1.5" /> {uploadingBg ? 'Uploading...' : 'Background Image'}
                    </Button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageElementUpload} className="hidden" disabled={uploadingImage} />
                    <Button variant="outline" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                      <FilePlus className="h-3 w-3 mr-1.5" /> {uploadingImage ? 'Uploading...' : 'Logo / Signature'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Background */}
                {template.backgroundImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-red-600"
                    onClick={async () => {
                      // Delete from Cloudinary if we have the publicId
                      const publicId = (template as any).backgroundImagePublicId
                      if (publicId) {
                        await deleteFromCloudinary(publicId)
                      }
                      const newTemplate = {
                        ...template,
                        backgroundImage: undefined,
                        backgroundImagePublicId: undefined,
                      }
                      setTemplate(newTemplate)
                      pushHistory(newTemplate)
                      setBackgroundImage(null)
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1.5" /> Remove Background
                  </Button>
                )}

                {/* Elements List */}
                {template.elements.length > 0 && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Layers ({template.elements.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-1 max-h-48 overflow-y-auto">
                      {template.elements.map((el, i) => (
                        <div
                          key={el.id}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-100 ${
                            selectedId === el.id ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                          }`}
                          onClick={() => {
                            setSelectedId(el.id)
                            setSelectedIds([el.id])
                          }}
                        >
                          {el.type === 'text' ? (
                            <Type className="h-3 w-3 flex-shrink-0" />
                          ) : el.type === 'qrcode' ? (
                            <QrCode className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <ImageIcon className="h-3 w-3 flex-shrink-0" />
                          )}
                          <span className="truncate flex-1">
                            {el.type === 'text'
                              ? el.field === 'custom'
                                ? el.content?.substring(0, 15)
                                : el.field
                              : el.type === 'qrcode'
                                ? 'QR Code'
                                : 'Image'}
                          </span>
                          <div className="flex flex-shrink-0">
                            <button
                              className="p-0.5 hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveLayer(el.id, 'up')
                              }}
                              title="Move Up"
                            >
                              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                            </button>
                            <button
                              className="p-0.5 hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveLayer(el.id, 'down')
                              }}
                              title="Move Down"
                            >
                              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center relative">
              <div className="relative" style={{ transform: `scale(${settings.zoom})`, transformOrigin: 'center center' }}>
                {/* Ruler Top */}
                {settings.showRulers && (
                  <div
                    className="absolute bg-gray-200 border-b border-gray-300 flex items-end overflow-hidden"
                    style={{
                      top: -24,
                      left: 24,
                      width: template.width,
                      height: 24,
                    }}
                  >
                    {Array.from({ length: Math.ceil(template.width / 50) + 1 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute bottom-0 border-l border-gray-400"
                        style={{
                          left: i * 50,
                          height: i % 2 === 0 ? 12 : 6,
                        }}
                      >
                        {i % 2 === 0 && (
                          <span className="absolute bottom-0.5 left-0.5 text-[8px] text-gray-500 select-none">
                            {i * 50}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Ruler Left */}
                {settings.showRulers && (
                  <div
                    className="absolute bg-gray-200 border-r border-gray-300 flex flex-col items-right overflow-hidden"
                    style={{
                      top: 24,
                      left: -24,
                      width: 24,
                      height: template.height,
                    }}
                  >
                    {Array.from({ length: Math.ceil(template.height / 50) + 1 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute right-0 border-t border-gray-400"
                        style={{
                          top: i * 50,
                          width: i % 2 === 0 ? 12 : 6,
                        }}
                      >
                        {i % 2 === 0 && (
                          <span className="absolute top-0.5 right-0.5 text-[8px] text-gray-500 select-none">
                            {i * 50}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Corner */}
                {settings.showRulers && (
                  <div
                    className="absolute bg-gray-200 border-r border-b border-gray-300 z-10"
                    style={{ top: -24, left: -24, width: 24, height: 24 }}
                  />
                )}

                {/* Stage */}
                <div className="bg-white shadow-2xl">
                  <Stage
                    width={template.width}
                    height={template.height}
                    ref={stageRef}
                    onMouseDown={(e) => {
                      if (e.target === e.target.getStage()) {
                        setSelectedId(null)
                        setSelectedIds([])
                      }
                    }}
                  >
                    <Layer>
                      {/* Background */}
                      {backgroundImage && (
                        <KonvaImage
                          image={backgroundImage}
                          width={template.width}
                          height={template.height}
                        />
                      )}

                      {/* Grid */}
                      {settings.showGrid && (
                        <>
                          {/* Vertical lines */}
                          {Array.from({ length: Math.ceil(template.width / settings.gridSize) + 1 }).map((_, i) => (
                            <Line
                              key={`v-${i}`}
                              points={[i * settings.gridSize, 0, i * settings.gridSize, template.height]}
                              stroke="#e5e7eb"
                              strokeWidth={0.5}
                            />
                          ))}
                          {/* Horizontal lines */}
                          {Array.from({ length: Math.ceil(template.height / settings.gridSize) + 1 }).map((_, i) => (
                            <Line
                              key={`h-${i}`}
                              points={[0, i * settings.gridSize, template.width, i * settings.gridSize]}
                              stroke="#e5e7eb"
                              strokeWidth={0.5}
                            />
                          ))}
                        </>
                      )}

                      {/* Safe Margins */}
                      {settings.showSafeMargins && (
                        <Rect
                          x={settings.safeMarginPadding}
                          y={settings.safeMarginPadding}
                          width={template.width - settings.safeMarginPadding * 2}
                          height={template.height - settings.safeMarginPadding * 2}
                          stroke="#ef4444"
                          strokeWidth={1}
                          dash={[5, 5]}
                          opacity={0.6}
                        />
                      )}

                      {/* Elements */}
                      {template.elements.map((element) => (
                        <ElementComponent
                          key={element.id}
                          element={element}
                          isSelected={selectedIds.includes(element.id) || selectedId === element.id}
                          onSelect={(e: any) => {
                            if (e.evt?.ctrlKey || e.evt?.metaKey) {
                              setSelectedIds((prev) =>
                                prev.includes(element.id)
                                  ? prev.filter((id) => id !== element.id)
                                  : [...prev, element.id]
                              )
                            } else {
                              setSelectedId(element.id)
                              setSelectedIds([element.id])
                            }
                          }}
                          onDragEnd={handleDragEnd}
                          onTransformEnd={handleTransformEnd}
                          gridSize={settings.gridSize}
                          snapToGrid={settings.snapToGrid}
                        />
                      ))}

                      {/* Transformer */}
                      {selectedId && (
                        <Transformer
                          ref={transformerRef}
                          boundBoxFunc={(oldBox, newBox) => {
                            if (newBox.width < 5 || newBox.height < 5) return oldBox
                            return newBox
                          }}
                          anchorSize={8}
                          anchorCornerRadius={4}
                          borderStroke="#3b82f6"
                          anchorStroke="#3b82f6"
                          anchorFill="#ffffff"
                          rotateEnabled
                          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']}
                        />
                      )}
                    </Layer>
                  </Stage>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Properties */}
            <div className="w-72 border-l bg-white flex-shrink-0 overflow-y-auto">
              {selectedElement ? (
                <div className="p-3 space-y-3">
                  {/* Element Type Header */}
                  <div className="flex items-center gap-2 px-1">
                    {selectedElement.type === 'text' ? (
                      <Type className="h-4 w-4 text-primary" />
                    ) : selectedElement.type === 'qrcode' ? (
                      <QrCode className="h-4 w-4 text-primary" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-sm font-medium capitalize">{selectedElement.type} Properties</span>
                  </div>

                  <Separator />

                  {/* Position & Size */}
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs">Position & Size</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-gray-500">X</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.x)}
                            onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                            onBlur={(e) => commitUpdate(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Y</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.y)}
                            onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                            onBlur={(e) => commitUpdate(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Width</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.width)}
                            onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 10 })}
                            onBlur={(e) => commitUpdate(selectedElement.id, { width: parseInt(e.target.value) || 10 })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Height</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElement.height)}
                            onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 10 })}
                            onBlur={(e) => commitUpdate(selectedElement.id, { height: parseInt(e.target.value) || 10 })}
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500">Rotation: {Math.round(selectedElement.rotation || 0)}°</Label>
                        <Slider
                          value={[selectedElement.rotation || 0]}
                          onValueChange={(v) => updateElement(selectedElement.id, { rotation: v[0] })}
                          onValueCommit={(v) => commitUpdate(selectedElement.id, { rotation: v[0] })}
                          min={0}
                          max={360}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500">Opacity: {Math.round((selectedElement.opacity ?? 1) * 100)}%</Label>
                        <Slider
                          value={[(selectedElement.opacity ?? 1) * 100]}
                          onValueChange={(v) => updateElement(selectedElement.id, { opacity: v[0] / 100 })}
                          onValueCommit={(v) => commitUpdate(selectedElement.id, { opacity: v[0] / 100 })}
                          min={0}
                          max={100}
                          step={5}
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Text Properties */}
                  {selectedElement.type === 'text' && (
                    <Tabs defaultValue="font" className="w-full">
                      <TabsList className="w-full h-7 text-xs">
                        <TabsTrigger value="font" className="text-xs flex-1">Font</TabsTrigger>
                        <TabsTrigger value="style" className="text-xs flex-1">Style</TabsTrigger>
                        <TabsTrigger value="spacing" className="text-xs flex-1">Spacing</TabsTrigger>
                      </TabsList>

                      <TabsContent value="font" className="space-y-2 mt-2">
                        <div>
                          <Label className="text-[10px] text-gray-500">Content</Label>
                          <Input
                            value={selectedElement.content || ''}
                            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                            onBlur={(e) => commitUpdate(selectedElement.id, { content: e.target.value })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Font Family</Label>
                          <Select
                            value={selectedElement.fontFamily || 'Arial'}
                            onValueChange={(v) => commitUpdate(selectedElement.id, { fontFamily: v })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FONT_FAMILIES.map((f) => (
                                <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                                  {f}
                                </SelectItem>
                              ))}
                              {customFonts.map((f) => (
                                <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                                  {f} (Custom)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Custom Font Upload */}
                        <div>
                          <Label className="text-[10px] text-gray-500">Custom Font</Label>
                          <input type="file" accept=".ttf,.otf,.woff,.woff2" id="custom-font" className="hidden" onChange={handleCustomFontUpload} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs mt-1"
                            onClick={() => document.getElementById('custom-font')?.click()}
                          >
                            <Upload className="h-3 w-3 mr-1" /> Upload Font (.ttf/.otf)
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-gray-500">Size</Label>
                            <Input
                              type="number"
                              value={selectedElement.fontSize || 24}
                              onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })}
                              onBlur={(e) => commitUpdate(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-gray-500">Color</Label>
                            <div className="flex gap-1">
                              <Input
                                type="color"
                                value={selectedElement.color || '#000000'}
                                onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                onBlur={(e) => commitUpdate(selectedElement.id, { color: e.target.value })}
                                className="h-7 w-8 p-0.5"
                              />
                              <Input
                                value={selectedElement.color || '#000000'}
                                onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                onBlur={(e) => commitUpdate(selectedElement.id, { color: e.target.value })}
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="style" className="space-y-2 mt-2">
                        {/* Bold / Italic / Underline */}
                        <div className="flex gap-1">
                          <Button
                            variant={selectedElement.isBold ? 'secondary' : 'outline'}
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => commitUpdate(selectedElement.id, { isBold: !selectedElement.isBold, fontWeight: selectedElement.isBold ? 'normal' : 'bold' })}
                          >
                            <Bold className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant={selectedElement.isItalic ? 'secondary' : 'outline'}
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => commitUpdate(selectedElement.id, { isItalic: !selectedElement.isItalic, fontStyle: selectedElement.isItalic ? 'normal' : 'italic' })}
                          >
                            <Italic className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant={selectedElement.isUnderline ? 'secondary' : 'outline'}
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => commitUpdate(selectedElement.id, { isUnderline: !selectedElement.isUnderline })}
                          >
                            <Underline className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Text Transform */}
                        <div>
                          <Label className="text-[10px] text-gray-500">Transform</Label>
                          <Select
                            value={selectedElement.textTransform || 'none'}
                            onValueChange={(v) => commitUpdate(selectedElement.id, { textTransform: v as any })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Normal</SelectItem>
                              <SelectItem value="uppercase">UPPERCASE</SelectItem>
                              <SelectItem value="lowercase">lowercase</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <Label className="text-[10px] text-gray-500">Alignment</Label>
                          <div className="flex gap-1 mt-1">
                            <Button
                              variant={selectedElement.textAlign === 'left' ? 'secondary' : 'outline'}
                              size="sm"
                              className="h-7 flex-1 p-0"
                              onClick={() => commitUpdate(selectedElement.id, { textAlign: 'left' })}
                            >
                              <AlignLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant={selectedElement.textAlign === 'center' ? 'secondary' : 'outline'}
                              size="sm"
                              className="h-7 flex-1 p-0"
                              onClick={() => commitUpdate(selectedElement.id, { textAlign: 'center' })}
                            >
                              <AlignCenter className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant={selectedElement.textAlign === 'right' ? 'secondary' : 'outline'}
                              size="sm"
                              className="h-7 flex-1 p-0"
                              onClick={() => commitUpdate(selectedElement.id, { textAlign: 'right' })}
                            >
                              <AlignRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="spacing" className="space-y-2 mt-2">
                        <div>
                          <Label className="text-[10px] text-gray-500">Letter Spacing: {selectedElement.letterSpacing || 0}px</Label>
                          <Slider
                            value={[selectedElement.letterSpacing || 0]}
                            onValueChange={(v) => updateElement(selectedElement.id, { letterSpacing: v[0] })}
                            onValueCommit={(v) => commitUpdate(selectedElement.id, { letterSpacing: v[0] })}
                            min={-5}
                            max={20}
                            step={0.5}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Line Height: {selectedElement.lineHeight || 1.2}</Label>
                          <Slider
                            value={[selectedElement.lineHeight || 1.2]}
                            onValueChange={(v) => updateElement(selectedElement.id, { lineHeight: v[0] })}
                            onValueCommit={(v) => commitUpdate(selectedElement.id, { lineHeight: v[0] })}
                            min={0.5}
                            max={3}
                            step={0.1}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}

                  {/* QR Code Size */}
                  {selectedElement.type === 'qrcode' && (
                    <Card>
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-xs">QR Code</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-gray-500">Size</Label>
                            <Input
                              type="number"
                              value={Math.round(selectedElement.width)}
                              onChange={(e) => commitUpdate(selectedElement.id, { width: parseInt(e.target.value) || 50, height: parseInt(e.target.value) || 50 })}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Image Element Properties */}
                  {selectedElement.type === 'image' && (
                    <Card>
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-xs">Image</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-2">
                        <div>
                          <Label className="text-[10px] text-gray-500">Opacity: {Math.round((selectedElement.opacity ?? 1) * 100)}%</Label>
                          <Slider
                            value={[(selectedElement.opacity ?? 1) * 100]}
                            onValueChange={(v) => updateElement(selectedElement.id, { opacity: v[0] / 100 })}
                            onValueCommit={(v) => commitUpdate(selectedElement.id, { opacity: v[0] / 100 })}
                            min={0}
                            max={100}
                            step={5}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-xs"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-3 w-3 mr-1" /> Replace Image
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Alignment Tools */}
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs">Align</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      {/* Horizontal Align */}
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 flex-1 p-0" onClick={() => alignElements('left')} title="Align Left">
                          <AlignStartVertical className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 flex-1 p-0" onClick={() => alignElements('center-h')} title="Center Horizontal">
                          <AlignCenterVertical className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 flex-1 p-0" onClick={() => alignElements('right')} title="Align Right">
                          <AlignEndVertical className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {/* Vertical Align */}
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 flex-1 p-0" onClick={() => alignElements('top')} title="Align Top">
                          <AlignStartHorizontal className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 flex-1 p-0" onClick={() => alignElements('center-v')} title="Center Vertical">
                          <AlignCenterHorizontal className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 flex-1 p-0" onClick={() => alignElements('bottom')} title="Align Bottom">
                          <AlignEndHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Distribute */}
                      {selectedIds.length >= 3 && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-[10px] text-gray-500">Distribute ({selectedIds.length} selected)</Label>
                            <div className="flex gap-1 mt-1">
                              <Button variant="outline" size="sm" className="h-7 flex-1 p-0 text-[10px]" onClick={() => distributeElements('horizontal')}>
                                Horizontal
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 flex-1 p-0 text-[10px]" onClick={() => distributeElements('vertical')}>
                                Vertical
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Layer Ordering */}
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs">Layer Order</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="grid grid-cols-4 gap-1">
                        <Button variant="outline" size="sm" className="h-7 p-0" onClick={() => moveLayer(selectedElement.id, 'front')} title="Bring to Front">
                          <BringToFront className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 p-0" onClick={() => moveLayer(selectedElement.id, 'back')} title="Send to Back">
                          <SendToBack className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 p-0" onClick={() => moveLayer(selectedElement.id, 'up')} title="Move Up">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 p-0" onClick={() => moveLayer(selectedElement.id, 'down')} title="Move Down">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => duplicateElement(selectedElement.id)}>
                      <Copy className="h-3 w-3 mr-1" /> Duplicate
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1 h-7 text-xs" onClick={() => deleteElement(selectedElement.id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-gray-400 text-sm">
                  <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select an element to edit properties</p>
                  <p className="text-xs mt-1 text-gray-300">
                    Ctrl+A to select all
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Element Component ───────────────────────────────────────────────────────

function ElementComponent({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  gridSize,
  snapToGrid,
}: {
  element: TemplateElement
  isSelected: boolean
  onSelect: (e: any) => void
  onDragEnd: (e: any, id: string) => void
  onTransformEnd: (e: any, id: string) => void
  gridSize: number
  snapToGrid: boolean
}) {
  const shapeRef = useRef<any>(null)
  const trRef = useRef<any>(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  const getFontStyle = () => {
    let style = ''
    if (element.isBold) style += 'bold '
    if (element.isItalic) style += 'italic '
    return style || (element.fontWeight === 'bold' ? 'bold ' : '')
  }

  const getProcessedText = () => {
    let text = element.content || ''
    if (element.textTransform === 'uppercase') text = text.toUpperCase()
    else if (element.textTransform === 'lowercase') text = text.toLowerCase()
    return text
  }

  if (element.type === 'text') {
    return (
      <>
        <Text
          ref={shapeRef}
          text={getProcessedText()}
          x={element.x}
          y={element.y}
          fontSize={element.fontSize || 24}
          fontFamily={element.fontFamily || 'Arial'}
          fontStyle={getFontStyle().trim() || 'normal'}
          fill={element.color || '#000000'}
          align={element.textAlign || 'center'}
          width={element.width}
          height={element.height || undefined}
          opacity={element.opacity ?? 1}
          letterSpacing={element.letterSpacing || 0}
          lineHeight={element.lineHeight || 1.2}
          textDecoration={element.isUnderline ? 'underline' : ''}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e) => onDragEnd(e, element.id)}
          onTransformEnd={(e) => onTransformEnd(e, element.id)}
        />
        {isSelected && (
          <Transformer
            ref={trRef}
            anchorSize={8}
            anchorCornerRadius={4}
            borderStroke="#3b82f6"
            anchorStroke="#3b82f6"
            anchorFill="#ffffff"
          />
        )}
      </>
    )
  }

  if (element.type === 'qrcode') {
    return (
      <>
        <Group
          ref={shapeRef}
          x={element.x}
          y={element.y}
          rotation={element.rotation || 0}
          opacity={element.opacity ?? 1}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e) => onDragEnd(e, element.id)}
          onTransformEnd={(e) => onTransformEnd(e, element.id)}
        >
          <Rect
            width={element.width || 100}
            height={element.height || 100}
            fill="#f3f4f6"
            stroke="#9ca3af"
            strokeWidth={1.5}
            dash={[4, 4]}
            cornerRadius={4}
          />
          {/* QR Pattern Placeholder */}
          <Rect
            x={8}
            y={8}
            width={16}
            height={16}
            fill="#374151"
            cornerRadius={2}
          />
          <Rect
            x={element.width - 24}
            y={8}
            width={16}
            height={16}
            fill="#374151"
            cornerRadius={2}
          />
          <Rect
            x={8}
            y={(element.height || 100) - 24}
            width={16}
            height={16}
            fill="#374151"
            cornerRadius={2}
          />
          {/* Grid pattern */}
          {Array.from({ length: 4 }).map((_, i) =>
            Array.from({ length: 4 }).map((_, j) => (
              <Rect
                key={`${i}-${j}`}
                x={30 + i * 12}
                y={30 + j * 12}
                width={6}
                height={6}
                fill={(i + j) % 2 === 0 ? '#374151' : '#e5e7eb'}
                cornerRadius={1}
              />
            ))
          )}
          <Text
            x={0}
            y={element.height + 5}
            text="QR Code"
            fontSize={9}
            fill="#9ca3af"
            align="center"
            width={element.width}
          />
        </Group>
        {isSelected && (
          <Transformer
            ref={trRef}
            anchorSize={8}
            anchorCornerRadius={4}
            borderStroke="#3b82f6"
            anchorStroke="#3b82f6"
            anchorFill="#ffffff"
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          />
        )}
      </>
    )
  }

  // Image element
  if (element.type === 'image' && element.src) {
    const imgRef = useRef<HTMLImageElement | null>(null)

    useEffect(() => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        imgRef.current = img
        if (shapeRef.current?.getLayer) {
          shapeRef.current.getLayer().batchDraw()
        }
      }
      img.src = element.src!
    }, [element.src])

    return (
      <>
        {imgRef.current && (
          <KonvaImage
            ref={shapeRef}
            image={imgRef.current}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            rotation={element.rotation || 0}
            opacity={element.opacity ?? 1}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => onDragEnd(e, element.id)}
            onTransformEnd={(e) => onTransformEnd(e, element.id)}
          />
        )}
        {!imgRef.current && (
          <Rect
            ref={shapeRef}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill="#f3f4f6"
            stroke="#9ca3af"
            strokeWidth={1.5}
            dash={[4, 4]}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => onDragEnd(e, element.id)}
            onTransformEnd={(e) => onTransformEnd(e, element.id)}
          />
        )}
        {isSelected && (
          <Transformer
            ref={trRef}
            anchorSize={8}
            anchorCornerRadius={4}
            borderStroke="#3b82f6"
            anchorStroke="#3b82f6"
            anchorFill="#ffffff"
            rotateEnabled
          />
        )}
      </>
    )
  }

  return null
}
