'use client'

import React, { useState } from 'react'
import {
  Keyboard,
  Palette,
  SlidersHorizontal,
  Move,
  Layers,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Check,
  QrCode,
  ImageIcon,
  LayoutTemplate,
  Plus,
  Sparkles,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  User,
  Calendar,
  Building2,
  Award,
  Hash,
  Mail,
  Minus,
  X,
  Type,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TemplateElement,
  TemplateConfig,
  FONT_FAMILIES,
  PRESET_COLORS,
} from './types'
import { MobilePositionSheet } from './MobilePositionSheet'
import { MobileLayersSheet } from './MobileLayersSheet'
import { MobileAssetSheet } from './MobileAssetSheet'

interface DesignerMobileBarProps {
  selectedElement: TemplateElement | null
  template: TemplateConfig
  onSelectElement: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void
  onDuplicateElement: (id: string) => void
  onDeleteElement: (id: string) => void
  onMoveLayer: (id: string, direction: 'front' | 'back' | 'up' | 'down') => void
  onReorderElements?: (draggedId: string, targetId: string) => void
  onAddText: (field: TemplateElement['field'], defaultText: string, fontSize?: number) => void
  onAddQRCode: () => void
  onAddImage?: (src: string, publicId?: string) => void
  onOpenAssetLibrary?: () => void
  onOpenSidebar?: () => void
  onSetAsBackground?: (src: string, publicId?: string) => void
  mobileEditModalOpen: boolean
  setMobileEditModalOpen: (open: boolean) => void
}

/**
 * Custom Mobile Bottom Sheet Modal with smooth bottom slide-up animation and auto-height hugging.
 */
function MobileDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
      />
      {/* Slide-up Container hugging its content height */}
      <div className="relative w-full max-h-[85vh] bg-card text-card-foreground rounded-t-3xl border-t border-border shadow-2xl z-10 animate-in slide-in-from-bottom duration-250 ease-out overflow-hidden flex flex-col transition-[height] duration-200">
        {children}
      </div>
    </div>
  )
}

