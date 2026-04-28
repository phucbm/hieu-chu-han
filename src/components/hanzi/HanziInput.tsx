import { useCallback, useRef, useState } from 'react'
import { HanziPad } from './HanziPad'
import { recognize } from './recognize'
import type { Candidate, HanziInputProps, HanziPadHandle, Stroke } from './types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HanziInput({
    onSelect,
    proxyUrl,
    language = 'zh-CN',
    limit = 8,
    width = 280,
    height = 280,
    showUndo = true,
    showClear = true,
    background,
    showGrid = true,
    gridLines,
    gridColor,
    className,
}: HanziInputProps) {
  const padRef = useRef<HanziPadHandle>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [strokeCount, setStrokeCount] = useState(0)

  const handleStrokesChange = useCallback((strokes: Stroke[]) => setStrokeCount(strokes.length), [])

  const handleRecognize = useCallback(async () => {
    const strokes = padRef.current?.getStrokes() ?? []
    if (!strokes.length) return
    setLoading(true)
    setError(null)
    setCandidates([])
    try {
      setCandidates(await recognize(strokes, { proxyUrl, language, limit, width, height }))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [proxyUrl, language, limit, width, height])

  const handleClear = useCallback(() => {
    padRef.current?.clear()
    setCandidates([])
    setError(null)
    setStrokeCount(0)
  }, [])

  const handleUndo = useCallback(() => {
    padRef.current?.undo()
    setStrokeCount(prev => Math.max(0, prev - 1))
  }, [])

  const handleSelect = useCallback((character: string) => {
    onSelect(character)
    handleClear()
  }, [onSelect, handleClear])

  return (
    <div className={cn('flex flex-col gap-2', className)} style={{ width, minWidth: width, flexShrink: 0 }}>
      <HanziPad
        ref={padRef}
        width={width}
        height={height}
        onStrokesChange={handleStrokesChange}
        background={background}
        showGrid={showGrid}
        gridLines={gridLines}
        gridColor={gridColor}
        className="rounded-lg border block"
      />
      <div className="flex gap-1.5">
        {showUndo && (
          <Button type="button" variant="outline" size="sm" onClick={handleUndo} disabled={strokeCount === 0}>
            Undo
          </Button>
        )}
        {showClear && (
          <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={strokeCount === 0}>
            Clear
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRecognize}
          disabled={strokeCount === 0 || loading}
          className="ml-auto font-medium"
        >
          {loading ? '…' : 'Nhận diện'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {candidates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {candidates.map((c, i) => (
            <button
              key={`${c.character}-${i}`}
              type="button"
              onClick={() => handleSelect(c.character)}
              className="font-chinese text-2xl px-2.5 py-1 rounded-lg border bg-muted/50 hover:bg-muted transition-colors leading-tight"
            >
              {c.character}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
