'use client'

import React, { useRef, useEffect, useState } from 'react'
import {
  Text,
  Rect,
  Image as KonvaImage,
  Transformer,
  Group,
} from 'react-konva'
import { TemplateElement } from './types'

interface ElementItemProps {
  element: TemplateElement
  isSelected: boolean
  isHovered: boolean
  isHandToolActive?: boolean
  onSelect: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onDragStart?: (e: any) => void
  onDragMove?: (e: any) => void
  onDragEnd: (e: any) => void
  onTransformEnd: (e: any) => void
}

export function ElementItem({
  element,
  isSelected,
  isHovered,
  isHandToolActive = false,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
}: ElementItemProps) {
  const shapeRef = useRef<any>(null)
  const trRef = useRef<any>(null)
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null)
  const [textExactHeight, setTextExactHeight] = useState<number>(() => {
    const lines = (element.content || element.field || 'Text').split('\n').length
    return Math.round((element.fontSize || 20) * (element.lineHeight || 1.2) * lines)
  })

  // Load image if type is image
  useEffect(() => {
    if (element.type === 'image' && element.src) {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.src = element.src
      img.onload = () => setImageObj(img)
    }
  }, [element.type, element.src])

  // Measure dynamic text height from Konva node
  useEffect(() => {
    if (element.type === 'text' && shapeRef.current) {
      const measured = shapeRef.current.height()
      if (measured && measured > 0) {
        setTextExactHeight(Math.round(measured))
      }
    }
  }, [
    element.type,
    element.content,
    element.field,
    element.fontSize,
    element.fontFamily,
    element.lineHeight,
    element.width,
    element.isBold,
    element.isItalic,
  ])

  // Attach Transformer to the selected shape and update on rotation / scale changes
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.forceUpdate()
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected, imageObj, element.rotation, element.width, element.height, element.x, element.y])

  const isDraggable = isSelected && !element.isLocked && !isHandToolActive
  const currentRotation = element.rotation || 0

  // ─── Canva-Style Transformer Component ───
  const renderTransformer = () => (
    <Transformer
      ref={trRef}
      rotateEnabled={!element.isLocked}
      rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
      rotationSnapTolerance={5}
      anchorSize={14}
      anchorCornerRadius={10}
      anchorFill="#ffffff"
      anchorStroke="#0284c7"
      anchorStrokeWidth={2}
      borderStroke="#0284c7"
      borderStrokeWidth={1.5}
      rotateAnchorOffset={26}
      rotateAnchorCursor="crosshair"
      enabledAnchors={[
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'middle-left',
        'middle-right',
        'top-center',
        'bottom-center',
      ]}
      boundBoxFunc={(oldBox, newBox) => {
        if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
          return oldBox
        }
        return newBox
      }}
    />
  )

  // ─── 1. TEXT ELEMENT ───
  if (element.type === 'text') {
    const fontStyle = `${element.isBold ? 'bold' : ''} ${element.isItalic ? 'italic' : ''}`.trim() || 'normal'
    const actualHeight = textExactHeight || Math.round((element.fontSize || 20) * (element.lineHeight || 1.2))

    return (
      <>
        {/* Solid Hover Outline matching exact element dimensions & rotation */}
        {isHovered && !isSelected && (
          <Rect
            x={element.x - 2}
            y={element.y - 2}
            width={element.width + 4}
            height={actualHeight + 4}
            rotation={currentRotation}
            stroke="#0284c7"
            strokeWidth={1.5}
            cornerRadius={3}
            listening={false}
          />
        )}
        <Text
          ref={shapeRef}
          text={element.content || element.field || 'Text'}
          x={element.x}
          y={element.y}
          fontSize={element.fontSize || 20}
          fontFamily={element.fontFamily || 'Arial'}
          fontStyle={fontStyle}
          fill={element.color || '#000000'}
          align={element.textAlign || 'center'}
          width={element.width}
          opacity={element.opacity ?? 1}
          rotation={currentRotation}
          letterSpacing={element.letterSpacing || 0}
          lineHeight={element.lineHeight || 1.2}
          textDecoration={element.isUnderline ? 'underline' : ''}
          draggable={isDraggable}
          onClick={(e) => {
            e.cancelBubble = true
            onSelect()
          }}
          onTap={(e) => {
            e.cancelBubble = true
            onSelect()
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = isDraggable ? 'move' : 'pointer'
            if (shapeRef.current) {
              const h = shapeRef.current.height()
              if (h && h > 0) setTextExactHeight(Math.round(h))
            }
            onMouseEnter()
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'default'
            onMouseLeave()
          }}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
        />
        {isSelected && renderTransformer()}
      </>
    )
  }

  // ─── 2. QR CODE ELEMENT ───
  if (element.type === 'qrcode') {
    return (
      <>
        {/* Solid Hover Outline matching exact element dimensions & rotation */}
        {isHovered && !isSelected && (
          <Rect
            x={element.x - 2}
            y={element.y - 2}
            width={(element.width || 90) + 4}
            height={(element.height || 90) + 4}
            rotation={currentRotation}
            stroke="#0284c7"
            strokeWidth={1.5}
            cornerRadius={6}
            listening={false}
          />
        )}
        <Group
          ref={shapeRef}
          x={element.x}
          y={element.y}
          width={element.width || 90}
          height={element.height || 90}
          rotation={currentRotation}
          draggable={isDraggable}
          onClick={(e) => {
            e.cancelBubble = true
            onSelect()
          }}
          onTap={(e) => {
            e.cancelBubble = true
            onSelect()
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = isDraggable ? 'move' : 'pointer'
            onMouseEnter()
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'default'
            onMouseLeave()
          }}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
        >
          <Rect
            width={element.width || 90}
            height={element.height || 90}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth={1}
            cornerRadius={6}
          />
          <Rect x={8} y={8} width={18} height={18} fill="#1e293b" cornerRadius={3} />
          <Rect x={(element.width || 90) - 26} y={8} width={18} height={18} fill="#1e293b" cornerRadius={3} />
          <Rect x={8} y={(element.height || 90) - 26} width={18} height={18} fill="#1e293b" cornerRadius={3} />
          <Text
            x={0}
            y={(element.height || 90) + 4}
            text="Verify QR"
            fontSize={10}
            fontFamily="Arial"
            fill="#64748b"
            align="center"
            width={element.width || 90}
          />
        </Group>
        {isSelected && renderTransformer()}
      </>
    )
  }

  // ─── 3. IMAGE ASSET ELEMENT ───
  if (element.type === 'image' && element.src) {
    return (
      <>
        {/* Solid Hover Outline matching exact element dimensions & rotation */}
        {isHovered && !isSelected && (
          <Rect
            x={element.x - 2}
            y={element.y - 2}
            width={(element.width || 120) + 4}
            height={(element.height || 120) + 4}
            rotation={currentRotation}
            stroke="#0284c7"
            strokeWidth={1.5}
            cornerRadius={6}
            listening={false}
          />
        )}
        {imageObj && (
          <KonvaImage
            ref={shapeRef}
            image={imageObj}
            x={element.x}
            y={element.y}
            width={element.width || 120}
            height={element.height || 120}
            opacity={element.opacity ?? 1}
            rotation={currentRotation}
            draggable={isDraggable}
            onClick={(e) => {
              e.cancelBubble = true
              onSelect()
            }}
            onTap={(e) => {
              e.cancelBubble = true
              onSelect()
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = isDraggable ? 'move' : 'pointer'
              onMouseEnter()
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'default'
              onMouseLeave()
            }}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onTransformEnd={onTransformEnd}
          />
        )}
        {isSelected && renderTransformer()}
      </>
    )
  }

  return null
}
