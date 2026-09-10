'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Event,
  TemplateElement,
  TemplateConfig,
  DesignerSettings,
  DEFAULT_TEMPLATE,
  DEFAULT_SETTINGS,
} from '@/components/designer/types'
import { DesignerHeader } from '@/components/designer/DesignerHeader'
import { DesignerPropertyBar } from '@/components/designer/DesignerPropertyBar'
import { DesignerSidebar, SidebarTab } from '@/components/designer/DesignerSidebar'
import { DesignerMobileBar } from '@/components/designer/DesignerMobileBar'
import { AssetLibrary, Asset } from '@/components/AssetLibrary'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react'

// Dynamic Konva Canvas component (client-only)
const DesignerCanvas = dynamic(
  () => import('@/components/designer/DesignerCanvas').then((mod) => mod.DesignerCanvas),
  { ssr: false }
)

export default function CertificateDesignerPage() {
  const { toast } = useToast()

  // ─── State ───────────────────────────────────────────────────────────────────
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [templateType, setTemplateType] = useState<'participation' | 'achievement'>('participation')
  const [template, setTemplate] = useState<TemplateConfig>(DEFAULT_TEMPLATE)
  const [settings, setSettings] = useState<DesignerSettings>(DEFAULT_SETTINGS)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [uploadingBackground, setUploadingBackground] = useState(false)

  // Loading & Watchdog Banner State
  const [pageLoading, setPageLoading] = useState(true)
  const [slowLoading, setSlowLoading] = useState(false)

  // Slow loading watchdog timer (5 seconds)
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (pageLoading) {
      timer = setTimeout(() => {
        setSlowLoading(true)
      }, 5000)
    } else {
      setSlowLoading(false)
    }
    return () => clearTimeout(timer)
  }, [pageLoading])

  // Navigation & Drawers
  const [activeTab, setActiveTab] = useState<SidebarTab>('elements')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileEditModalOpen, setMobileEditModalOpen] = useState(false)

  // Dialogs
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [copySourceEventId, setCopySourceEventId] = useState('')
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false)

  // Undo / Redo History
  const [history, setHistory] = useState<TemplateConfig[]>([DEFAULT_TEMPLATE])
  const [historyIndex, setHistoryIndex] = useState(0)

  // DOM Refs
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Selected element shortcut
  const selectedElement = template.elements.find((el) => el.id === selectedId) || null

  // ─── Undo / Redo Helpers ────────────────────────────────────────────────────
  const pushHistory = useCallback(
    (newTemplate: TemplateConfig) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1)
        return [...sliced, newTemplate]
      })
      setHistoryIndex((prev) => prev + 1)
      setSaveStatus('unsaved')
    },
    [historyIndex]
  )

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      setHistoryIndex(prevIndex)
      setTemplate(history[prevIndex])
      setSaveStatus('unsaved')
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      setTemplate(history[nextIndex])
      setSaveStatus('unsaved')
    }
  }, [history, historyIndex])

  // ─── Fetch Events ────────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events')
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
        if (data.length > 0) {
          if (!selectedEvent) {
            setSelectedEvent(data[0]._id)
          }
        } else {
          setPageLoading(false)
        }
      } else {
        setPageLoading(false)
      }
    } catch (err) {
      console.error('Failed to fetch events:', err)
      setPageLoading(false)
    }
  }, [selectedEvent])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // ─── Load Template on Event / Type Change ───────────────────────────────────
  useEffect(() => {
    if (!selectedEvent) return
    const ev = events.find((e) => e._id === selectedEvent)
    if (!ev) return

    const tpl = templateType === 'achievement' ? ev.achievementTemplate : ev.participationTemplate
    if (tpl && ((Array.isArray(tpl.elements) && tpl.elements.length > 0) || tpl.backgroundImage)) {
      setTemplate(tpl)
      setHistory([tpl])
      setHistoryIndex(0)
    } else if (templateType === 'achievement' && ev.participationTemplate && ((Array.isArray(ev.participationTemplate.elements) && ev.participationTemplate.elements.length > 0) || ev.participationTemplate.backgroundImage)) {
      const inherited = JSON.parse(JSON.stringify(ev.participationTemplate))
      setTemplate(inherited)
      setHistory([inherited])
      setHistoryIndex(0)
    } else {
      const emptyTpl: TemplateConfig = {
        width: 842,
        height: 595,
        elements: [],
      }
      setTemplate(emptyTpl)
      setHistory([emptyTpl])
      setHistoryIndex(0)
    }
    setSelectedId(null)
    setSaveStatus('saved')
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [selectedEvent, templateType, events])

  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800
    const containerWidth = container.clientWidth > 0 ? container.clientWidth : screenWidth
    const containerHeight = container.clientHeight > 0 ? container.clientHeight : (typeof window !== 'undefined' ? window.innerHeight - 100 : 600)

    const paddingX = isMobile ? 16 : 32
    const paddingY = isMobile ? 16 : 32
    const availableWidth = Math.max(60, containerWidth - paddingX)
    const availableHeight = Math.max(60, containerHeight - paddingY)

    if (availableWidth <= 0 || availableHeight <= 0) return

    const scaleX = availableWidth / template.width
    const scaleY = availableHeight / template.height

    const optimalScale = isMobile
      ? Math.min(scaleX, 1.0)
      : Math.min(scaleX, scaleY, 1.0)

    const rounded = Math.max(0.1, Math.floor(optimalScale * 100) / 100)

    setSettings((prev) => ({ ...prev, zoom: rounded }))

    requestAnimationFrame(() => {
      if (containerRef.current) {
        const c = containerRef.current
        const contentW = template.width * rounded + paddingX
        const contentH = template.height * rounded + paddingY
        c.scrollLeft = Math.max(0, Math.round((contentW - c.clientWidth) / 2))
        c.scrollTop = Math.max(0, Math.round((contentH - c.clientHeight) / 2))
      }
    })
  }, [template.width, template.height])

  useEffect(() => {
    fitToScreen()
    const timer1 = setTimeout(fitToScreen, 50)
    const timer2 = setTimeout(fitToScreen, 200)

    const handleResize = () => {
      fitToScreen()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [fitToScreen])

  const commitUpdate = useCallback(
    (id: string, updates: Partial<TemplateElement>) => {
      setTemplate((prev) => {
        const newElements = prev.elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
        const newTemplate = { ...prev, elements: newElements }
        pushHistory(newTemplate)
        return newTemplate
      })
    },
    [pushHistory]
  )

  const updateTemplate = useCallback(
    (updates: Partial<TemplateConfig>) => {
      setTemplate((prev) => {
        const newTemplate = { ...prev, ...updates }
        pushHistory(newTemplate)
        return newTemplate
      })
    },
    [pushHistory]
  )

  const addText = useCallback(
    (field: TemplateElement['field'] = 'custom', defaultText = 'New Text', fontSize = 20) => {
      const id = `text-${Date.now()}`
      const newElem: TemplateElement = {
        id,
        type: 'text',
        field,
        content: defaultText,
        x: Math.round(template.width / 2 - 120),
        y: Math.round(template.height / 2 - 20),
        width: 240,
        height: 40,
        fontSize,
        fontFamily: 'Arial',
        color: '#000000',
        textAlign: 'center',
        opacity: 1,
      }
      setTemplate((prev) => {
        const newTemplate = { ...prev, elements: [...prev.elements, newElem] }
        pushHistory(newTemplate)
        return newTemplate
      })
      setSelectedId(id)
    },
    [template.width, template.height, pushHistory]
  )

  const addQRCode = useCallback(() => {
    const id = `qr-${Date.now()}`
    const newElem: TemplateElement = {
      id,
      type: 'qrcode',
      field: 'certificateId',
      x: template.width - 130,
      y: template.height - 130,
      width: 90,
      height: 90,
    }
    setTemplate((prev) => {
      const newTemplate = { ...prev, elements: [...prev.elements, newElem] }
      pushHistory(newTemplate)
      return newTemplate
    })
    setSelectedId(id)
  }, [template.width, template.height, pushHistory]
  )

  const addImage = useCallback(
    (src: string, publicId?: string) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.src = src

      const insertImageElement = (naturalW: number, naturalH: number) => {
        const maxDim = 180
        let renderW = naturalW || 120
        let renderH = naturalH || 120

        if (renderW > maxDim || renderH > maxDim) {
          const ratio = renderW / renderH
          if (ratio >= 1) {
            renderW = maxDim
            renderH = Math.round(maxDim / ratio)
          } else {
            renderH = maxDim
            renderW = Math.round(maxDim * ratio)
          }
        }

        const id = `img-${Date.now()}`
        const newElem: TemplateElement = {
          id,
          type: 'image',
          src,
          imagePublicId: publicId,
          x: Math.round(template.width / 2 - renderW / 2),
          y: Math.round(template.height / 2 - renderH / 2),
          width: renderW,
          height: renderH,
          opacity: 1,
        }
        setTemplate((prev) => {
          const newTemplate = { ...prev, elements: [...prev.elements, newElem] }
          pushHistory(newTemplate)
          return newTemplate
        })
        setSelectedId(id)
      }

      if (img.complete && img.naturalWidth > 0) {
        insertImageElement(img.naturalWidth, img.naturalHeight)
      } else {
        img.onload = () => {
          insertImageElement(img.naturalWidth, img.naturalHeight)
        }
        img.onerror = () => {
          insertImageElement(120, 120)
        }
      }
    },
    [template.width, template.height, pushHistory]
  )

  const duplicateElement = useCallback(
    (id: string) => {
      const elem = template.elements.find((el) => el.id === id)
      if (!elem) return
      const newId = `${elem.type}-${Date.now()}`
      const duplicated: TemplateElement = {
        ...elem,
        id: newId,
        x: elem.x + 15,
        y: elem.y + 15,
      }
      setTemplate((prev) => {
        const newTemplate = { ...prev, elements: [...prev.elements, duplicated] }
        pushHistory(newTemplate)
        return newTemplate
      })
      setSelectedId(newId)
    },
    [template.elements, pushHistory]
  )

  const deleteElement = useCallback(
    (id: string) => {
      setTemplate((prev) => {
        const newTemplate = {
          ...prev,
          elements: prev.elements.filter((el) => el.id !== id),
        }
        pushHistory(newTemplate)
        return newTemplate
      })
      if (selectedId === id) setSelectedId(null)
    },
    [selectedId, pushHistory]
  )

  const moveLayer = useCallback(
    (id: string, direction: 'front' | 'back' | 'up' | 'down') => {
      setTemplate((prev) => {
        const idx = prev.elements.findIndex((el) => el.id === id)
        if (idx === -1) return prev
        const elements = [...prev.elements]
        const [target] = elements.splice(idx, 1)

        if (direction === 'front') {
          elements.push(target)
        } else if (direction === 'back') {
          elements.unshift(target)
        } else if (direction === 'up') {
          elements.splice(Math.min(elements.length, idx + 1), 0, target)
        } else if (direction === 'down') {
          elements.splice(Math.max(0, idx - 1), 0, target)
        }

        const newTemplate = { ...prev, elements }
        pushHistory(newTemplate)
        return newTemplate
      })
    },
    [pushHistory]
  )

  const reorderElements = useCallback(
    (draggedId: string, targetId: string) => {
      setTemplate((prev) => {
        const fromIdx = prev.elements.findIndex((e) => e.id === draggedId)
        const toIdx = prev.elements.findIndex((e) => e.id === targetId)
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev
        const elements = [...prev.elements]
        const [target] = elements.splice(fromIdx, 1)
        elements.splice(toIdx, 0, target)
        const newTemplate = { ...prev, elements }
        pushHistory(newTemplate)
        return newTemplate
      })
    },
    [pushHistory]
  )

  const setAsBackground = useCallback(
    (src: string, publicId?: string) => {
      setTemplate((prev) => {
        const newElements = prev.elements.filter((el) => el.id !== selectedId)
        const newTemplate = {
          ...prev,
          backgroundImage: src,
          backgroundImagePublicId: publicId,
          elements: newElements,
        }
        pushHistory(newTemplate)
        return newTemplate
      })
      setSelectedId(null)
      toast({ title: 'Set as Canvas Background' })
    },
    [selectedId, pushHistory, toast]
  )

  // ─── Background & Asset Handlers ────────────────────────────────────────────
  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBackground(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'background')

      const res = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        updateTemplate({
          backgroundImage: data.secure_url || data.url,
          backgroundImagePublicId: data.public_id,
        })
        toast({ title: 'Background Uploaded' })
      } else {
        toast({ title: 'Upload Failed', variant: 'destructive' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Upload Error', variant: 'destructive' })
    } finally {
      setUploadingBackground(false)
    }
  }

  const handleAssetSelect = (asset: Asset) => {
    if (activeTab === 'templates') {
      updateTemplate({
        backgroundImage: asset.url,
        backgroundImagePublicId: asset.publicId,
      })
    } else {
      addImage(asset.url, asset.publicId)
    }
    setAssetLibraryOpen(false)
  }

  // ─── Save Template Handler ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedEvent) return
    setSaving(true)
    setSaveStatus('saving')

    try {
      const payloadKey = templateType === 'achievement' ? 'achievementTemplate' : 'participationTemplate'
      const res = await fetch(`/api/events/${selectedEvent}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [payloadKey]: template }),
      })

      if (res.ok) {
        setSaveStatus('saved')
        setEvents((prev) =>
          prev.map((e) =>
            e._id === selectedEvent ? { ...e, [payloadKey]: template } : e
          )
        )
        toast({
          title: 'Template Saved Successfully',
          description: `${templateType === 'achievement' ? 'Achievement' : 'Participation'} certificate design updated.`,
        })
      } else {
        setSaveStatus('unsaved')
        toast({ title: 'Save Failed', variant: 'destructive' })
      }
    } catch (err) {
      console.error(err)
      setSaveStatus('unsaved')
      toast({ title: 'Error Saving Template', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Preview / Export PNG ───────────────────────────────────────────────────
  const downloadPreview = () => {
    if (!stageRef.current) return
    setSelectedId(null)
    setTimeout(() => {
      try {
        const uri = stageRef.current.toDataURL({ pixelRatio: 2 })
        const link = document.createElement('a')
        link.download = `${events.find((e) => e._id === selectedEvent)?.name || 'certificate'}-preview.png`
        link.href = uri
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (err) {
        console.error('Preview error:', err)
      }
    }, 100)
  }

  // ─── Keyboard Shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Deselect on Escape
      if (e.key === 'Escape') {
        setSelectedId(null)
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          deleteElement(selectedId)
          e.preventDefault()
        }
      }

      // Undo / Redo
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }

      // Duplicate
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        if (selectedId) duplicateElement(selectedId)
      }

      // Precision Nudge (Arrow Keys)
      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const elem = template.elements.find((el) => el.id === selectedId)
        if (!elem) return

        let newX = elem.x
        let newY = elem.y

        if (e.key === 'ArrowUp') newY -= step
        if (e.key === 'ArrowDown') newY += step
        if (e.key === 'ArrowLeft') newX -= step
        if (e.key === 'ArrowRight') newX += step

        commitUpdate(selectedId, { x: newX, y: newY })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, deleteElement, undo, redo, duplicateElement, template.elements, commitUpdate])

  return (
    <div className="flex flex-col h-dvh max-h-dvh w-full bg-background select-none overflow-hidden">
      {/* 1. Canva-Style Header */}
      <DesignerHeader
        events={events}
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        templateType={templateType}
        setTemplateType={setTemplateType}
        saveStatus={saveStatus}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        undo={undo}
        redo={redo}
        showGrid={settings.showGrid}
        setShowGrid={(val) =>
          setSettings((s) => ({
            ...s,
            showGrid: typeof val === 'function' ? val(s.showGrid) : val,
          }))
        }
        onOpenPreview={downloadPreview}
        onOpenCopyDialog={() => setCopyDialogOpen(true)}
        onOpenAssetLibrary={() => setAssetLibraryOpen(true)}
        onSave={handleSave}
        saving={saving}
      />

      {/* 2. Property Bar */}
      <DesignerPropertyBar
        selectedElement={selectedElement}
        template={template}
        settings={settings}
        setSettings={setSettings}
        onSelectElement={setSelectedId}
        onUpdateElement={commitUpdate}
        onDuplicateElement={duplicateElement}
        onDeleteElement={deleteElement}
        onMoveLayer={moveLayer}
        onReorderElements={reorderElements}
        onSetAsBackground={setAsBackground}
        onFitToScreen={fitToScreen}
        onOpenPositionTab={() => {
          if (sidebarOpen && activeTab === 'position') {
            setSidebarOpen(false)
          } else {
            setActiveTab('position')
            setSidebarOpen(true)
          }
        }}
        onOpenColorTab={() => {
          if (sidebarOpen && activeTab === 'color') {
            setSidebarOpen(false)
          } else {
            setActiveTab('color')
            setSidebarOpen(true)
          }
        }}
        activeSidebarTab={activeTab}
        sidebarOpen={sidebarOpen}
      />

      {/* 3. Main Workspace Area: Sidebar Dock & Drawer + Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        <DesignerSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          template={template}
          selectedElement={selectedElement}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onAddText={addText}
          onAddQRCode={addQRCode}
          onAddImage={addImage}
          onUpdateTemplate={updateTemplate}
          onUpdateElement={commitUpdate}
          onDeleteElement={deleteElement}
          onMoveLayer={moveLayer}
          onReorderElements={reorderElements}
          onOpenAssetLibrary={() => setAssetLibraryOpen(true)}
          onUploadBackground={handleUploadBackground}
          uploadingBackground={uploadingBackground}
        />

        <DesignerCanvas
          template={template}
          settings={settings}
          setSettings={setSettings}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onUpdateElement={commitUpdate}
          containerRef={containerRef}
          stageRef={stageRef}
          onFitToScreen={fitToScreen}
        />

        {/* Simple Loader Only */}
        {pageLoading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm select-none pointer-events-none">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* 4. Mobile Bottom Actions Dock & Modals */}
      <DesignerMobileBar
        selectedElement={selectedElement}
        template={template}
        onSelectElement={setSelectedId}
        onUpdateElement={commitUpdate}
        onDuplicateElement={duplicateElement}
        onDeleteElement={deleteElement}
        onMoveLayer={moveLayer}
        onReorderElements={reorderElements}
        onAddText={addText}
        onAddQRCode={addQRCode}
        onAddImage={addImage}
        onOpenAssetLibrary={() => setAssetLibraryOpen(true)}
        onOpenSidebar={() => {
          setActiveTab('elements')
          setSidebarOpen(true)
        }}
        onSetAsBackground={setAsBackground}
        mobileEditModalOpen={mobileEditModalOpen}
        setMobileEditModalOpen={setMobileEditModalOpen}
      />

      {/* Bottom Announcement Banner on Slow Load */}
      {slowLoading && pageLoading && (
        <div className="fixed bottom-0 inset-x-0 z-[100] bg-red-600 text-white px-4 py-3 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-white" />
            <span>Taking too much time to load the designer. Please check your connection or reload.</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.location.reload()}
              className="text-xs bg-white text-red-600 hover:bg-gray-100 font-semibold h-8 px-3 shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reload
            </Button>
          </div>
        </div>
      )}

      {/* Copy Template Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Copy Certificate Template</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select another event to copy its certificate design.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Label className="text-xs font-semibold">Source Event</Label>
            <Select value={copySourceEventId} onValueChange={setCopySourceEventId}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select event..." />
              </SelectTrigger>
              <SelectContent>
                {events
                  .filter((e) => e._id !== selectedEvent)
                  .map((event) => (
                    <SelectItem key={event._id} value={event._id} className="text-xs">
                      {event.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCopyDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const src = events.find((e) => e._id === copySourceEventId)
                const tpl = templateType === 'achievement' ? src?.achievementTemplate : src?.participationTemplate
                if (tpl) {
                  setTemplate(tpl)
                  pushHistory(tpl)
                  toast({ title: 'Template Copied Successfully' })
                  setCopyDialogOpen(false)
                }
              }}
              disabled={!copySourceEventId}
              className="text-xs"
            >
              Copy Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Library Dialog */}
      <AssetLibrary
        open={assetLibraryOpen}
        onOpenChange={setAssetLibraryOpen}
        onAssetSelect={handleAssetSelect}
      />

      <Toaster />
    </div>
  )
}
