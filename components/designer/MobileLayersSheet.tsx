'use client'

import React, { useState, useMemo } from 'react'
import {
  X,
  GripVertical,
  Type,
  ImageIcon,
  QrCode,
  Lock,
  Unlock,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
} from 'lucide-react'
import { TemplateElement, TemplateConfig } from './types'

interface MobileLayersSheetProps {
  selectedElement: TemplateElement | null
  template: TemplateConfig
  onSelectElement: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void
  onMoveLayer: (id: string, direction: 'front' | 'back' | 'up' | 'down') => void
  onDeleteElement: (id: string) => void
  onClose: () => void
}

export function MobileLayersSheet({
  selectedElement,
  template,
  onSelectElement,
  onUpdateElement,
  onMoveLayer,
  onDeleteElement,
  onClose,
}: MobileLayersSheetProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'overlapping'>('all')

  // Calculate overlapping elements if filter is 'overlapping'
  const visibleElements = useMemo(() => {
    // Reverse elements array so top layer in stack renders on top of the list
    const reversed = [...template.elements].reverse()

    if (filterMode === 'all' || !selectedElement) {
      return reversed
    }

    // Check if element overlaps with selected element bounding box
    const selLeft = selectedElement.x
    const selTop = selectedElement.y
    const selRight = selectedElement.x + (selectedElement.width || 100)
    const selBottom = selectedElement.y + (selectedElement.height || 40)

    return reversed.filter((el) => {
      if (el.id === selectedElement.id) return true
      const elLeft = el.x
      const elTop = el.y
      const elRight = el.x + (el.width || 100)
      const elBottom = el.y + (el.height || 40)

      return !(
        selRight < elLeft ||
        selLeft > elRight ||
        selBottom < elTop ||
        selTop > elBottom
      )
    })
  }, [template.elements, filterMode, selectedElement])

  const getElementIcon = (el: TemplateElement) => {
    switch (el.type) {
      case 'text':
        return <Type className="h-4 w-4 text-primary shrink-0" />
      case 'image':
        return <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
      case 'qrcode':
        return <QrCode className="h-4 w-4 text-emerald-500 shrink-0" />
      default:
        return <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
    }
  }

  const getElementLabel = (el: TemplateElement) => {
    if (el.type === 'text') {
      return el.content || (el.field ? `Dynamic: ${el.field}` : 'Text Element')
    }
    if (el.type === 'image') {
      return 'Image Asset'
    }
    if (el.type === 'qrcode') {
      return 'Verification QR Code'
    }
    return el.id
  }

  return (
    <div className="w-full bg-card text-card-foreground rounded-t-3xl border-t border-border shadow-2xl flex flex-col font-sans select-none pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[height] duration-200 ease-out max-h-[75vh]">
      {/* Top Drag Handle */}
      <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2.5 mb-1 shrink-0" />

      {/* Header Bar */}
      <div className="relative flex items-center justify-between px-4 py-1.5 border-b border-border/40 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (selectedElement) {
              onSelectElement(null)
            } else if (template.elements.length > 0) {
              onSelectElement(template.elements[template.elements.length - 1].id)
            }
          }}
          className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
        >
          {selectedElement ? 'Deselect' : 'Select'}
        </button>

        <h3 className="text-sm font-semibold text-foreground tracking-tight">Layers</h3>

        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-foreground transition-colors active:scale-95"
          title="Close"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Layer Items List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-1 space-y-1.5">
        {visibleElements.length > 0 ? (
          visibleElements.map((el) => {
            const isSelected = selectedElement?.id === el.id

            return (
              <div
                key={el.id}
                onClick={() => onSelectElement(el.id)}
                className={`relative flex items-center gap-2.5 p-2.5 rounded-sm border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                    : 'border-border bg-background hover:bg-muted/60'
                }`}
              >
                {/* 6-dot Drag / Grip Icon */}
                <div className="text-muted-foreground/60 shrink-0 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Element Type Icon */}
                <div className="shrink-0 p-1 rounded-sm bg-muted/80 flex items-center justify-center">
                  {getElementIcon(el)}
                </div>

                {/* Layer Name & Snippet Preview */}
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs font-medium text-foreground truncate leading-tight">
                    {getElementLabel(el)}
                  </p>
                </div>

                {/* Layer Actions (Order Up/Down, Lock, Delete) */}
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onMoveLayer(el.id, 'up')}
                    className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
                    title="Move Layer Up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveLayer(el.id, 'down')}
                    className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
                    title="Move Layer Down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateElement(el.id, { isLocked: !el.isLocked })}
                    className={`p-1 rounded-sm transition ${
                      el.isLocked
                        ? 'text-amber-600 hover:bg-amber-500/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title={el.isLocked ? 'Unlock' : 'Lock'}
                  >
                    {el.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteElement(el.id)}
                    className="p-1 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    title="Delete Element"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-8 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-1.5">
            <Layers className="h-7 w-7 text-muted-foreground/40" />
            <p>
              {filterMode === 'overlapping'
                ? 'No overlapping elements detected.'
                : 'No elements found on canvas.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
