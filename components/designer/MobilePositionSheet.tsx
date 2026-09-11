'use client'

import React, { useState } from 'react'
import {
  Check,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
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
} from 'lucide-react'
import { TemplateElement, TemplateConfig, AlignmentType } from './types'
import { calculateAlignmentPosition, calculateAspectRatioResize } from './utils'

interface MobilePositionSheetProps {
  selectedElement: TemplateElement | null
  template: TemplateConfig
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void
  onMoveLayer: (id: string, direction: 'front' | 'back' | 'up' | 'down') => void
  onClose: () => void
  initialTab?: 'arrange' | 'align' | 'rotate' | 'advanced'
}

export function MobilePositionSheet({
  selectedElement,
  template,
  onUpdateElement,
  onMoveLayer,
  onClose,
  initialTab = 'arrange',
}: MobilePositionSheetProps) {
  const [activePill, setActivePill] = useState<'arrange' | 'align' | 'rotate' | 'advanced'>(initialTab)

  // Align to Page Handler
  const alignToPage = (type: AlignmentType) => {
    if (!selectedElement) return
    const updates = calculateAlignmentPosition(selectedElement, template.width, template.height, type)
    if (Object.keys(updates).length > 0) {
      onUpdateElement(selectedElement.id, updates)
    }
  }

  // Aspect ratio aware resizing
  const handleWidthChange = (newWidth: number) => {
    if (!selectedElement) return
    const updates = calculateAspectRatioResize(selectedElement, newWidth, 'width')
    onUpdateElement(selectedElement.id, updates)
  }

  const handleHeightChange = (newHeight: number) => {
    if (!selectedElement) return
    const updates = calculateAspectRatioResize(selectedElement, newHeight, 'height')
    onUpdateElement(selectedElement.id, updates)
  }

  return (
    <div className="w-full bg-card text-card-foreground rounded-t-3xl border-t border-border shadow-2xl flex flex-col font-sans select-none pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[height] duration-200 ease-out">
      {/* Top Drag Handle */}
      <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2.5 mb-1 shrink-0" />

      {/* Header Bar */}
      <div className="relative flex items-center justify-between px-4 py-1.5 border-b border-border/40 shrink-0">
        <div className="w-8" />
        <h3 className="text-sm font-semibold text-foreground tracking-tight">Position & Nudge</h3>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-foreground transition-colors active:scale-95"
          title="Done"
        >
          <Check className="h-4.5 w-4.5 text-foreground" />
        </button>
      </div>

      {/* Sheet Content Area: Fits Content Snugly */}
      <div className="p-3.5 overflow-y-auto">
        {selectedElement ? (
          <>
            {/* 1. ARRANGE TAB */}
            {activePill === 'arrange' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onMoveLayer(selectedElement.id, 'up')}
                  className="flex items-center gap-2.5 p-3 rounded-sm border border-border bg-background hover:bg-muted/80 text-foreground text-sm font-semibold transition active:scale-[0.98]"
                >
                  <ArrowUp className="h-4 w-4 text-foreground shrink-0" />
                  <span>Forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMoveLayer(selectedElement.id, 'down')}
                  className="flex items-center gap-2.5 p-3 rounded-sm border border-border bg-background hover:bg-muted/80 text-foreground text-sm font-semibold transition active:scale-[0.98]"
                >
                  <ArrowDown className="h-4 w-4 text-foreground shrink-0" />
                  <span>Backward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMoveLayer(selectedElement.id, 'front')}
                  className="flex items-center gap-2.5 p-3 rounded-sm border border-border bg-background hover:bg-muted/80 text-foreground text-sm font-semibold transition active:scale-[0.98]"
                >
                  <ChevronsUp className="h-4 w-4 text-foreground shrink-0" />
                  <span>To front</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMoveLayer(selectedElement.id, 'back')}
                  className="flex items-center gap-2.5 p-3 rounded-sm border border-border bg-background hover:bg-muted/80 text-foreground text-sm font-semibold transition active:scale-[0.98]"
                >
                  <ChevronsDown className="h-4 w-4 text-foreground shrink-0" />
                  <span>To back</span>
                </button>
              </div>
            )}

            {/* 2. ALIGN TAB */}
            {activePill === 'align' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => alignToPage('top')}
                  className="flex items-center gap-2.5 p-2.5 rounded-sm border border-border bg-background hover:bg-muted/80 text-foreground text-sm font-medium transition active:scale-[0.98]"
                >
                  <AlignStartVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Top</span>
                </button>
                <button
                  type="button"
                  onClick={() => alignToPage('left')}
                  className="flex items-center gap-2.5 p-2.5 rounded-sm border border-border bg-background hover:bg-muted/80 text-foreground text-sm font-medium transition active:scale-[0.98]"
                >
                  <AlignStartHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Left</span>
                </button>
                <button
                  type="button"
                  onClick={() => alignToPage('middle')}
                  className="flex items-center gap-2.5 p-2.5 rounded-sm border border-border bg-background hover:bg-muted/80 text-foreground text-sm font-medium transition active:scale-[0.98]"
                >
                  <AlignCenterVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Middle</span>
                </button>
                <button
                  type="button"
                  onClick={() => alignToPage('center')}
                  className="flex items-center gap-2.5 p-2.5 rounded-sm border border-border bg-background hover:bg-muted/80 text-foreground text-sm font-medium transition active:scale-[0.98]"
                >
                  <AlignCenterHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Centre</span>
                </button>
                <button
                  type="button"
                  onClick={() => alignToPage('bottom')}
                  className="flex items-center gap-2.5 p-2.5 rounded-sm border border-border bg-background hover:bg-muted/80 text-foreground text-sm font-medium transition active:scale-[0.98]"
                >
                  <AlignEndVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Bottom</span>
                </button>
                <button
                  type="button"
                  onClick={() => alignToPage('right')}
                  className="flex items-center gap-2.5 p-2.5 rounded-sm border border-border bg-background hover:bg-muted/80 text-foreground text-sm font-medium transition active:scale-[0.98]"
                >
                  <AlignEndHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Right</span>
                </button>
              </div>
            )}


            {/* 4. ADVANCED TAB */}
            {activePill === 'advanced' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Width</label>
                    <div className="flex items-center bg-background border border-border rounded-sm px-2.5 py-1 focus-within:border-primary">
                      <input
                        type="number"
                        value={Math.round(selectedElement.width || 100)}
                        onChange={(e) => handleWidthChange(Number(e.target.value) || 10)}
                        className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-muted-foreground ml-0.5">px</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Height</label>
                    <div className="flex items-center bg-background border border-border rounded-sm px-2.5 py-1 focus-within:border-primary">
                      <input
                        type="number"
                        value={Math.round(selectedElement.height || 40)}
                        onChange={(e) => handleHeightChange(Number(e.target.value) || 10)}
                        className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-muted-foreground ml-0.5">px</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Ratio</label>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateElement(selectedElement.id, {
                          aspectRatioLocked: !selectedElement.aspectRatioLocked,
                        })
                      }
                      className={`w-full flex items-center justify-center py-1.5 rounded-sm border transition ${
                        selectedElement.aspectRatioLocked
                          ? 'bg-primary/15 border-primary/50 text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground'
                      }`}
                      title="Lock aspect ratio"
                    >
                      {selectedElement.aspectRatioLocked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">X Position</label>
                    <div className="flex items-center bg-background border border-border rounded-sm px-2.5 py-1 focus-within:border-primary">
                      <input
                        type="number"
                        value={Math.round(selectedElement.x || 0)}
                        onChange={(e) =>
                          onUpdateElement(selectedElement.id, { x: Number(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-muted-foreground ml-0.5">px</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Y Position</label>
                    <div className="flex items-center bg-background border border-border rounded-sm px-2.5 py-1 focus-within:border-primary">
                      <input
                        type="number"
                        value={Math.round(selectedElement.y || 0)}
                        onChange={(e) =>
                          onUpdateElement(selectedElement.id, { y: Number(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-muted-foreground ml-0.5">px</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Rotate</label>
                    <div className="flex items-center bg-background border border-border rounded-sm px-2.5 py-1 focus-within:border-primary">
                      <input
                        type="number"
                        value={Math.round(selectedElement.rotation || 0)}
                        onChange={(e) => {
                          const val = (Number(e.target.value) || 0) % 360
                          const norm = val < 0 ? val + 360 : val
                          onUpdateElement(selectedElement.id, { rotation: norm })
                        }}
                        className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-muted-foreground ml-0.5">°</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-6 text-center text-muted-foreground text-sm">
            Select an element to position and align.
          </div>
        )}
      </div>

      {/* Bottom Navigation Pills (Arrange | Align | Rotate | Advanced) */}
      <div className="flex items-center justify-center gap-1.5 pt-2 px-3 border-t border-border/50 shrink-0">
        <button
          type="button"
          onClick={() => setActivePill('arrange')}
          className={`px-3 py-1 rounded-full text-sm sm:text-sm font-semibold transition-all ${
            activePill === 'arrange'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          Arrange
        </button>
        <button
          type="button"
          onClick={() => setActivePill('align')}
          className={`px-3 py-1 rounded-full text-sm sm:text-sm font-semibold transition-all ${
            activePill === 'align'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          Align
        </button>
        <button
          type="button"
          onClick={() => setActivePill('advanced')}
          className={`px-3 py-1 rounded-full text-sm sm:text-sm font-semibold transition-all ${
            activePill === 'advanced'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          Advanced
        </button>
      </div>
    </div>
  )
}