export function DesignerMobileBar({
  selectedElement,
  template,
  onSelectElement,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onMoveLayer,
  onReorderElements,
  onAddText,
  onAddQRCode,
  onAddImage,
  onOpenAssetLibrary,
  onSetAsBackground,
  mobileEditModalOpen,
  setMobileEditModalOpen,
}: DesignerMobileBarProps) {
  const [positionSheetOpen, setPositionSheetOpen] = useState(false)
  const [positionInitialTab, setPositionInitialTab] = useState<'arrange' | 'align' | 'rotate' | 'advanced'>('arrange')
  const [nudgeSheetOpen, setNudgeSheetOpen] = useState(false)
  const [layersSheetOpen, setLayersSheetOpen] = useState(false)
  const [assetsSheetOpen, setAssetsSheetOpen] = useState(false)
  const [colorSheetOpen, setColorSheetOpen] = useState(false)
  const [fontSheetOpen, setFontSheetOpen] = useState(false)
  const [styleSheetOpen, setStyleSheetOpen] = useState(false)
  const [addElementsModalOpen, setAddElementsModalOpen] = useState(false)

  // Nudge step multiplier state
  const [nudgeStep, setNudgeStep] = useState<number>(5)

  // Staging state for Font & Color & Style edits applied on Check click
  const [pendingColor, setPendingColor] = useState<string>('')
  const [pendingFont, setPendingFont] = useState<string>('')
  const [pendingFontSize, setPendingFontSize] = useState<number>(20)
  const [pendingBold, setPendingBold] = useState<boolean>(false)
  const [pendingItalic, setPendingItalic] = useState<boolean>(false)
  const [pendingUnderline, setPendingUnderline] = useState<boolean>(false)
  const [pendingAlign, setPendingAlign] = useState<'left' | 'center' | 'right'>('center')

  // Open Color Sheet with current element values
  const openColorSheet = () => {
    if (selectedElement) {
      setPendingColor(selectedElement.color || '#000000')
      setColorSheetOpen(true)
    }
  }

  // Confirm Color
  const handleConfirmColor = (colorToApply?: string) => {
    if (selectedElement) {
      const col = colorToApply || pendingColor || '#000000'
      onUpdateElement(selectedElement.id, { color: col })
    }
    setColorSheetOpen(false)
  }

  // Open Font Sheet
  const openFontSheet = () => {
    if (selectedElement) {
      setPendingFont(selectedElement.fontFamily || 'Arial')
      setFontSheetOpen(true)
    }
  }

  // Confirm Font
  const handleConfirmFont = (fontToApply?: string) => {
    if (selectedElement) {
      const font = fontToApply || pendingFont || 'Arial'
      onUpdateElement(selectedElement.id, { fontFamily: font })
    }
    setFontSheetOpen(false)
  }

  // Open Style Sheet
  const openStyleSheet = () => {
    if (selectedElement) {
      setPendingFontSize(selectedElement.fontSize || 20)
      setPendingBold(!!selectedElement.isBold)
      setPendingItalic(!!selectedElement.isItalic)
      setPendingUnderline(!!selectedElement.isUnderline)
      setPendingAlign((selectedElement.textAlign as 'left' | 'center' | 'right') || 'center')
      setStyleSheetOpen(true)
    }
  }

  // Confirm Style
  const handleConfirmStyle = () => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, {
        fontSize: pendingFontSize,
        isBold: pendingBold,
        isItalic: pendingItalic,
        isUnderline: pendingUnderline,
        textAlign: pendingAlign,
      })
    }
    setStyleSheetOpen(false)
  }

  // Direct Nudge Handler
  const handleNudge = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedElement) return
    const currentX = selectedElement.x || 0
    const currentY = selectedElement.y || 0

    switch (direction) {
      case 'up':
        onUpdateElement(selectedElement.id, { y: Math.max(0, currentY - nudgeStep) })
        break
      case 'down':
        onUpdateElement(selectedElement.id, { y: Math.min(template.height - 20, currentY + nudgeStep) })
        break
      case 'left':
        onUpdateElement(selectedElement.id, { x: Math.max(0, currentX - nudgeStep) })
        break
      case 'right':
        onUpdateElement(selectedElement.id, { x: Math.min(template.width - 20, currentX + nudgeStep) })
        break
    }
  }

  return (
    <>
      {/* Bottom Sticky Mobile Dock */}
      <div className="md:hidden sticky bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-md z-30 shrink-0 shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))] select-none">
        {selectedElement ? (
          /* Canva-style Contextual Element Dock */
          <div className="flex items-center justify-between px-2 py-1.5 bg-card">
            <div className="flex items-center gap-1.5 overflow-x-auto pr-2 no-scrollbar">
              {/* 1. Edit Button (Keyboard icon) */}
              {selectedElement.type === 'text' && (
                <button
                  type="button"
                  onClick={() => setMobileEditModalOpen(true)}
                  className="flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-xl text-foreground hover:bg-muted/80 active:scale-95 transition shrink-0"
                >
                  <Keyboard className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-medium leading-tight">Edit</span>
                </button>
              )}

              {/* 2. Color Button (Palette / Ring Icon) */}
              {selectedElement.type === 'text' && (
                <button
                  type="button"
                  onClick={openColorSheet}
                  className="flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl text-foreground hover:bg-muted/80 active:scale-95 transition shrink-0"
                >
                  <div className="relative flex items-center justify-center h-5 w-5 mb-0.5">
                    <span
                      className="h-4 w-4 rounded-full border border-border shadow-xs"
                      style={{ backgroundColor: selectedElement.color || 'hsl(var(--foreground))' }}
                    />
                  </div>
                  <span className="text-[10px] font-medium leading-tight">Color</span>
                </button>
              )}

              {/* 3. Style Button (3 horizontal lines) */}
              {selectedElement.type === 'text' && (
                <button
                  type="button"
                  onClick={openStyleSheet}
                  className="flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-xl text-foreground hover:bg-muted/80 active:scale-95 transition shrink-0"
                >
                  <SlidersHorizontal className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-medium leading-tight">Style</span>
                </button>
              )}

              {/* 4. Font Family Button (Ff Icon) */}
              {selectedElement.type === 'text' && (
                <button
                  type="button"
                  onClick={openFontSheet}
                  className="flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-xl text-foreground hover:bg-muted/80 active:scale-95 transition shrink-0"
                >
                  <span className="text-sm font-serif font-bold italic leading-none h-5 flex items-center justify-center mb-0.5">
                    Ff
                  </span>
                  <span className="text-[10px] font-medium leading-tight">Font</span>
                </button>
              )}


              {/* 6. Nudge Control Button (D-Pad Navigation) */}
              <button
                type="button"
                onClick={() => setNudgeSheetOpen(true)}
                className="flex flex-col items-center justify-center min-w-[52px] py-1 px-1 rounded-xl text-foreground hover:bg-muted/80 active:scale-95 transition shrink-0"
              >
                <Crosshair className="h-5 w-5 mb-0.5 text-foreground" />
                <span className="text-[10px] font-medium leading-tight">Nudge</span>
              </button>

              {/* Set as Background for Image */}
              {selectedElement.type === 'image' && selectedElement.src && onSetAsBackground && (
                <button
                  type="button"
                  onClick={() => onSetAsBackground(selectedElement.src!, selectedElement.imagePublicId)}
                  className="flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl text-foreground hover:bg-muted/80 active:scale-95 transition shrink-0"
                >
                  <LayoutTemplate className="h-5 w-5 mb-0.5 text-primary" />
                  <span className="text-[10px] font-medium leading-tight">Set BG</span>
                </button>
              )}

              {/* 7. Position Button */}
              <button
                type="button"
                onClick={() => {
                  setPositionInitialTab('arrange')
                  setPositionSheetOpen(true)
                }}
                className="flex flex-col items-center justify-center min-w-[52px] py-1 px-1 rounded-xl text-foreground hover:bg-muted/80 active:scale-95 transition shrink-0"
              >
                <Move className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-medium leading-tight">Position</span>
              </button>

              {/* 7. Layers Button */}
              <button
                type="button"
                onClick={() => setLayersSheetOpen(true)}
                className="flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-xl text-foreground hover:bg-muted/80 active:scale-95 transition shrink-0"
              >
                <Layers className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-medium leading-tight">Layers</span>
              </button>

              {/* 8. Lock / Unlock */}
              <button
                type="button"
                onClick={() => onUpdateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })}
                className={`flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-xl active:scale-95 transition shrink-0 ${selectedElement.isLocked
                    ? 'text-amber-600 bg-amber-500/10'
                    : 'text-foreground hover:bg-muted/80'
                  }`}
              >
                {selectedElement.isLocked ? (
                  <Lock className="h-5 w-5 mb-0.5 text-amber-600" />
                ) : (
                  <Unlock className="h-5 w-5 mb-0.5" />
                )}
                <span className="text-[10px] font-medium leading-tight">
                  {selectedElement.isLocked ? 'Unlock' : 'Lock'}
                </span>
              </button>

              {/* 9. Duplicate */}
              <button
                type="button"
                onClick={() => onDuplicateElement(selectedElement.id)}
                className="flex flex-col items-center justify-center min-w-[54px] py-1 px-1 rounded-xl text-foreground hover:bg-muted/80 active:scale-95 transition shrink-0"
              >
                <Copy className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-medium leading-tight">Duplicate</span>
              </button>

              {/* 10. Delete */}
              <button
                type="button"
                onClick={() => onDeleteElement(selectedElement.id)}
                className="flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition shrink-0"
              >
                <Trash2 className="h-5 w-5 mb-0.5 text-red-500" />
                <span className="text-[10px] font-medium leading-tight text-red-500">Delete</span>
              </button>
            </div>

            {/* Circular Done / Deselect Checkmark Button */}
            <div className="pl-2 border-l border-border shrink-0">
              <button
                type="button"
                onClick={() => onSelectElement(null)}
                className="h-9 w-9 rounded-full border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center shadow-xs transition active:scale-95"
                title="Deselect element"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          /* General Mobile Quick Add Dock */
          <div className="flex items-center justify-around px-2 py-1 bg-card">
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-1 px-3 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => setAddElementsModalOpen(true)}
            >
              <Type className="h-5 w-5 text-foreground" />
              <span className="font-bold text-foreground">Add Text</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-1 px-3 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={onAddQRCode}
            >
              <QrCode className="h-5 w-5 text-foreground" />
              <span className="font-bold text-foreground">QR</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-1 px-3 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => setAssetsSheetOpen(true)}
            >
              <ImageIcon className="h-5 w-5 text-foreground" />
              <span className="font-bold text-foreground">Asset</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-1 px-3 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => setLayersSheetOpen(true)}
            >
              <Layers className="h-5 w-5 text-foreground" />
              <span className="font-bold text-foreground">Layers</span>
            </Button>
          </div>
        )}
      </div>

      {/* 1. Nudge Modal Sheet (Slide up from bottom with 4-Way D-Pad) */}
      {selectedElement && (
        <MobileDrawer open={nudgeSheetOpen} onClose={() => setNudgeSheetOpen(false)}>
          <div className="p-3.5 space-y-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">

            {/* 4-Way D-Pad Directional Controller */}
            <div className="w-full flex items-center justify-center py-2 gap-2">
              {/* Left Button */}
              <button
                type="button"
                onClick={() => handleNudge('left')}
                className="rounded-sm w-full py-2 bg-muted/70 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground active:scale-90 active:bg-primary/20 flex items-center justify-center shadow-xs transition-all"
                title="Nudge Left"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
                       {/* Up Button */}
              <button
                type="button"
                onClick={() => handleNudge('up')}
                className="rounded-sm w-full py-2 bg-muted/70 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground active:scale-90 active:bg-primary/20 flex items-center justify-center shadow-xs transition-all"
                title="Nudge Up"
              >
                <ArrowUp className="h-5 w-5 text-foreground" />
              </button>

              {/* Down Button */}
              <button
                type="button"
                onClick={() => handleNudge('down')}
                className="rounded-sm w-full py-2 bg-muted/70 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground active:scale-90 active:bg-primary/20 flex items-center justify-center shadow-xs transition-all"
                title="Nudge Down"
              >
                <ArrowDown className="h-5 w-5 text-foreground" />
              </button>

              {/* Right Button */}
              <button
                type="button"
                onClick={() => handleNudge('right')}
                className="rounded-sm w-full py-2 bg-muted/70 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground active:scale-90 active:bg-primary/20 flex items-center justify-center shadow-xs transition-all"
                title="Nudge Right"
              >
                <ArrowRight className="h-5 w-5 text-foreground" />
              </button>
            </div>
          </div>
        </MobileDrawer>
      )}

      {/* 2. Assets Sheet (Slide up from bottom) */}
      <MobileDrawer open={assetsSheetOpen} onClose={() => setAssetsSheetOpen(false)}>
        <MobileAssetSheet
          onAddImage={(src, publicId) => {
            if (onAddImage) {
              onAddImage(src, publicId)
            }
            setAssetsSheetOpen(false)
          }}
          onSetAsBackground={(src, publicId) => {
            if (onSetAsBackground) {
              onSetAsBackground(src, publicId)
            }
            setAssetsSheetOpen(false)
          }}
          onClose={() => setAssetsSheetOpen(false)}
        />
      </MobileDrawer>

      {/* 3. Position Sheet (Slide up from bottom) */}
      <MobileDrawer open={positionSheetOpen} onClose={() => setPositionSheetOpen(false)}>
        <MobilePositionSheet
          key={`${positionInitialTab}-${positionSheetOpen}`}
          initialTab={positionInitialTab}
          selectedElement={selectedElement}
          template={template}
          onUpdateElement={onUpdateElement}
          onMoveLayer={onMoveLayer}
          onClose={() => setPositionSheetOpen(false)}
        />
      </MobileDrawer>

      {/* 4. Layers Sheet (Slide up from bottom) */}
      <MobileDrawer open={layersSheetOpen} onClose={() => setLayersSheetOpen(false)}>
        <MobileLayersSheet
          selectedElement={selectedElement}
          template={template}
          onSelectElement={onSelectElement}
          onUpdateElement={onUpdateElement}
          onMoveLayer={onMoveLayer}
          onDeleteElement={onDeleteElement}
          onClose={() => setLayersSheetOpen(false)}
        />
      </MobileDrawer>

      {/* 5. Color Picker Bottom Sheet with Checkmark Confirmation */}
      {selectedElement && selectedElement.type === 'text' && (
        <MobileDrawer open={colorSheetOpen} onClose={() => setColorSheetOpen(false)}>
          <div className="p-3.5 space-y-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {/* Drag Handle & Header */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-1 shrink-0" />
            <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
              <div className="w-8" />
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Text Color</h3>
              <button
                type="button"
                onClick={() => handleConfirmColor()}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-foreground transition-colors active:scale-95"
                title="Apply & Close"
              >
                <Check className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Custom Color Picker Input */}
            <div className="flex items-center gap-2.5 bg-muted/40 p-2 rounded-sm border border-border">
              <input
                type="color"
                value={pendingColor || '#000000'}
                onChange={(e) => {
                  setPendingColor(e.target.value)
                  onUpdateElement(selectedElement.id, { color: e.target.value })
                }}
                className="w-9 h-9 rounded-sm border border-border cursor-pointer bg-transparent shrink-0"
              />
              <div className="flex-1">
                <Input
                  type="text"
                  value={pendingColor || '#000000'}
                  onChange={(e) => {
                    setPendingColor(e.target.value)
                    onUpdateElement(selectedElement.id, { color: e.target.value })
                  }}
                  className="h-7 text-xs bg-background mt-0.5 uppercase rounded-lg"
                />
              </div>
            </div>
          </div>
        </MobileDrawer>
      )}

      {/* 6. Font Typography Sheet with Checkmark Confirmation */}
      {selectedElement && selectedElement.type === 'text' && (
        <MobileDrawer open={fontSheetOpen} onClose={() => setFontSheetOpen(false)}>
          <div className="p-3.5 border-b border-border/40 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-1.5" />
            <div className="flex items-center justify-between">
              <div className="w-8" />
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Font Family</h3>
              <button
                type="button"
                onClick={() => handleConfirmFont()}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-foreground transition-colors active:scale-95"
                title="Apply & Close"
              >
                <Check className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto p-3.5 space-y-1.5 max-h-[50vh] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {FONT_FAMILIES.map((font) => {
              const isSelected = (pendingFont || selectedElement.fontFamily) === font
              return (
                <button
                  key={font}
                  type="button"
                  onClick={() => {
                    setPendingFont(font)
                    onUpdateElement(selectedElement.id, { fontFamily: font })
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-sm border text-left transition ${isSelected
                      ? 'border-2 border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  style={{ fontFamily: font }}
                >
                  <span className="text-xs">{font}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </MobileDrawer>
      )}

      {/* 7. Style Bottom Sheet (Size, Bold, Italic, Align) with Checkmark Confirmation */}
      {selectedElement && selectedElement.type === 'text' && (
        <MobileDrawer open={styleSheetOpen} onClose={() => setStyleSheetOpen(false)}>
          <div className="p-3.5 space-y-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-1 shrink-0" />
            <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
              <div className="w-8" />
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Style & Formatting</h3>
              <button
                type="button"
                onClick={handleConfirmStyle}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-foreground transition-colors active:scale-95"
                title="Apply & Close"
              >
                <Check className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Font Size Stepper */}
            <div>
              <Label className="text-[11px] font-semibold block mb-1">Font Size</Label>
              <div className="flex items-center justify-between bg-muted/40 p-1.5 rounded-sm border border-border">
                <button
                  type="button"
                  onClick={() => {
                    const nextSize = Math.max(8, pendingFontSize - 1)
                    setPendingFontSize(nextSize)
                    onUpdateElement(selectedElement.id, { fontSize: nextSize })
                  }}
                  className="h-8 w-8 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-muted active:scale-95"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-bold text-foreground">{pendingFontSize} px</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextSize = Math.min(140, pendingFontSize + 1)
                    setPendingFontSize(nextSize)
                    onUpdateElement(selectedElement.id, { fontSize: nextSize })
                  }}
                  className="h-8 w-8 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-muted active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Formatting Toggles */}
            <div>
              <Label className="text-[11px] font-semibold block mb-1">Format</Label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = !pendingBold
                    setPendingBold(next)
                    onUpdateElement(selectedElement.id, { isBold: next })
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-sm border text-xs font-semibold transition ${pendingBold
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                    }`}
                >
                  <Bold className="h-3.5 w-3.5" /> Bold
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !pendingItalic
                    setPendingItalic(next)
                    onUpdateElement(selectedElement.id, { isItalic: next })
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-sm border text-xs font-semibold transition ${pendingItalic
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                    }`}
                >
                  <Italic className="h-3.5 w-3.5" /> Italic
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !pendingUnderline
                    setPendingUnderline(next)
                    onUpdateElement(selectedElement.id, { isUnderline: next })
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-sm border text-xs font-semibold transition ${pendingUnderline
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                    }`}
                >
                  <Underline className="h-3.5 w-3.5" /> Underline
                </button>
              </div>
            </div>

            {/* Alignment */}
            <div>
              <Label className="text-[11px] font-semibold block mb-1">Alignment</Label>
              <div className="flex bg-muted/40 p-1 rounded-sm border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setPendingAlign('left')
                    onUpdateElement(selectedElement.id, { textAlign: 'left' })
                  }}
                  className={`flex-1 py-1.5 rounded-sm text-xs flex items-center justify-center font-medium transition ${pendingAlign === 'left'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <AlignLeft className="h-3.5 w-3.5 mr-1" /> Left
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingAlign('center')
                    onUpdateElement(selectedElement.id, { textAlign: 'center' })
                  }}
                  className={`flex-1 py-1.5 rounded-sm text-xs flex items-center justify-center font-medium transition ${pendingAlign === 'center'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <AlignCenter className="h-3.5 w-3.5 mr-1" /> Center
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingAlign('right')
                    onUpdateElement(selectedElement.id, { textAlign: 'right' })
                  }}
                  className={`flex-1 py-1.5 rounded-sm text-xs flex items-center justify-center font-medium transition ${pendingAlign === 'right'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <AlignRight className="h-3.5 w-3.5 mr-1" /> Right
                </button>
              </div>
            </div>
          </div>
        </MobileDrawer>
      )}

      {/* 8. Mobile Add Elements Sheet (Slide up from bottom) */}
      <MobileDrawer open={addElementsModalOpen} onClose={() => setAddElementsModalOpen(false)}>
        <div className="p-3.5 border-b border-border/40 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-1.5" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
              Add Certificate Elements
            </h3>
            <button
              type="button"
              onClick={() => setAddElementsModalOpen(false)}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto space-y-3 p-3.5 max-h-[65vh] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* Dynamic Participant Fields */}
          <div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                className="w-full flex items-center gap-2.5 py-2 px-3 text-xs bg-background hover:bg-primary/5 border border-border hover:border-primary/40 rounded-sm text-left transition"
                onClick={() => {
                  onAddText('name', 'Participant Name', 28)
                  setAddElementsModalOpen(false)
                }}
              >
                <User className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold leading-none text-foreground py-2">Participant Name</span>
                </div>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2.5 py-2 px-3 text-xs bg-background hover:bg-primary/5 border border-border hover:border-primary/40 rounded-sm text-left transition"
                onClick={() => {
                  onAddText('registrationNumber', 'REG-12345', 14)
                  setAddElementsModalOpen(false)
                }}
              >
                <Hash className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold leading-none text-foreground py-2">Registration / Roll No</span>
                </div>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2.5 py-2 px-3 text-xs bg-background hover:bg-primary/5 border border-border hover:border-primary/40 rounded-sm text-left transition"
                onClick={() => {
                  onAddText('collegeName', 'College / University Name', 16)
                  setAddElementsModalOpen(false)
                }}
              >
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold leading-none text-foreground py-2">College / Institute Name</span>
                </div>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2.5 py-2 px-3 text-xs bg-background hover:bg-primary/5 border border-border hover:border-primary/40 rounded-sm text-left transition"
                onClick={() => {
                  onAddText('event', 'Event Name', 20)
                  setAddElementsModalOpen(false)
                }}
              >
                <Award className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold leading-none text-foreground py-2">Event Name</span>
                </div>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2.5 py-2 px-3 text-xs bg-background hover:bg-primary/5 border border-border hover:border-primary/40 rounded-sm text-left transition"
                onClick={() => {
                  onAddText('position', 'Winner / 1st Place', 18)
                  setAddElementsModalOpen(false)
                }}
              >
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold leading-none text-foreground py-2">Position / Achievement</span>
                </div>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2.5 py-2 px-3 text-xs bg-background hover:bg-primary/5 border border-border hover:border-primary/40 rounded-sm text-left transition"
                onClick={() => {
                  onAddText('date', 'Date of Issue', 14)
                  setAddElementsModalOpen(false)
                }}
              >
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold leading-none text-foreground py-2">Issue Date</span>
                </div>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2.5 py-2 px-3 text-xs bg-background hover:bg-primary/5 border border-border hover:border-primary/40 rounded-sm text-left transition"
                onClick={() => {
                  onAddText('certificateId', 'CERT-XXXX-XXXX', 12)
                  setAddElementsModalOpen(false)
                }}
              >
                <Hash className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold leading-none text-foreground py-2">Certificate ID</span>
                </div>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2.5 py-2 px-3 text-xs bg-background hover:bg-primary/5 border border-border hover:border-primary/40 rounded-sm text-left transition"
                onClick={() => {
                  onAddText('email', 'participant@example.com', 12)
                  setAddElementsModalOpen(false)
                }}
              >
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold leading-none text-foreground py-2">Participant Email</span>
                </div>
              </button>
            </div>
          </div>

          <Separator />

          {/* Static Titles & Custom Text */}
          <div>
            <span className="text-xs font-semibold text-foreground block mb-1">Custom Titles & Headings</span>
            <div className="space-y-1.5">
              <button
                type="button"
                className="w-full flex items-center gap-2 py-4 px-3 text-xs font-bold bg-muted hover:bg-muted/80 rounded-sm text-left transition"
                onClick={() => {
                  onAddText('custom', 'CERTIFICATE OF APPRECIATION', 24)
                  setAddElementsModalOpen(false)
                }}
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>Main Title Heading</span>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2 py-4 px-3 text-xs bg-background hover:bg-muted border border-border rounded-sm text-left transition"
                onClick={() => {
                  onAddText('custom', 'is hereby awarded to', 15)
                  setAddElementsModalOpen(false)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Subtitle / Award Citation</span>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2 py-4 px-3 text-xs text-muted-foreground bg-background hover:bg-muted border border-border rounded-sm text-left transition"
                onClick={() => {
                  onAddText('custom', 'for their outstanding contribution and dedication.', 13)
                  setAddElementsModalOpen(false)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Description Paragraph</span>
              </button>
            </div>
          </div>
        </div>
      </MobileDrawer>

      {/* 9. Mobile Text Edit Modal Sheet (Slide up from bottom) */}
      {selectedElement && selectedElement.type === 'text' && (
        <MobileDrawer open={mobileEditModalOpen} onClose={() => setMobileEditModalOpen(false)}>
          <div className="p-3.5 border-b border-border/40 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-1.5" />
            <div className="flex items-center justify-between">
              <div className="w-8" />
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Edit Text</h3>
              <button
                type="button"
                onClick={() => setMobileEditModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-foreground transition-colors active:scale-95"
                title="Done"
              >
                <Check className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          <div className="p-3.5 space-y-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {/* Dynamic Field Binding */}
            <div>
              <Label className="text-[11px] font-semibold">Dynamic Field Binding</Label>
              <Select
                value={selectedElement.field || 'custom'}
                onValueChange={(val) =>
                  onUpdateElement(selectedElement.id, { field: val as TemplateElement['field'] })
                }
              >
                <SelectTrigger className="mt-1 text-xs h-8.5 bg-primary/5 border-primary/30 text-primary font-medium rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom" className="text-xs">Static Custom Text</SelectItem>
                  <SelectItem value="name" className="text-xs font-semibold">Participant Name</SelectItem>
                  <SelectItem value="registrationNumber" className="text-xs">Registration / Roll No</SelectItem>
                  <SelectItem value="collegeName" className="text-xs">College / University Name</SelectItem>
                  <SelectItem value="event" className="text-xs">Event Name</SelectItem>
                  <SelectItem value="position" className="text-xs">Position / Award</SelectItem>
                  <SelectItem value="date" className="text-xs">Issue Date</SelectItem>
                  <SelectItem value="certificateId" className="text-xs">Certificate ID</SelectItem>
                  <SelectItem value="email" className="text-xs">Participant Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] font-semibold">Text Content</Label>
              <Input
                value={selectedElement.content || ''}
                onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                placeholder="Enter certificate text..."
                className="mt-1 text-xs rounded-sm"
              />
            </div>

            {/* Quick Actions to Nudge, Position & Color */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="justify-center gap-1.5 py-4 text-xs font-semibold rounded-sm"
                onClick={() => {
                  setMobileEditModalOpen(false)
                  setNudgeSheetOpen(true)
                }}
              >
                <Crosshair className="h-3.5 w-3.5 text-foreground" />
                <span>Nudge</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-center gap-1.5 h-8.5 text-xs font-semibold rounded-sm"
                onClick={() => {
                  setMobileEditModalOpen(false)
                  setPositionSheetOpen(true)
                }}
              >
                <Move className="h-3.5 w-3.5 text-foreground" />
                <span>Position</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-center gap-1.5 h-8.5 text-xs font-semibold rounded-sm"
                onClick={() => {
                  setMobileEditModalOpen(false)
                  openColorSheet()
                }}
              >
                <Palette className="h-3.5 w-3.5 text-foreground" />
                <span>Color</span>
              </Button>
            </div>
          </div>
        </MobileDrawer>
      )}
    </>
  )
}
