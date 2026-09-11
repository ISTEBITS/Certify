import { TemplateElement, AlignmentType } from './types'

/**
 * Calculates updated (x, y) coordinates to align an element on the certificate canvas.
 */
export function calculateAlignmentPosition(
  element: TemplateElement,
  canvasWidth: number,
  canvasHeight: number,
  alignment: AlignmentType,
  padding = 20
): { x?: number; y?: number } {
  const elW = element.width || 100
  const elH = element.height || 40

  switch (alignment) {
    case 'top':
      return { y: padding }
    case 'bottom':
      return { y: Math.max(0, Math.round(canvasHeight - elH - padding)) }
    case 'left':
      return { x: padding }
    case 'right':
      return { x: Math.max(0, Math.round(canvasWidth - elW - padding)) }
    case 'center':
      return { x: Math.max(0, Math.round((canvasWidth - elW) / 2)) }
    case 'middle':
      return { y: Math.max(0, Math.round((canvasHeight - elH) / 2)) }
    default:
      return {}
  }
}

/**
 * Calculates new width/height while respecting aspect ratio locking.
 */
export function calculateAspectRatioResize(
  element: TemplateElement,
  newDimension: number,
  dimensionType: 'width' | 'height'
): { width: number; height: number } {
  const currentW = element.width || 10
  const currentH = element.height || 10

  if (dimensionType === 'width') {
    const clampedW = Math.max(10, Math.round(newDimension))
    if (element.aspectRatioLocked && currentW > 0) {
      const ratio = currentH / currentW
      return {
        width: clampedW,
        height: Math.max(10, Math.round(clampedW * ratio)),
      }
    }
    return { width: clampedW, height: currentH }
  } else {
    const clampedH = Math.max(10, Math.round(newDimension))
    if (element.aspectRatioLocked && currentH > 0) {
      const ratio = currentW / currentH
      return {
        width: Math.max(10, Math.round(clampedH * ratio)),
        height: clampedH,
      }
    }
    return { width: currentW, height: clampedH }
  }
}

/**
 * Reorders elements by moving a dragged item to the target item position.
 */
export function reorderElementLayers(
  elements: TemplateElement[],
  draggedId: string,
  targetId: string
): TemplateElement[] {
  const fromIndex = elements.findIndex((el) => el.id === draggedId)
  const toIndex = elements.findIndex((el) => el.id === targetId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return elements

  const copy = [...elements]
  const [removed] = copy.splice(fromIndex, 1)
  copy.splice(toIndex, 0, removed)
  return copy
}

/**
 * Shifts an element up, down, to front, or to back in the layer stack.
 */
export function shiftElementLayer(
  elements: TemplateElement[],
  id: string,
  direction: 'front' | 'back' | 'up' | 'down'
): TemplateElement[] {
  const index = elements.findIndex((el) => el.id === id)
  if (index === -1) return elements

  const copy = [...elements]
  const [item] = copy.splice(index, 1)

  switch (direction) {
    case 'front':
      copy.push(item)
      break
    case 'back':
      copy.unshift(item)
      break
    case 'up':
      copy.splice(Math.min(elements.length - 1, index + 1), 0, item)
      break
    case 'down':
      copy.splice(Math.max(0, index - 1), 0, item)
      break
  }
  return copy
}
