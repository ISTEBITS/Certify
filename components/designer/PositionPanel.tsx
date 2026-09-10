'use client'

import React, { useState } from 'react'
import {
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  Lock,
  Unlock,
  Sliders,
  Type,
  QrCode,
  ImageIcon,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  RotateCw,
  RotateCcw,
} from 'lucide-react'
import { TemplateElement, TemplateConfig } from './types'

interface PositionPanelProps {
  selectedElement: TemplateElement | null
  template: TemplateConfig
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void
  onMoveLayer: (id: string, direction: 'front' | 'back' | 'up' | 'down') => void
  onSelectElement?: (id: string | null) => void
  onDeleteElement?: (id: string) => void
  onReorderElements?: (draggedId: string, targetId: string) => void
  onClose?: () => void
  defaultTab?: 'arrange' | 'layers'
  className?: string
}

export function PositionPanel({
  selectedElement,
  template,
  onUpdateElement,
  onMoveLayer,
  onSelectElement,
  onDeleteElement,
  onReorderElements,
  onClose,
  defaultTab = 'arrange',
  className = '',
}: PositionPanelProps) {
  const [activeTab, setActiveTab] = useState<'arrange' | 'layers'>(defaultTab)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Align to Page Handler
  const alignToPage = (type: 'top' | 'left' | 'middle' | 'center' | 'bottom' | 'right') => {
    if (!selectedElement) return
    const elW = selectedElement.width || 100
    const elH = selectedElement.height || 40

    switch (type) {
      case 'top':
        onUpdateElement(selectedElement.id, { y: 20 })
        break
      case 'left':
        onUpdateElement(selectedElement.id, { x: 20 })
        break
      case 'middle':
        onUpdateElement(selectedElement.id, { y: Math.round((template.height - elH) / 2) })
        break
      case 'center':
        onUpdateElement(selectedElement.id, { x: Math.round((template.width - elW) / 2) })
        break
      case 'bottom':
        onUpdateElement(selectedElement.id, { y: Math.round(template.height - elH - 20) })
        break
      case 'right':
        onUpdateElement(selectedElement.id, { x: Math.round(template.width - elW - 20) })
        break
    }
  }

  // Handle Aspect Ratio aware resizing
  const handleWidthChange = (newWidth: number) => {
    if (!selectedElement) return
    const clampedW = Math.max(10, newWidth)
    if (selectedElement.aspectRatioLocked && selectedElement.width > 0) {
      const ratio = (selectedElement.height || 10) / selectedElement.width
      onUpdateElement(selectedElement.id, {
        width: clampedW,
        height: Math.round(clampedW * ratio),
      })
    } else {
      onUpdateElement(selectedElement.id, { width: clampedW })
    }
  }

  const handleHeightChange = (newHeight: number) => {
    if (!selectedElement) return
    const clampedH = Math.max(10, newHeight)
    if (selectedElement.aspectRatioLocked && selectedElement.height > 0) {
      const ratio = (selectedElement.width || 10) / selectedElement.height
      onUpdateElement(selectedElement.id, {
        height: clampedH,
        width: Math.round(clampedH * ratio),
      })
    } else {
      onUpdateElement(selectedElement.id, { height: clampedH })
    }
  }

  return (
    <div
      className={`w-full bg-card text-card-foreground rounded-xl border border-border overflow-hidden flex flex-col font-sans select-none ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <span>Position</span>
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/30">
        <button
          type="button"
          onClick={() => setActiveTab('arrange')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center transition-all relative ${
            activeTab === 'arrange'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Arrange</span>
          {activeTab === 'arrange' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center transition-all relative ${
            activeTab === 'layers'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Layers</span>
          {activeTab === 'layers' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Arrange */}
      {activeTab === 'arrange' && (
        <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh]">
          {selectedElement ? (
            <>
              {/* Layer Order Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onMoveLayer(selectedElement.id, 'up')}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-medium transition active:scale-[0.98]"
                >
                  <ArrowUp className="h-4 w-4 text-primary" />
                  <span>Forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMoveLayer(selectedElement.id, 'down')}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-medium transition active:scale-[0.98]"
                >
                  <ArrowDown className="h-4 w-4 text-primary" />
                  <span>Backward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMoveLayer(selectedElement.id, 'front')}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-medium transition active:scale-[0.98]"
                >
                  <ChevronsUp className="h-4 w-4 text-primary" />
                  <span>To front</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMoveLayer(selectedElement.id, 'back')}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-medium transition active:scale-[0.98]"
                >
                  <ChevronsDown className="h-4 w-4 text-primary" />
                  <span>To back</span>
                </button>
              </div>

              {/* Align to Page */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground block">Align to page</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => alignToPage('top')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-medium transition "
                  >
                    <AlignStartVertical className="h-4 w-4 text-muted-foreground" />
                    <span>Top</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignToPage('left')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-medium transition "
                  >
                    <AlignStartHorizontal className="h-4 w-4 text-muted-foreground" />
                    <span>Left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignToPage('middle')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-medium transition "
                  >
                    <AlignCenterVertical className="h-4 w-4 text-muted-foreground" />
                    <span>Middle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignToPage('center')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-medium transition "
                  >
                    <AlignCenterHorizontal className="h-4 w-4 text-muted-foreground" />
                    <span>Centre</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignToPage('bottom')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-medium transition "
                  >
                    <AlignEndVertical className="h-4 w-4 text-muted-foreground" />
                    <span>Bottom</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignToPage('right')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/80 text-foreground text-xs font-medium transition "
                  >
                    <AlignEndHorizontal className="h-4 w-4 text-muted-foreground" />
                    <span>Right</span>
                  </button>
                </div>
              </div>

              {/* Advanced Section */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground block">Advanced</span>

                {/* Row 1: Width, Height, Ratio Lock */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Width</label>
                    <div className="flex items-center bg-background border border-border rounded-lg px-2.5 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 ">
                      <input
                        type="number"
                        value={Math.round(selectedElement.width || 100)}
                        onChange={(e) => handleWidthChange(Number(e.target.value) || 10)}
                        className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] text-muted-foreground ml-1">px</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Height</label>
                    <div className="flex items-center bg-background border border-border rounded-lg px-2.5 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 ">
                      <input
                        type="number"
                        value={Math.round(selectedElement.height || 40)}
                        onChange={(e) => handleHeightChange(Number(e.target.value) || 10)}
                        className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] text-muted-foreground ml-1">px</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Ratio</label>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateElement(selectedElement.id, {
                          aspectRatioLocked: !selectedElement.aspectRatioLocked,
                        })
                      }
                      className={`w-full flex items-center justify-center py-2 rounded-lg border transition  ${
                        selectedElement.aspectRatioLocked
                          ? 'bg-primary/10 border-primary/40 text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/80'
                      }`}
                      title={
                        selectedElement.aspectRatioLocked
                          ? 'Aspect ratio locked'
                          : 'Lock aspect ratio'
                      }
                    >
                      {selectedElement.aspectRatioLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Row 2: X, Y, Rotate */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">X</label>
                    <div className="flex items-center bg-background border border-border rounded-lg px-2.5 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 ">
                      <input
                        type="number"
                        value={Math.round(selectedElement.x || 0)}
                        onChange={(e) =>
                          onUpdateElement(selectedElement.id, { x: Number(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] text-muted-foreground ml-1">px</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Y</label>
                    <div className="flex items-center bg-background border border-border rounded-lg px-2.5 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 ">
                      <input
                        type="number"
                        value={Math.round(selectedElement.y || 0)}
                        onChange={(e) =>
                          onUpdateElement(selectedElement.id, { y: Number(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] text-muted-foreground ml-1">px</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Rotate</label>
                    <div className="flex items-center bg-background border border-border rounded-lg px-2.5 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 ">
                      <input
                        type="number"
                        value={Math.round(selectedElement.rotation || 0)}
                        onChange={(e) => {
                          const val = (Number(e.target.value) || 0) % 360
                          const norm = val < 0 ? val + 360 : val
                          onUpdateElement(selectedElement.id, { rotation: norm })
                        }}
                        className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] text-muted-foreground ml-0.5">°</span>
                    </div>
                  </div>
                </div>

                {/* Rotation Steppers & Quick Presets */}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">Angle Controls</span>
                    <span className="text-[11px] font-bold text-foreground tabular-nums">
                      {Math.round(selectedElement.rotation || 0)}°
                    </span>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min="0"
                    max="359"
                    step="1"
                    value={Math.round(selectedElement.rotation || 0)}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { rotation: Number(e.target.value) })
                    }
                    className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => onUpdateElement(selectedElement.id, { rotation: deg })}
                        className={`py-1 text-xs font-medium rounded-md border transition-all ${
                          Math.round(selectedElement.rotation || 0) === deg
                            ? 'bg-primary/15 border-primary text-primary font-bold'
                            : 'bg-background border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {deg === 0 ? '0° (Reset)' : `${deg}°`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = selectedElement.rotation || 0
                        const next = (cur - 45 + 360) % 360
                        onUpdateElement(selectedElement.id, { rotation: next })
                      }}
                      className="flex-1 py-1 px-2 rounded-md border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center justify-center gap-1 transition"
                      title="Rotate -45°"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>-45°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = selectedElement.rotation || 0
                        const next = (cur - 15 + 360) % 360
                        onUpdateElement(selectedElement.id, { rotation: next })
                      }}
                      className="flex-1 py-1 px-2 rounded-md border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center justify-center gap-1 transition"
                      title="Rotate -15°"
                    >
                      <span>-15°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = selectedElement.rotation || 0
                        const next = (cur + 15) % 360
                        onUpdateElement(selectedElement.id, { rotation: next })
                      }}
                      className="flex-1 py-1 px-2 rounded-md border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center justify-center gap-1 transition"
                      title="Rotate +15°"
                    >
                      <span>+15°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = selectedElement.rotation || 0
                        const next = (cur + 45) % 360
                        onUpdateElement(selectedElement.id, { rotation: next })
                      }}
                      className="flex-1 py-1 px-2 rounded-md border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center justify-center gap-1 transition"
                      title="Rotate +45°"
                    >
                      <RotateCw className="h-3 w-3" />
                      <span>+45°</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs">
              Select an element on canvas to modify its position, alignment, and dimensions.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Layers */}
      {activeTab === 'layers' && (
        <div className="p-3 space-y-1.5 overflow-y-auto max-h-[75vh]">
          {template.elements.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No elements on canvas.</p>
          ) : (
            [...template.elements].reverse().map((el) => {
              const realIndex = template.elements.findIndex((e) => e.id === el.id)
              const isTop = realIndex === template.elements.length - 1
              const isBottom = realIndex === 0
              const isSelected = selectedElement?.id === el.id

              return (
                <div
                  key={el.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', el.id)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverId(el.id)
                  }}
                  onDragLeave={() => {
                    setDragOverId(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverId(null)
                    const draggedId = e.dataTransfer.getData('text/plain')
                    if (draggedId && draggedId !== el.id && onReorderElements) {
                      onReorderElements(draggedId, el.id)
                    }
                  }}
                  onClick={() => onSelectElement && onSelectElement(el.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                    dragOverId === el.id ? 'border-primary border-2 bg-primary/5' : ''
                  } ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary font-medium '
                      : 'border-border bg-background hover:bg-muted/80 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 cursor-grab shrink-0" />
                    {el.type === 'text' && <Type className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    {el.type === 'qrcode' && <QrCode className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    {el.type === 'image' && <ImageIcon className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    <span className="truncate text-xs">
                      {el.type === 'text'
                        ? el.content || el.field || 'Text'
                        : el.type === 'qrcode'
                        ? 'QR Code'
                        : 'Image'}
                    </span>
                    {el.field && el.field !== 'custom' && (
                      <span className="text-[9px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded shrink-0">
                        {el.field}
                      </span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={isTop}
                      onClick={() => onMoveLayer(el.id, 'up')}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-25 rounded transition"
                      title="Bring Forward"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isBottom}
                      onClick={() => onMoveLayer(el.id, 'down')}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-25 rounded transition"
                      title="Send Backward"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateElement(el.id, { isLocked: !el.isLocked })}
                      className={`p-1 hover:bg-muted rounded transition ${
                        el.isLocked ? 'text-amber-600' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title={el.isLocked ? 'Locked' : 'Unlocked'}
                    >
                      {el.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    </button>
                    {onDeleteElement && (
                      <button
                        type="button"
                        onClick={() => onDeleteElement(el.id)}
                        className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-600 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
