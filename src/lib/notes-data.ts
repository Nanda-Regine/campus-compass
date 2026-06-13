export type NoteFileType = 'pdf' | 'doc' | 'slides' | 'images' | 'link'

export interface CommunityNote {
  id: string
  user_id: string
  title: string
  module_code: string
  description: string | null
  institution: string | null
  faculty: string | null
  year_of_study: string | null
  link_url: string
  file_type: NoteFileType
  tags: string[]
  save_count: number
  view_count: number
  created_at: string
  uploader_name?: string
  uploader_emoji?: string
  is_saved?: boolean
}

export interface StudyTwin {
  id: string
  name: string
  emoji: string
  university: string | null
  faculty: string | null
  year_of_study: string | null
  whatsapp_number: string | null
}

export const FILE_TYPE_LABELS: Record<NoteFileType, string> = {
  pdf: 'PDF',
  doc: 'Doc',
  slides: 'Slides',
  images: 'Images',
  link: 'Link',
}

export const FILE_TYPE_COLORS: Record<NoteFileType, string> = {
  pdf:    '#ef4444',
  doc:    '#3b82f6',
  slides: '#f59e0b',
  images: '#8b5cf6',
  link:   '#4ecf9e',
}
