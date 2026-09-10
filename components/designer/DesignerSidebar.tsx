'use client'

import React, { useState } from 'react'
import {
  LayoutTemplate,
  Sparkles,
  Type,
  Upload,
  Layers,
  X,
  Plus,
  QrCode,
  Image as ImageIcon,
  User,
  Calendar,
  Building2,
  Award,
  Hash,
  Trash2,
  Lock,
  Unlock,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Mail,
  Sliders,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  TemplateElement,
  TemplateConfig,
} from './types'
import { PositionPanel } from './PositionPanel'
import { ColorPalettePanel } from './ColorPalettePanel'

export type SidebarTab =
  | 'templates'
  | 'elements'
  | 'text'
  | 'uploads'
  | 'layers'
  | 'position'
  | 'color'
  | null

interface DesignerSidebarProps {
  activeTab: SidebarTab
  setActiveTab: (tab: SidebarTab) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  template: TemplateConfig
  selectedElement?: TemplateElement | null
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  onAddText: (field: TemplateElement['field'], defaultText: string, fontSize?: number) => void
  onAddQRCode: () => void
  onAddImage: (src: string, publicId?: string) => void
  onUpdateTemplate: (updates: Partial<TemplateConfig>) => void
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void
  onDeleteElement: (id: string) => void
  onMoveLayer: (id: string, direction: 'front' | 'back' | 'up' | 'down') => void
  onReorderElements?: (draggedId: string, targetId: string) => void
  onOpenAssetLibrary: () => void
  onUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadingBackground: boolean
}

