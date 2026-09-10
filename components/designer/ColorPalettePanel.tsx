'use client'

import React, { useMemo } from 'react'
import {
  Palette,
  X,
  Pipette,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react'
import { TemplateElement, TemplateConfig, PRESET_COLORS } from './types'

interface ColorPalettePanelProps {
  selectedElement: TemplateElement | null
  template: TemplateConfig
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void
  onClose?: () => void
  className?: string
}

const BRAND_COLORS = [
  { name: 'Primary Indigo', value: '#4F46E5' },
  { name: 'Slate Blue', value: '#6366F1' },
  { name: 'Deep Slate', value: '#0F172A' },
  { name: 'Dark Navy', value: '#1E293B' },
  { name: 'Emerald Green', value: '#10B981' },
  { name: 'Teal Cyan', value: '#14B8A6' },
  { name: 'Amber Gold', value: '#F59E0B' },
  { name: 'Warm Orange', value: '#F97316' },
  { name: 'Crimson Rose', value: '#F43F5E' },
  { name: 'Royal Purple', value: '#8B5CF6' },
]

const CLASSIC_CERTIFICATE_COLORS = [
  { name: 'Rich Black', value: '#000000' },
  { name: 'Charcoal', value: '#1F2937' },
  { name: 'Pure Gold', value: '#D4AF37' },
  { name: 'Metallic Bronze', value: '#B45309' },
  { name: 'Deep Navy', value: '#0A192F' },
  { name: 'Royal Blue', value: '#1D4ED8' },
  { name: 'Burgundy Red', value: '#800020' },
  { name: 'Forest Green', value: '#15803D' },
  { name: 'Midnight', value: '#111827' },
  { name: 'Pure White', value: '#FFFFFF' },
]

export function ColorPalettePanel({
  selectedElement,
  template,
  onUpdateElement,
  onClose,
  className = '',
}: ColorPalettePanelProps) {
  const currentColor = selectedElement?.color || '#000000'

  // Extract all distinct colors currently used in the template elements
  const documentColors = useMemo(() => {
    const colors = new Set<string>()
    template.elements.forEach((el) => {
      if (el.color) {
        colors.add(el.color.toLowerCase())
      }
    })
    return Array.from(colors)
  }, [template.elements])

  const handleApplyColor = (color: string) => {
    if (!selectedElement) return
    onUpdateElement(selectedElement.id, { color })
  }

  return (
    <div
      className={`w-full bg-card text-card-foreground rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col font-sans select-none ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <span>Text Color</span>
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-md p-1 hover:bg-muted transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[78vh]">
        {selectedElement ? (
          <>
            {/* Custom Color Input & Picker */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground block">Custom Color</span>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background shadow-sm">
                <div className="relative w-9 h-9 rounded-md border border-border overflow-hidden shrink-0 shadow-inner">
                  <input
                    type="color"
                    value={currentColor.startsWith('#') ? currentColor : '#000000'}
                    onChange={(e) => handleApplyColor(e.target.value)}
                    className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-0 p-0 bg-transparent"
                    title="Choose Custom Color"
                  />
                  <div
                    className="w-full h-full pointer-events-none"
                    style={{ backgroundColor: currentColor }}
                  />
                </div>
                <div className="flex-1 flex items-center border border-border rounded-md px-2.5 py-1.5 bg-muted/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                  <input
                    type="text"
                    value={currentColor}
                    onChange={(e) => handleApplyColor(e.target.value)}
                    placeholder="#000000"
                    className="w-full bg-transparent text-xs font-semibold text-foreground uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Document Colors (Colors already in use on this certificate) */}
            {documentColors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>Document Colors</span>
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {documentColors.map((col) => {
                    const isSelected = currentColor.toLowerCase() === col.toLowerCase()
                    return (
                      <button
                        key={`doc-${col}`}
                        type="button"
                        onClick={() => handleApplyColor(col)}
                        className={`group relative h-8 w-8 rounded-lg border transition-all duration-150 flex items-center justify-center shadow-sm hover:scale-105 ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/40 ring-offset-1'
                            : 'border-border/80 hover:border-foreground/40'
                        }`}
                        style={{ backgroundColor: col }}
                        title={`Apply ${col}`}
                      >
                        {isSelected && (
                          <Check
                            className={`h-4 w-4 ${
                              col.toLowerCase() === '#ffffff' || col.toLowerCase() === '#fff'
                                ? 'text-black'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Brand & Theme Colors (from design.md) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Design Tokens</span>
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {BRAND_COLORS.map((item) => {
                  const isSelected = currentColor.toLowerCase() === item.value.toLowerCase()
                  return (
                    <button
                      key={`brand-${item.value}`}
                      type="button"
                      onClick={() => handleApplyColor(item.value)}
                      className={`group relative h-8 rounded-lg border transition-all duration-150 flex items-center justify-center shadow-sm hover:scale-105 ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 ring-offset-1'
                          : 'border-border/80 hover:border-foreground/40'
                      }`}
                      style={{ backgroundColor: item.value }}
                      title={`${item.name} (${item.value})`}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Classic Certificate & Metallic Colors */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground block">Classic Certificate Colors</span>
              <div className="grid grid-cols-5 gap-2">
                {CLASSIC_CERTIFICATE_COLORS.map((item) => {
                  const isSelected = currentColor.toLowerCase() === item.value.toLowerCase()
                  const isLight = item.value.toLowerCase() === '#ffffff'
                  return (
                    <button
                      key={`cert-${item.value}`}
                      type="button"
                      onClick={() => handleApplyColor(item.value)}
                      className={`group relative h-8 rounded-lg border transition-all duration-150 flex items-center justify-center shadow-sm hover:scale-105 ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 ring-offset-1'
                          : 'border-border/80 hover:border-foreground/40'
                      }`}
                      style={{ backgroundColor: item.value }}
                      title={`${item.name} (${item.value})`}
                    >
                      {isSelected && (
                        <Check className={`h-4 w-4 ${isLight ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Default Preset Colors */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground block">Standard Palette</span>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_COLORS.map((col) => {
                  const isSelected = currentColor.toLowerCase() === col.toLowerCase()
                  const isLight = col.toLowerCase() === '#ffffff'
                  return (
                    <button
                      key={`preset-${col}`}
                      type="button"
                      onClick={() => handleApplyColor(col)}
                      className={`group relative h-7 rounded-md border transition-all duration-150 flex items-center justify-center shadow-sm hover:scale-105 ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 ring-offset-1'
                          : 'border-border/80 hover:border-foreground/40'
                      }`}
                      style={{ backgroundColor: col }}
                      title={`Apply ${col}`}
                    >
                      {isSelected && (
                        <Check className={`h-3.5 w-3.5 ${isLight ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-xs">
            Select a text element on the canvas to customize its color and palette.
          </div>
        )}
      </div>
    </div>
  )
}
