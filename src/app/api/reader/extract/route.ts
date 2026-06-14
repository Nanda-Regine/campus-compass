export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

export interface ReaderSection {
  index: number
  title: string
  content: string
  wordCount: number
}

export interface ReaderDocument {
  title: string
  type: 'pdf' | 'docx'
  sections: ReaderSection[]
  totalWords: number
  estimatedMinutes: number
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function chunkByParagraphs(text: string, maxWords = 550): string[] {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 20)
  const chunks: string[] = []
  let current: string[] = []
  let wordCount = 0

  for (const para of paragraphs) {
    const paraWords = countWords(para)
    if (wordCount + paraWords > maxWords && current.length > 0) {
      chunks.push(current.join('\n\n'))
      current = []
      wordCount = 0
    }
    current.push(para)
    wordCount += paraWords
  }
  if (current.length > 0) chunks.push(current.join('\n\n'))
  return chunks.filter(c => c.trim().length > 30)
}

async function extractPdf(buffer: Buffer): Promise<ReaderSection[]> {
  // serverComponentsExternalPackages prevents webpack bundling — safe to require directly
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const data = await pdfParse(buffer)
  const raw: string = data.text ?? ''

  // pdf-parse uses form-feed (\f) as a page separator
  const rawPages: string[] = raw.split('\f').map((p: string) => p.trim()).filter((p: string) => p.length > 30)

  if (rawPages.length >= 2) {
    return rawPages.map((content, i) => ({
      index: i,
      title: `Page ${i + 1}`,
      content,
      wordCount: countWords(content),
    }))
  }

  // Single-page PDF or no page breaks — chunk by paragraph groups
  const chunks = chunkByParagraphs(raw)
  return chunks.map((content, i) => ({
    index: i,
    title: `Section ${i + 1}`,
    content,
    wordCount: countWords(content),
  }))
}

async function extractDocx(buffer: Buffer): Promise<ReaderSection[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  const text: string = result.value ?? ''

  // Detect heading lines (short, title-case-ish, followed by body text)
  const lines = text.split('\n')
  const headingIndexes: number[] = []

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim()
    if (!line || line.length > 90) continue
    const nextLine = lines[i + 1]?.trim() ?? ''
    if (nextLine.length > 60 && /[A-Z]/.test(line[0])) {
      headingIndexes.push(i)
    }
  }

  if (headingIndexes.length >= 3) {
    const sections: ReaderSection[] = []
    for (let h = 0; h < headingIndexes.length; h++) {
      const start = headingIndexes[h]
      const end = h + 1 < headingIndexes.length ? headingIndexes[h + 1] : lines.length
      const title = lines[start].trim()
      const content = lines.slice(start + 1, end).join('\n').trim()
      if (content.length > 50) {
        sections.push({ index: sections.length, title, content, wordCount: countWords(content) })
      }
    }
    if (sections.length >= 2) return sections
  }

  // Fallback: paragraph chunks
  const chunks = chunkByParagraphs(text)
  return chunks.map((content, i) => ({
    index: i,
    title: `Section ${i + 1}`,
    content,
    wordCount: countWords(content),
  }))
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 413 })

    const name = file.name.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())
    const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

    let sections: ReaderSection[]
    let type: 'pdf' | 'docx'

    if (name.endsWith('.pdf')) {
      sections = await extractPdf(buffer)
      type = 'pdf'
    } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
      sections = await extractDocx(buffer)
      type = 'docx'
    } else {
      return NextResponse.json({ error: 'Only PDF and Word (.docx) files are supported' }, { status: 400 })
    }

    if (sections.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract readable text. Make sure the file contains selectable (not scanned image) text.' },
        { status: 422 }
      )
    }

    const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0)
    const doc: ReaderDocument = {
      title,
      type,
      sections,
      totalWords,
      estimatedMinutes: Math.ceil(totalWords / 200),
    }

    return NextResponse.json(doc)
  } catch (err) {
    console.error('[reader/extract]', err)
    return NextResponse.json({ error: 'Failed to process document' }, { status: 500 })
  }
}