export function DesignerSidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  template,
  selectedElement,
  selectedId,
  setSelectedId,
  onAddText,
  onAddQRCode,
  onUpdateTemplate,
  onUpdateElement,
  onDeleteElement,
  onMoveLayer,
  onReorderElements,
  onOpenAssetLibrary,
  onUploadBackground,
  uploadingBackground,
}: DesignerSidebarProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  return (
    <>
      {/* Desktop Left Side Icon Navigation Dock */}
      <nav className="hidden md:flex w-16 border-r border-border bg-card flex-col items-center py-3 gap-1 shrink-0 z-10 shadow-sm select-none">
        <button
          onClick={() => {
            if (sidebarOpen && activeTab === 'templates') {
              setSidebarOpen(false)
            } else {
              setActiveTab('templates')
              setSidebarOpen(true)
            }
          }}
          className={`w-12 py-2 flex flex-col items-center justify-center rounded-lg transition-colors gap-1 text-[10px] font-medium ${
            sidebarOpen && activeTab === 'templates'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
          title="Templates & Canvas"
        >
          <LayoutTemplate className="h-4 w-4" />
          <span>Canvas</span>
        </button>

        <button
          onClick={() => {
            if (sidebarOpen && activeTab === 'elements') {
              setSidebarOpen(false)
            } else {
              setActiveTab('elements')
              setSidebarOpen(true)
            }
          }}
          className={`w-12 py-2 flex flex-col items-center justify-center rounded-lg transition-colors gap-1 text-[10px] font-medium ${
            sidebarOpen && activeTab === 'elements'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
          title="Elements"
        >
          <Sparkles className="h-4 w-4" />
          <span>Elements</span>
        </button>

        <button
          onClick={() => {
            if (sidebarOpen && activeTab === 'text') {
              setSidebarOpen(false)
            } else {
              setActiveTab('text')
              setSidebarOpen(true)
            }
          }}
          className={`w-12 py-2 flex flex-col items-center justify-center rounded-lg transition-colors gap-1 text-[10px] font-medium ${
            sidebarOpen && activeTab === 'text'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
          title="Add Text"
        >
          <Type className="h-4 w-4" />
          <span>Text</span>
        </button>

        <button
          onClick={() => {
            if (sidebarOpen && activeTab === 'uploads') {
              setSidebarOpen(false)
            } else {
              setActiveTab('uploads')
              setSidebarOpen(true)
            }
          }}
          className={`w-12 py-2 flex flex-col items-center justify-center rounded-lg transition-colors gap-1 text-[10px] font-medium ${
            sidebarOpen && activeTab === 'uploads'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
          title="Uploads & Assets"
        >
          <Upload className="h-4 w-4" />
          <span>Uploads</span>
        </button>

        <button
          onClick={() => {
            if (sidebarOpen && activeTab === 'layers') {
              setSidebarOpen(false)
            } else {
              setActiveTab('layers')
              setSidebarOpen(true)
            }
          }}
          className={`w-12 py-2 flex flex-col items-center justify-center rounded-lg transition-colors gap-1 text-[10px] font-medium ${
            sidebarOpen && activeTab === 'layers'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
          title="Layers"
        >
          <Layers className="h-4 w-4" />
          <span>Layers</span>
        </button>

        <button
          onClick={() => {
            if (sidebarOpen && activeTab === 'position') {
              setSidebarOpen(false)
            } else {
              setActiveTab('position')
              setSidebarOpen(true)
            }
          }}
          className={`w-12 py-2 flex flex-col items-center justify-center rounded-lg transition-colors gap-1 text-[10px] font-medium ${
            sidebarOpen && activeTab === 'position'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
          title="Position & Alignment"
        >
          <Sliders className="h-4 w-4" />
          <span>Position</span>
        </button>
      </nav>

      {/* Slide-out Drawer Panel */}
      {sidebarOpen && activeTab && (
        <aside className="w-80 border-r border-border bg-card flex flex-col shrink-0 z-10 shadow-md">
          {/* 1. POSITION PANEL IN LEFT DRAWER */}
          {activeTab === 'position' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <PositionPanel
                selectedElement={selectedElement || null}
                template={template}
                onUpdateElement={onUpdateElement}
                onMoveLayer={onMoveLayer}
                onSelectElement={setSelectedId}
                onDeleteElement={onDeleteElement}
                onReorderElements={onReorderElements}
                onClose={() => setSidebarOpen(false)}
                className="rounded-none border-0 shadow-none h-full"
              />
            </div>
          ) : activeTab === 'color' ? (
            /* 2. COLOR PALETTE IN LEFT DRAWER */
            <div className="flex-1 flex flex-col overflow-hidden">
              <ColorPalettePanel
                selectedElement={selectedElement || null}
                template={template}
                onUpdateElement={onUpdateElement}
                onClose={() => setSidebarOpen(false)}
                className="rounded-none border-0 shadow-none h-full"
              />
            </div>
          ) : (
            /* 3. OTHER STANDARD SIDEBAR TABS */
            <>
              {/* Drawer Header */}
              <div className="h-10 px-4 border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold capitalize text-foreground flex items-center gap-1.5">
                  {activeTab === 'templates' && <LayoutTemplate className="h-3.5 w-3.5 text-primary" />}
                  {activeTab === 'elements' && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                  {activeTab === 'text' && <Type className="h-3.5 w-3.5 text-primary" />}
                  {activeTab === 'uploads' && <Upload className="h-3.5 w-3.5 text-primary" />}
                  {activeTab === 'layers' && <Layers className="h-3.5 w-3.5 text-primary" />}
                  {activeTab === 'templates' ? 'Canvas & Background' : activeTab}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Drawer Body Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* 1. TEMPLATES & CANVAS SETUP TAB */}
                {activeTab === 'templates' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold">Canvas Dimensions</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">Set standard certificate paper sizes.</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={template.width === 842 && template.height === 595 ? 'secondary' : 'outline'}
                          size="sm"
                          className="text-xs h-9 justify-start"
                          onClick={() => onUpdateTemplate({ width: 842, height: 595 })}
                        >
                          A4 Landscape (842x595)
                        </Button>
                        <Button
                          variant={template.width === 595 && template.height === 842 ? 'secondary' : 'outline'}
                          size="sm"
                          className="text-xs h-9 justify-start"
                          onClick={() => onUpdateTemplate({ width: 595, height: 842 })}
                        >
                          A4 Portrait (595x842)
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-xs font-semibold">Background Image</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">Upload or choose a certificate background.</p>
                      <div className="space-y-2">
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-4 cursor-pointer transition-colors bg-muted/20">
                          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs font-medium">Upload Background</span>
                          <span className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onUploadBackground}
                            disabled={uploadingBackground}
                          />
                        </label>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs gap-1.5 h-8"
                          onClick={onOpenAssetLibrary}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          Choose from Asset Library
                        </Button>

                        {template.backgroundImage && (
                          <div className="pt-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full text-xs h-7"
                              onClick={() =>
                                onUpdateTemplate({
                                  backgroundImage: undefined,
                                  backgroundImagePublicId: undefined,
                                })
                              }
                            >
                              Remove Background
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ELEMENTS TAB */}
                {activeTab === 'elements' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold">Essential Certificate Elements</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">Add verification components.</p>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-9 text-xs"
                          onClick={onAddQRCode}
                        >
                          <QrCode className="h-4 w-4 text-primary" />
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium">Verification QR Code</span>
                            <span className="text-[10px] text-muted-foreground">Dynamic verification scan code</span>
                          </div>
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-xs font-semibold">Graphics & Media</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">Add signatures, badges, and logos.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-9 text-xs"
                        onClick={onOpenAssetLibrary}
                      >
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span>Browse Assets & Badges</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* 3. TEXT PLACEHOLDERS TAB */}
                {activeTab === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold">Dynamic Participant Fields</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">
                        Auto-replaced with participant details during certificate generation.
                      </p>
                      <div className="space-y-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onClick={() => onAddText('name', 'Participant Name', 28)}
                        >
                          <User className="h-3.5 w-3.5 text-primary" />
                          <span>Participant Name</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onClick={() => onAddText('registrationNumber', 'REG-12345', 14)}
                        >
                          <Hash className="h-3.5 w-3.5 text-primary" />
                          <span>Registration / Roll Number</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onClick={() => onAddText('collegeName', 'College / University Name', 16)}
                        >
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          <span>College / Institute Name</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onClick={() => onAddText('event', 'Event Name', 20)}
                        >
                          <Award className="h-3.5 w-3.5 text-primary" />
                          <span>Event Name</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onClick={() => onAddText('position', 'Winner / 1st Place', 18)}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span>Position / Achievement</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onClick={() => onAddText('date', 'Date of Issue', 14)}
                        >
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>Issue Date</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onClick={() => onAddText('certificateId', 'CERT-XXXX-XXXX', 12)}
                        >
                          <Hash className="h-3.5 w-3.5 text-primary" />
                          <span>Certificate ID</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onClick={() => onAddText('email', 'participant@example.com', 12)}
                        >
                          <Mail className="h-3.5 w-3.5 text-primary" />
                          <span>Participant Email</span>
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-xs font-semibold">Custom Text</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">Static titles, descriptions, and labels.</p>
                      <div className="space-y-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full justify-start gap-2 h-9 text-xs font-bold"
                          onClick={() => onAddText('custom', 'CERTIFICATE OF APPRECIATION', 24)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Main Title Heading</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs"
                          onClick={() => onAddText('custom', 'is hereby awarded to', 15)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Subtitle / Award Text</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground"
                          onClick={() => onAddText('custom', 'for their outstanding contribution and dedication.', 13)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Description Paragraph</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. UPLOADS & ASSET LIBRARY TAB */}
                {activeTab === 'uploads' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold">Asset Library</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">
                        Browse uploaded logos, stamps, signatures, and badges.
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs gap-1.5 h-9"
                        onClick={onOpenAssetLibrary}
                      >
                        <ImageIcon className="h-4 w-4" />
                        Open Media Asset Library
                      </Button>
                    </div>
                  </div>
                )}

                {/* 5. LAYERS ORDER & SELECTION TAB */}
                {activeTab === 'layers' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-semibold">Layer Order ({template.elements.length})</Label>
                      <span className="text-[10px] text-muted-foreground">Top = Front</span>
                    </div>

                    {template.elements.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center">No elements on canvas.</p>
                    ) : (
                      <div className="space-y-1">
                        {[...template.elements].reverse().map((el) => {
                          const realIndex = template.elements.findIndex((e) => e.id === el.id)
                          const isTop = realIndex === template.elements.length - 1
                          const isBottom = realIndex === 0

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
                              onClick={() => setSelectedId(el.id)}
                              className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-all ${
                                dragOverId === el.id ? 'border-primary border-2 bg-primary/5' : ''
                              } ${
                                selectedId === el.id
                                  ? 'bg-primary/10 border-primary text-primary font-medium'
                                  : 'border-border bg-background hover:bg-muted/60 text-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <GripVertical className="h-4 w-4 text-muted-foreground/60 cursor-grab shrink-0" />
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
                              </div>

                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  disabled={isTop}
                                  onClick={() => onMoveLayer(el.id, 'up')}
                                  className="p-1 hover:bg-muted text-muted-foreground disabled:opacity-30 rounded"
                                  title="Bring Forward"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  disabled={isBottom}
                                  onClick={() => onMoveLayer(el.id, 'down')}
                                  className="p-1 hover:bg-muted text-muted-foreground disabled:opacity-30 rounded"
                                  title="Send Backward"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => onUpdateElement(el.id, { isLocked: !el.isLocked })}
                                  className={`p-1 hover:bg-muted rounded ${el.isLocked ? 'text-amber-600' : 'text-muted-foreground'}`}
                                  title={el.isLocked ? 'Locked' : 'Unlocked'}
                                >
                                  {el.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                  onClick={() => onDeleteElement(el.id)}
                                  className="p-1 hover:bg-red-50 text-red-600 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      )}
    </>
  )
}
