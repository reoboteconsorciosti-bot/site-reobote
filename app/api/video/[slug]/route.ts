import { stat } from 'node:fs/promises'
import { createReadStream as createReadStreamCb } from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const videoMap: Record<string, string> = {
  jaqueline: 'DRA. JAQUELINE ZMIJEVSK - MÉDICA DERMATOLOGISTA - Reobote Consórcios (720p, h264, youtube).mp4',
  giselle: 'DRA. GISELLE PALIERAQUI - CONTEMPLAÇÃO GARANTIDA - Reobote Consórcios (720p, h264, youtube).mp4',
  andreza: 'ANDREZA SANTANA - CONSÓRCIO PONTUAL - Reobote Consórcios (720p, h264, youtube).mp4',
  robson: 'ROBSON MONTEZANO - PRODUTOR RURAL - Reobote Consórcios (720p, h264, youtube).mp4',
}

function parseRange(range: string, size: number) {
  const match = range.match(/bytes=(\d+)-(\d*)/)
  if (!match) return null
  const start = Number.parseInt(match[1]!, 10)
  const endRaw = match[2]
  const end = endRaw ? Number.parseInt(endRaw, 10) : size - 1
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) return null
  if (start >= size) return null
  return { start, end: Math.min(end, size - 1) }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const fileName = videoMap[slug]

  if (!fileName) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), 'public', 'videos', fileName)
  const fileStat = await stat(filePath)
  const rangeHeader = req.headers.get('range')

  if (rangeHeader) {
    const parsed = parseRange(rangeHeader, fileStat.size)
    if (!parsed) return new NextResponse(null, { status: 416 })

    const { start, end } = parsed
    const chunkSize = end - start + 1
    const nodeStream = createReadStreamCb(filePath, { start, end })
    const stream = Readable.toWeb(nodeStream) as ReadableStream

    return new NextResponse(stream, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  const nodeStream = createReadStreamCb(filePath)
  const stream = Readable.toWeb(nodeStream) as ReadableStream

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Length': String(fileStat.size),
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
    },
  })
}
