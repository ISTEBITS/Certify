'use client'

import React from 'react'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  BringToFront,
  SendToBack,
  Copy,
  Trash2,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutTemplate,
  ImageIcon,
  Sliders,
  Sparkles,
  Palette,
  RotateCw,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  TemplateElement,
  TemplateConfig,
  DesignerSettings,
  FONT_FAMILIES,
} from './types'
import { SidebarTab } from './DesignerSidebar'

interface DesignerPropertyBarProps {
  selectedElement: TemplateElement | null
  template: TemplateConfig
  settings: DesignerSettings
  setSettings: React.Dispatch<React.SetStateAction<DesignerSettings>>
  onSelectElement?: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void
  onDuplicateElement: (id: string) => void
  onDeleteElement: (id: string) => void
  onMoveLayer: (id: string, direction: 'front' | 'back' | 'up' | 'down') => void
  onReorderElements?: (draggedId: string, targetId: string) => void
  onSetAsBackground?: (src: string, publicId?: string) => void
  onFitToScreen: () => void
  onOpenPositionTab?: () => void
  onOpenColorTab?: () => void
  activeSidebarTab?: SidebarTab
  sidebarOpen?: boolean
}

export function DesignerPropertyBar({
  selectedElement,
  template,
  settings,
  setSettings,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onMoveLayer,
  onSetAsBackground,
  onFitToScreen,
  onOpenPositionTab,
  onOpenColorTab,
  activeSidebarTab,
  sidebarOpen,
}: DesignerPropertyBarProps) {
  return (
    <div className="hidden md:flex h-10 border-b border-border bg-card/90 backdrop-blur-sm px-3 items-center justify-between gap-2 overflow-x-auto select-none shrink-0 z-10 text-xs">
      {/* Contextual Properties for Selected Element */}
      <div className="flex items-center gap-1.5 min-w-0">
        {selectedElement ? (
          <div className="flex items-center gap-1.5">
            {/* Dynamic Field Selector */}
            {selectedElement.type === 'text' && (
              <div className="w-32 shrink-0">
                <Select
                  value={selectedElement.field || 'custom'}
                  onValueChange={(val) =>
                    onUpdateElement(selectedElement.id, { field: val as TemplateElement['field'] })
                  }
                >
                  <SelectTrigger className="h-7 text-xs bg-primary/5 border-primary/30 text-primary font-medium px-2">
                    <Sparkles className="h-3 w-3 mr-1 shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom" className="text-xs">Static Text</SelectItem>
                    <SelectItem value="name" className="text-xs font-semibold">Participant Name</SelectItem>
                    <SelectItem value="registrationNumber" className="text-xs">Registration No</SelectItem>
                    <SelectItem value="collegeName" className="text-xs">College Name</SelectItem>
                    <SelectItem value="event" className="text-xs">Event Name</SelectItem>
                    <SelectItem value="position" className="text-xs">Position / Rank</SelectItem>
                    <SelectItem value="date" className="text-xs">Issue Date</SelectItem>
                    <SelectItem value="certificateId" className="text-xs">Certificate ID</SelectItem>
                    <SelectItem value="email" className="text-xs">Participant Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 1. TEXT PROPERTIES */}
            {selectedElement.type === 'text' && (
              <>
                {/* Font Family */}
                <div className="w-28 sm:w-36 shrink-0">
                  <Select
                    value={selectedElement.fontFamily || 'Arial'}
                    onValueChange={(fontFamily) => onUpdateElement(selectedElement.id, { fontFamily })}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font} value={font} className="text-xs" style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size Stepper */}
                <div className="flex items-center border border-border rounded-md bg-background shrink-0">
                  <button
                    onClick={() =>
                      onUpdateElement(selectedElement.id, {
                        fontSize: Math.max(8, (selectedElement.fontSize || 20) - 2),
                      })
                    }
                    className="px-2 py-0.5 hover:bg-muted font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={selectedElement.fontSize || 20}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        fontSize: Math.max(8, Math.min(140, Number(e.target.value) || 12)),
                      })
                    }
                    className="w-9 text-center bg-transparent border-none text-xs font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() =>
                      onUpdateElement(selectedElement.id, {
                        fontSize: Math.min(140, (selectedElement.fontSize || 20) + 2),
                      })
                    }
                    className="px-2 py-0.5 hover:bg-muted font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Text Formatting Toggles */}
                <div className="flex items-center border border-border rounded-md overflow-hidden bg-background shrink-0">
                  <button
                    onClick={() => onUpdateElement(selectedElement.id, { isBold: !selectedElement.isBold })}
                    className={`h-7 w-7 flex items-center justify-center transition-colors ${
                      selectedElement.isBold ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted text-muted-foreground'
                    }`}
                    title="Bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateElement(selectedElement.id, { isItalic: !selectedElement.isItalic })}
                    className={`h-7 w-7 flex items-center justify-center transition-colors border-l border-border ${
                      selectedElement.isItalic ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                    }`}
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateElement(selectedElement.id, { isUnderline: !selectedElement.isUnderline })}
                    className={`h-7 w-7 flex items-center justify-center transition-colors border-l border-border ${
                      selectedElement.isUnderline ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                    }`}
                    title="Underline"
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Text Alignment */}
                <div className="hidden sm:flex items-center border border-border rounded-md overflow-hidden bg-background shrink-0">
                  <button
                    onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'left' })}
                    className={`h-7 w-7 flex items-center justify-center transition-colors ${
                      selectedElement.textAlign === 'left' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                    }`}
                    title="Align Left"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'center' })}
                    className={`h-7 w-7 flex items-center justify-center transition-colors border-l border-border ${
                      !selectedElement.textAlign || selectedElement.textAlign === 'center' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                    }`}
                    title="Align Center"
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'right' })}
                    className={`h-7 w-7 flex items-center justify-center transition-colors border-l border-border ${
                      selectedElement.textAlign === 'right' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                    }`}
                    title="Align Right"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Text Color Picker Button (Opens in Canva-style Left Drawer) */}
                <button
                  type="button"
                  onClick={onOpenColorTab}
                  className={`h-7 px-2 flex items-center gap-1.5 border rounded-md transition-colors shrink-0 ${
                    sidebarOpen && activeSidebarTab === 'color'
                      ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
                      : 'border-border bg-background hover:bg-muted text-foreground'
                  }`}
                  title="Text Color (Opens in Left Panel)"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-inner"
                    style={{ backgroundColor: selectedElement.color || '#000000' }}
                  />
                  <span className="text-[11px] uppercase text-foreground">
                    {selectedElement.color || '#000000'}
                  </span>
                  <Palette className="h-3 w-3 text-muted-foreground ml-0.5" />
                </button>
              </>
            )}

            {/* 2. IMAGE ASSET PROPERTIES */}
            {selectedElement.type === 'image' && (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {Math.round(selectedElement.width)} × {Math.round(selectedElement.height)}px
                  </span>
                </div>

                {selectedElement.src && onSetAsBackground && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 px-2 bg-background hover:bg-muted font-medium"
                    onClick={() => onSetAsBackground(selectedElement.src!, selectedElement.imagePublicId)}
                    title="Apply image as canvas background"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5 text-primary" />
                    <span>Set BG</span>
                  </Button>
                )}
              </>
            )}

            <Separator orientation="vertical" className="h-4" />

            {/* 3. CANVA-STYLE POSITION BUTTON (Opens in Left Panel) */}
            <Button
              variant={sidebarOpen && activeSidebarTab === 'position' ? 'secondary' : 'outline'}
              size="sm"
              className={`h-7 text-xs gap-1 px-2 shrink-0 font-medium ${
                sidebarOpen && activeSidebarTab === 'position'
                  ? 'bg-primary/10 border-primary text-primary font-semibold'
                  : ''
              }`}
              onClick={onOpenPositionTab}
              title="Position, Geometry & Page Alignment (Opens in Left Panel)"
            >
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span>Position</span>
            </Button>

            {/* Quick Rotate Control */}
            <div className="flex items-center border border-border rounded-md bg-background shrink-0" title="Rotate Element">
              <button
                type="button"
                onClick={() => {
                  const cur = selectedElement.rotation || 0
                  const next = (cur - 90 + 360) % 360
                  onUpdateElement(selectedElement.id, { rotation: next })
                }}
                className="px-1.5 py-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Rotate -90°"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
              <div className="flex items-center px-1 text-xs font-semibold text-foreground">
                <input
                  type="number"
                  value={Math.round(selectedElement.rotation || 0)}
                  onChange={(e) => {
                    const val = (Number(e.target.value) || 0) % 360
                    const norm = val < 0 ? val + 360 : val
                    onUpdateElement(selectedElement.id, { rotation: norm })
                  }}
                  className="w-7 text-center bg-transparent border-none text-xs font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-muted-foreground">°</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const cur = selectedElement.rotation || 0
                  const next = (cur + 90) % 360
                  onUpdateElement(selectedElement.id, { rotation: next })
                }}
                className="px-1.5 py-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Rotate +90°"
              >
                <RotateCw className="h-3 w-3" />
              </button>
            </div>

            {/* Lock / Unlock */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${selectedElement.isLocked ? 'text-amber-600 bg-amber-50' : 'text-muted-foreground'}`}
              onClick={() => onUpdateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })}
              title={selectedElement.isLocked ? 'Unlock Element' : 'Lock Element Position'}
            >
              {selectedElement.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </Button>

            {/* Common Actions: Layers, Duplicate, Delete */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onMoveLayer(selectedElement.id, 'front')}
                title="Bring to Front"
              >
                <BringToFront className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onMoveLayer(selectedElement.id, 'back')}
                title="Send to Back"
              >
                <SendToBack className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onDuplicateElement(selectedElement.id)}
                title="Duplicate"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDeleteElement(selectedElement.id)}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Canvas: {template.width} x {template.height}px</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{template.elements.length} Elements</span>
          </div>
        )}
      </div>

      {/* Right: Smooth Range Slider Zoom + Fit Button */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setSettings((s) => ({ ...s, zoom: Math.max(0.15, Math.round((s.zoom - 0.1) * 100) / 100) }))}
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>

        <input
          type="range"
          min="15"
          max="300"
          step="1"
          value={Math.round(settings.zoom * 100)}
          onChange={(e) => {
            const val = Number(e.target.value) / 100
            setSettings((s) => ({ ...s, zoom: val }))
          }}
          className="w-16 sm:w-24 md:w-28 h-2 bg-gray-500/20 rounded-lg appearance-none cursor-pointer accent-primary"
          title={`Zoom: ${Math.round(settings.zoom * 100)}%`}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setSettings((s) => ({ ...s, zoom: Math.min(3.5, Math.round((s.zoom + 0.1) * 100) / 100) }))}
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>

        <span className="text-xs font-medium text-muted-foreground w-11 text-center tabular-nums">
          {Math.round(settings.zoom * 100)}%
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onFitToScreen}
          title="Fit to Screen"
        >
          <Maximize2 className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Fit</span>
        </Button>
      </div>
    </div>
  )
}
