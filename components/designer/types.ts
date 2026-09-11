export interface Event {
  _id: string
  name: string
  participationTemplate?: TemplateConfig
  achievementTemplate?: TemplateConfig
}

export interface TemplateElement {
  id: string
  type: 'text' | 'qrcode' | 'image'
  field?: 'name' | 'event' | 'date' | 'certificateId' | 'custom' | 'collegeName' | 'registrationNumber' | 'position' | 'email'
  content?: string
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  rotation?: number
  opacity?: number
  letterSpacing?: number
  lineHeight?: number
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  isLocked?: boolean
  aspectRatioLocked?: boolean
  src?: string
  imagePublicId?: string
}

export interface TemplateConfig {
  width: number
  height: number
  backgroundImage?: string
  backgroundImagePublicId?: string
  elements: TemplateElement[]
}

export interface DesignerSettings {
  zoom: number
  showGrid: boolean
  gridSize: number
  snapToGrid: boolean
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal'
  position: number
  label?: string
}

export const DEFAULT_TEMPLATE: TemplateConfig = {
  width: 842,
  height: 595,
  elements: [],
}

export const DEFAULT_SETTINGS: DesignerSettings = {
  zoom: 1,
  showGrid: false,
  gridSize: 20,
  snapToGrid: false,
}

export const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Helvetica',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Playfair Display',
  'Cinzel',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Oswald',
  'Raleway',
  'Merriweather',
  'Great Vibes',
  'Dancing Script',
  'Alex Brush',
  'Cinzel Decorative',
]

export const PRESET_COLORS = [
  '#000000',
  '#ffffff',
  '#1e293b',
  '#334155',
  '#64748b',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#16a34a',
  '#0284c7',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#b45309',
  '#15803d',
  '#0369a1',
  '#1d4ed8',
  '#6d28d9',
]

export type AlignmentType = 'top' | 'left' | 'middle' | 'center' | 'bottom' | 'right'

export interface AssetItem {
  _id: string
  url: string
  publicId: string
  name: string
  type: 'background' | 'logo' | 'signature' | 'other'
  width?: number
  height?: number
  uploadedAt: string
}

export const ASSET_CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'logo', label: 'Logos' },
  { id: 'signature', label: 'Signatures' },
  { id: 'background', label: 'Backgrounds' },
  { id: 'other', label: 'Other' },
]
