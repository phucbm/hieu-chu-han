import type { Stroke, Candidate, RecognizeOptions } from './types'

const GOOGLE_IME_URL = 'https://inputtools.google.com/request?ime=handwriting&app=gws&cs=1&itc=zh-t-i0-handwrit'

function strokesToInk(strokes: Stroke[]): number[][][] {
  return strokes.map(stroke => [
    stroke.map(p => p.x),
    stroke.map(p => p.y),
    stroke.map(p => p.t),
  ])
}

export async function recognizeDirect(
  strokes: Stroke[],
  options: RecognizeOptions = {}
): Promise<Candidate[]> {
  const { language = 'zh-CN', limit = 8, width = 300, height = 300 } = options
  const url = `${GOOGLE_IME_URL}&num=${limit}`
  const payload = {
    device: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
    options: 'enable_pre_space',
    requests: [{
      writing_guide: { writing_area_width: width, writing_area_height: height },
      ink: strokesToInk(strokes),
      language,
    }],
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Google IME API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  const characters: string[] = data?.[1]?.[0]?.[1] ?? []
  return characters.map((character, index) => ({
    character,
    score: Math.max(0, 1 - index * (1 / characters.length)),
  }))
}

export async function recognize(
  strokes: Stroke[],
  options: RecognizeOptions & { proxyUrl: string }
): Promise<Candidate[]> {
  const { proxyUrl, ...rest } = options
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strokes, options: rest }),
  })
  if (!res.ok) throw new Error(`Proxy error ${res.status}: ${await res.text()}`)
  return res.json()
}

export function createHandwritingRoute() {
  return {
    POST: async (req: Request): Promise<Response> => {
      try {
        const { strokes, options = {} } = await req.json() as { strokes: Stroke[], options: RecognizeOptions }
        if (!Array.isArray(strokes)) return Response.json({ error: 'strokes must be an array' }, { status: 400 })
        const candidates = await recognizeDirect(strokes, options)
        return Response.json(candidates)
      } catch (err) {
        return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
      }
    },
  }
}
