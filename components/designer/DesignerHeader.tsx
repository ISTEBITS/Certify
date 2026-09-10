'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Loader2,
  Undo2,
  Redo2,
  Eye,
  Copy,
  Grid,
  Check,
  ImageIcon,
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
import { Event } from './types'

interface DesignerHeaderProps {
  events: Event[]
  selectedEvent: string
  setSelectedEvent: (id: string) => void
  templateType: 'participation' | 'achievement'
  setTemplateType: (type: 'participation' | 'achievement') => void
  saveStatus: 'saved' | 'saving' | 'unsaved'
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  showGrid: boolean
  setShowGrid: (val: boolean | ((prev: boolean) => boolean)) => void
  onOpenPreview: () => void
  onOpenCopyDialog: () => void
  onOpenAssetLibrary: () => void
  onSave: () => void
  saving: boolean
}

export function DesignerHeader({
  events,
  selectedEvent,
  setSelectedEvent,
  templateType,
  setTemplateType,
  saveStatus,
  canUndo,
  canRedo,
  undo,
  redo,
  showGrid,
  setShowGrid,
  onOpenPreview,
  onOpenCopyDialog,
  onOpenAssetLibrary,
  onSave,
  saving,
}: DesignerHeaderProps) {
  return (
    <header className="h-12 sm:h-14 border-b border-border bg-card px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-20 shadow-sm">
      {/* Left: Back & Event Selector */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" title="Back to Dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <Separator orientation="vertical" className="h-4 sm:h-5 hidden sm:block" />

        <div className="w-28 xs:w-36 sm:w-56 min-w-0 shrink">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="h-7 sm:h-8 text-xs font-medium px-2">
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((ev) => (
                <SelectItem key={ev._id} value={ev._id} className="text-xs">
                  {ev.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Type Tabs (Compact for mobile, full for desktop) */}
        <div className="flex bg-muted p-0.5 rounded-lg text-xs shrink-0">
          <button
            onClick={() => setTemplateType('participation')}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
              templateType === 'participation'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Participation Certificate"
          >
            <span className="sm:hidden">Part.</span>
            <span className="hidden sm:inline">Participation</span>
          </button>
          <button
            onClick={() => setTemplateType('achievement')}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
              templateType === 'achievement'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Achievement Certificate"
          >
            <span className="sm:hidden">Achv.</span>
            <span className="hidden sm:inline">Achievement</span>
          </button>
        </div>
      </div>

      {/* Center: Save Status Indicator (Desktop) */}
      <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
        {saveStatus === 'saving' && (
          <span className="flex items-center gap-1.5 text-blue-600 font-medium animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving changes...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <Check className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
        {saveStatus === 'unsaved' && (
          <span className="flex items-center gap-1.5 text-amber-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-4 sm:h-5 hidden md:block" />

        {/* Grid Toggle */}
        <Button
          variant={showGrid ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 hidden md:flex"
          onClick={() => setShowGrid((g) => !g)}
          title="Toggle Grid"
        >
          <Grid className="h-4 w-4" />
        </Button>

        {/* Media Asset Library */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1 hidden md:flex"
          onClick={onOpenAssetLibrary}
          title="Open Media Library"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Assets</span>
        </Button>

        {/* Copy Template from Event */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1 hidden lg:flex"
          onClick={onOpenCopyDialog}
          title="Copy from another template"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </Button>

        {/* Preview Certificate */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 sm:h-8 text-xs gap-1 px-2 sm:px-3"
          onClick={onOpenPreview}
          title="Preview Certificate"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </Button>

        {/* Save Button */}
        <Button
          size="sm"
          className="h-7 sm:h-8 text-xs gap-1 sm:gap-1.5 px-2.5 sm:px-3 bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 shrink-0"
          onClick={onSave}
          disabled={saving || !selectedEvent}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>Save</span>
        </Button>
      </div>
    </header>
  )
}
