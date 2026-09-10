'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Line,
} from 'react-konva'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'
import {
  TemplateElement,
  TemplateConfig,
  DesignerSettings,
  SnapGuide,
} from './types'
import { ElementItem } from './ElementItem'

interface DesignerCanvasProps {
  template: TemplateConfig
  settings: DesignerSettings
  setSettings: React.Dispatch<React.SetStateAction<DesignerSettings>>
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  stageRef: React.RefObject<any>
  onFitToScreen?: () => void
}

export function DesignerCanvas({
  template,
  settings,
  setSettings,
  selectedId,
  setSelectedId,
  hoveredId,
  setHoveredId,
  onUpdateElement,
  containerRef,
  stageRef,
  onFitToScreen,
}: DesignerCanvasProps) {
  const [bgImageObj, setBgImageObj] = useState<HTMLImageElement | null>(null)
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([])
  const cardRef = useRef<HTMLDivElement>(null)

  // Track current zoom in a mutable ref for synchronous event handling
  const currentZoomRef = useRef(settings.zoom)
  useEffect(() => {
    currentZoomRef.current = settings.zoom
  }, [settings.zoom])

  // Load Background Image
  useEffect(() => {
    if (!template.backgroundImage) {
      setBgImageObj(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = template.backgroundImage
    img.onload = () => setBgImageObj(img)
  }, [template.backgroundImage])

  // ─── Smooth Focal Point Zoom Function ───────────────────────────────────────
  const updateZoomWithFocal = useCallback(
    (targetZoom: number, focalClientX: number, focalClientY: number) => {
      const container = containerRef.current
      if (!container) return

      const curZoom = currentZoomRef.current
      const clampedZoom = Math.max(0.1, Math.min(3.5, Math.round(targetZoom * 100) / 100))
      if (Math.abs(clampedZoom - curZoom) < 0.005) return

      const rect = container.getBoundingClientRect()
      const focalViewportX = focalClientX - rect.left
      const focalViewportY = focalClientY - rect.top

      const zoomRatio = clampedZoom / curZoom
      const targetScrollLeft = (container.scrollLeft + focalViewportX) * zoomRatio - focalViewportX
      const targetScrollTop = (container.scrollTop + focalViewportY) * zoomRatio - focalViewportY

      currentZoomRef.current = clampedZoom
      setSettings((prev) => ({ ...prev, zoom: clampedZoom }))

      // Schedule scroll position sync after layout dimensions update
      requestAnimationFrame(() => {
        if (container) {
          container.scrollLeft = Math.max(0, targetScrollLeft)
          container.scrollTop = Math.max(0, targetScrollTop)
        }
      })
    },
    [containerRef, setSettings]
  )

  // ─── Native Wheel, Touch Pan & Touch Pinch Engine ───────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Trackpad pinch or Ctrl + Mouse Wheel Zoom locked to exact cursor position
    const onNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const zoomDelta = e.deltaY < 0 ? 1.08 : 0.92
        const curZoom = currentZoomRef.current
        updateZoomWithFocal(curZoom * zoomDelta, e.clientX, e.clientY)
      }
    }

    // Touch Handling: 1-Finger Smooth Canvas Pan & 2-Finger Pinch Zoom
    interface PinchState {
      initialDist: number
      initialZoom: number
      focalX: number
      focalY: number
    }

    let activePinch: PinchState | null = null
    let isTouchPanning = false
    let touchStartX = 0
    let touchStartY = 0
    let touchStartScrollLeft = 0
    let touchStartScrollTop = 0

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        activePinch = null
        isTouchPanning = true
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
        touchStartScrollLeft = container.scrollLeft
        touchStartScrollTop = container.scrollTop
      } else if (e.touches.length === 2) {
        isTouchPanning = false
        const p1 = e.touches[0]
        const p2 = e.touches[1]
        const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY)
        if (dist > 10) {
          activePinch = {
            initialDist: dist,
            initialZoom: currentZoomRef.current,
            focalX: (p1.clientX + p2.clientX) / 2,
            focalY: (p1.clientY + p2.clientY) / 2,
          }
        }
      } else {
        isTouchPanning = false
        activePinch = null
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && activePinch && activePinch.initialDist > 0) {
        e.preventDefault() // Prevent full page scaling on mobile browser
        const p1 = e.touches[0]
        const p2 = e.touches[1]
        const currentDist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY)

        if (currentDist > 10) {
          const scaleRatio = currentDist / activePinch.initialDist
          const targetZoom = activePinch.initialZoom * scaleRatio
          const currentFocalX = (p1.clientX + p2.clientX) / 2
          const currentFocalY = (p1.clientY + p2.clientY) / 2
          updateZoomWithFocal(targetZoom, currentFocalX, currentFocalY)
        }
      } else if (e.touches.length === 1 && isTouchPanning) {
        const dx = e.touches[0].clientX - touchStartX
        const dy = e.touches[0].clientY - touchStartY
        // Smoothly scroll the container when dragging over the canvas
        if (container.scrollWidth > container.clientWidth || container.scrollHeight > container.clientHeight) {
          container.scrollLeft = touchStartScrollLeft - dx
          container.scrollTop = touchStartScrollTop - dy
        }
      }
    }

    const onTouchEnd = () => {
      isTouchPanning = false
      activePinch = null
    }

    // Prevent Safari default page gesture zoom
    const preventGesture = (e: Event) => e.preventDefault()
    container.addEventListener('gesturestart', preventGesture)
    container.addEventListener('gesturechange', preventGesture)
    container.addEventListener('gestureend', preventGesture)

    container.addEventListener('wheel', onNativeWheel, { passive: false })
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: true })
    container.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('gesturestart', preventGesture)
      container.removeEventListener('gesturechange', preventGesture)
      container.removeEventListener('gestureend', preventGesture)
      container.removeEventListener('wheel', onNativeWheel)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [containerRef, updateZoomWithFocal])

  // ─── Smart Drag Move Snap Guides ──────────────────────────────────────────
  const handleElementDragMove = useCallback(
    (element: TemplateElement, e: any) => {
      const node = e.target
      const guides: SnapGuide[] = []
      const snapThreshold = 6

      const elemCenterX = node.x() + (element.width || 100) / 2
      const elemCenterY = node.y() + (element.height || 36) / 2
      const canvasCenterX = template.width / 2
      const canvasCenterY = template.height / 2

      if (Math.abs(elemCenterX - canvasCenterX) < snapThreshold) {
        node.x(canvasCenterX - (element.width || 100) / 2)
        guides.push({ type: 'vertical', position: canvasCenterX, label: 'Center' })
      }

      if (Math.abs(elemCenterY - canvasCenterY) < snapThreshold) {
        node.y(canvasCenterY - (element.height || 36) / 2)
        guides.push({ type: 'horizontal', position: canvasCenterY, label: 'Center' })
      }

      if (Math.abs(node.x() - 40) < snapThreshold) {
        node.x(40)
        guides.push({ type: 'vertical', position: 40 })
      }

      if (Math.abs(node.x() + (element.width || 100) - (template.width - 40)) < snapThreshold) {
        node.x(template.width - 40 - (element.width || 100))
        guides.push({ type: 'vertical', position: template.width - 40 })
      }

      setActiveGuides(guides)
    },
    [template.width, template.height]
  )

  const handleElementDragEnd = useCallback(
    (element: TemplateElement, e: any) => {
      setActiveGuides([])
      const node = e.target
      onUpdateElement(element.id, {
        x: Math.round(node.x()),
        y: Math.round(node.y()),
      })
    },
    [onUpdateElement]
  )

  const handleElementTransformEnd = useCallback(
    (element: TemplateElement, e: any) => {
      const node = e.target
      const rawRot = Math.round(node.rotation()) % 360
      const normalizedRot = rawRot < 0 ? rawRot + 360 : rawRot
      onUpdateElement(element.id, {
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        rotation: normalizedRot,
        width: Math.max(10, Math.round(node.width() * node.scaleX())),
        height: Math.max(10, Math.round(node.height() * node.scaleY())),
      })
      node.scaleX(1)
      node.scaleY(1)
    },
    [onUpdateElement]
  )

  return (
    <main
      ref={containerRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedId(null)
        }
      }}
      className="flex-1 bg-muted/40 overflow-auto relative select-none show-scrollbar"
      style={{
        overscrollBehavior: 'contain',
        touchAction: 'pan-x pan-y',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedId(null)
          }
        }}
        className="min-w-full min-h-full flex p-2 sm:p-4 md:p-6"
        style={{
          width: `max(100%, ${template.width * settings.zoom + 16}px)`,
          height: `max(100%, ${template.height * settings.zoom + 16}px)`,
        }}
      >
        <div
          ref={cardRef}
          className="m-auto bg-card shadow-xl rounded-sm border border-border relative shrink-0"
          style={{
            width: template.width * settings.zoom,
            height: template.height * settings.zoom,
          }}
        >
          <div
            style={{
              transform: `scale(${settings.zoom})`,
              transformOrigin: 'top left',
              width: template.width,
              height: template.height,
            }}
          >
            <Stage
              width={template.width}
              height={template.height}
              ref={stageRef}
              preventDefault={false}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) {
                  setSelectedId(null)
                }
              }}
              onTouchStart={(e) => {
                if (e.target === e.target.getStage()) {
                  setSelectedId(null)
                }
              }}
            >
              <Layer>
                {/* Background image */}
                {bgImageObj && (
                  <KonvaImage
                    image={bgImageObj}
                    width={template.width}
                    height={template.height}
                    onClick={() => setSelectedId(null)}
                    onTap={() => setSelectedId(null)}
                  />
                )}

                {/* Grid Lines */}
                {settings.showGrid && (
                  <>
                    {Array.from({ length: Math.ceil(template.width / settings.gridSize) + 1 }).map((_, i) => (
                      <Line
                        key={`v-${i}`}
                        points={[i * settings.gridSize, 0, i * settings.gridSize, template.height]}
                        stroke="#cbd5e1"
                        strokeWidth={0.5}
                      />
                    ))}
                    {Array.from({ length: Math.ceil(template.height / settings.gridSize) + 1 }).map((_, i) => (
                      <Line
                        key={`h-${i}`}
                        points={[0, i * settings.gridSize, template.width, i * settings.gridSize]}
                        stroke="#cbd5e1"
                        strokeWidth={0.5}
                      />
                    ))}
                  </>
                )}

                {/* Smart Alignment Snap Guides */}
                {activeGuides.map((guide, idx) =>
                  guide.type === 'vertical' ? (
                    <Line
                      key={`guide-v-${idx}`}
                      points={[guide.position, 0, guide.position, template.height]}
                      stroke="#0284c7"
                      strokeWidth={1.5}
                      dash={[6, 4]}
                    />
                  ) : (
                    <Line
                      key={`guide-h-${idx}`}
                      points={[0, guide.position, template.width, guide.position]}
                      stroke="#0284c7"
                      strokeWidth={1.5}
                      dash={[6, 4]}
                    />
                  )
                )}

                {/* Elements */}
                {template.elements.map((element) => (
                  <ElementItem
                    key={element.id}
                    element={element}
                    isSelected={selectedId === element.id}
                    isHovered={hoveredId === element.id}
                    onMouseEnter={() => setHoveredId(element.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onSelect={() => setSelectedId(element.id)}
                    onDragMove={(e) => handleElementDragMove(element, e)}
                    onDragEnd={(e) => handleElementDragEnd(element, e)}
                    onTransformEnd={(e) => handleElementTransformEnd(element, e)}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      {/* Floating Quick Zoom & Fit Widget (Accessible on Mobile & Desktop) */}
      <div className="sticky bottom-3 left-3 md:bottom-4 md:left-4 z-20 inline-flex items-center bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-full p-1 gap-1 text-xs select-none">
        <button
          type="button"
          onClick={() => {
            const cur = currentZoomRef.current
            const next = Math.max(0.1, Math.round((cur - 0.1) * 10) / 10)
            setSettings((s) => ({ ...s, zoom: next }))
          }}
          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition"
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <span className="text-[11px] font-semibold text-foreground px-1 min-w-[36px] text-center tabular-nums">
          {Math.round(settings.zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => {
            const cur = currentZoomRef.current
            const next = Math.min(3.5, Math.round((cur + 0.1) * 10) / 10)
            setSettings((s) => ({ ...s, zoom: next }))
          }}
          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition"
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        {onFitToScreen && (
          <>
            <div className="h-3.5 w-px bg-border my-auto" />
            <button
              type="button"
              onClick={onFitToScreen}
              className="h-7 px-2 rounded-full flex items-center justify-center gap-1 hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition text-[11px] font-medium"
              title="Fit to Screen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden xs:inline sm:inline">Fit</span>
            </button>
          </>
        )}
      </div>
    </main>
  )
}
