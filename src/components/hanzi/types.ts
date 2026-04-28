import type React from 'react'

export interface Point {
  x: number
  y: number
  t: number
}

export type Stroke = Point[]

export interface Candidate {
  character: string
  score: number
}

export interface RecognizeOptions {
  language?: string
  limit?: number
  width?: number
  height?: number
}

export interface HanziPadProps {
  onStrokesChange?: (strokes: Stroke[]) => void
  width?: number
  height?: number
  strokeColor?: string
  lineWidth?: number
  background?: string
  showGrid?: boolean
  gridLines?: 1 | 2 | 3
  gridColor?: string
  className?: string
  style?: React.CSSProperties
}

export interface HanziPadHandle {
  getStrokes: () => Stroke[]
  clear: () => void
  undo: () => void
  toDataURL: () => string | null
}

export interface HanziInputProps {
  onSelect: (character: string) => void
  proxyUrl: string
  language?: string
  limit?: number
  width?: number
  height?: number
  showUndo?: boolean
  showClear?: boolean
  background?: string
  showGrid?: boolean
  gridLines?: 1 | 2 | 3
  gridColor?: string
  className?: string
}
