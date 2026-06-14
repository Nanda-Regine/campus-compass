'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import NovaCapabilitiesMenu from '@/components/nova/NovaCapabilitiesMenu'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'
import { AmbientImage } from '@/components/ui/AmbientImage'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import NovaMarkdown from '@/components/nova/NovaMarkdown'
import { useUpgradePrompt } from '@/components/ui/UpgradePromptModal'

interface Resource {
  title: string
  url: string
  type: 'video' | 'article' | 'tool' | 'helpline' | 'website'
  description?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isCrisis?: boolean
  resources?: Resource[]
  imagePreviewUrl?: string  // object URL — shown as thumbnail in chat bubble, revoked after unmount
}

// Compress + resize an image to ≤1024px JPEG before sending to avoid large payloads on 2G
async function compressImage(file: File): Promise<{ data: string; mimeType: 'image/jpeg'; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onerror = reject
    img.onload = () => {
      const MAX_PX = 1024
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
      resolve({ data: dataUrl.split(',')[1], mimeType: 'image/jpeg', previewUrl })
    }
    img.src = previewUrl
  })
}

const MOODS = [
  { label: 'Good', emoji: '😊', colour: 'teal' },
  { label: 'Okay', emoji: '😐', colour: 'blue' },
  { label: 'Low', emoji: '😔', colour: 'purple' },
  { label: 'Anxious', emoji: '😰', colour: 'amber' },
  { label: 'Stressed', emoji: '😤', colour: 'coral' },
  { label: 'Exhausted', emoji: '😩', colour: 'red' },
  { label: 'Struggling', emoji: '💔', colour: 'red' },
]

const CRISIS_NUMBERS = [
  { name: 'SADAG', number: '0800 21 4446', type: 'Toll-free' },
  { name: 'Lifeline SA', number: '0800 567 567', type: 'Toll-free' },
  { name: 'SMS Support', number: '31393', type: 'SMS' },
]

const RESOURCE_ICONS: Record<string, string> = {
  video: '▶',
  article: '📄',
  tool: '🛠',
  helpline: '🆘',
  website: '🔗',
}

// ─── Personalised daily brief (shown when chat is empty) ─────────────────────

interface BriefData {
  name: string | null
  nextExamName: string | null
  daysToExam: number | null
  urgentTaskCount: number
  wellnessScore: number | null
  xpLevel: string
  totalXP: number
}

function NovaDailyBrief({
  briefData,
  onPrompt,
  onShowCapabilities,
}: {
  briefData: BriefData | null
  onPrompt: (msg: string) => void
  onShowCapabilities: () => void
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = briefData?.name || null

  // Build brief cards from available data
  const cards: { icon: string; label: string; value: string; color: string; prompt?: string }[] = []

  if (briefData?.nextExamName && briefData.daysToExam !== null) {
    const urgency = briefData.daysToExam <= 3 ? '#ff6b6b' : briefData.daysToExam <= 7 ? '#f59e0b' : '#4ecf9e'
    cards.push({
      icon: '📚',
      label: 'Next exam',
      value: `${briefData.nextExamName} · ${briefData.daysToExam}d`,
      color: urgency,
      prompt: `Help me prepare for ${briefData.nextExamName} — I have ${briefData.daysToExam} days left`,
    })
  }

  if (briefData && briefData.urgentTaskCount > 0) {
    cards.push({
      icon: '⚡',
      label: 'Due soon',
      value: `${briefData.urgentTaskCount} task${briefData.urgentTaskCount === 1 ? '' : 's'}`,
      color: '#f59e0b',
      prompt: "What should I work on today?",
    })
  }

  if (briefData && briefData.wellnessScore !== null && briefData.wellnessScore !== undefined) {
    const wColor = briefData.wellnessScore >= 70 ? '#4ecf9e' : briefData.wellnessScore >= 45 ? '#f59e0b' : '#ff6b6b'
    cards.push({
      icon: '💚',
      label: 'Wellness',
      value: `${briefData.wellnessScore}/100`,
      color: wColor,
      prompt: briefData.wellnessScore < 50 ? "I'm feeling low — can you help me recharge?" : "How can I keep my energy up this week?",
    })
  }

  if (briefData) {
    cards.push({
      icon: '✨',
      label: briefData.xpLevel,
      value: `${briefData.totalXP} XP`,
      color: '#c084fc',
    })
  }

  // Quick-start suggestions always shown
  const suggestions = [
    { label: 'Plan my week', prompt: "Help me plan my week" },
    { label: 'Check my budget', prompt: "How is my budget looking?" },
    { label: 'Study tips', prompt: "Give me study tips for varsity" },
    { label: 'I need motivation', prompt: "I need some motivation today" },
  ]

  return (
    <div
      className="flex flex-col items-center justify-start px-4 pt-6 pb-2 animate-fade-up"
      style={{ minHeight: '50vh' }}
    >
      {/* Avatar with animated pulse rings */}
      <div style={{ position: 'relative', marginBottom: 18, flexShrink: 0 }}>
        {/* Outer pulse ring */}
        <div style={{
          position: 'absolute', inset: -12,
          borderRadius: 32, border: '1px solid rgba(192,132,252,0.12)',
          animation: 'novaPulse 3s ease-in-out infinite',
        }} />
        {/* Mid pulse ring */}
        <div style={{
          position: 'absolute', inset: -6,
          borderRadius: 28, border: '1px solid rgba(192,132,252,0.18)',
          animation: 'novaPulse 3s ease-in-out infinite 0.5s',
        }} />
        <div style={{
          width: 76, height: 76, borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(88,28,135,0.65) 0%, rgba(13,92,80,0.65) 100%)',
          border: '1px solid rgba(192,132,252,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34, boxShadow: '0 0 30px rgba(155,111,212,0.2)',
        }}>
          🌟
        </div>
        {/* Live indicator */}
        <div style={{
          position: 'absolute', bottom: 2, right: 2,
          width: 12, height: 12, borderRadius: '50%',
          background: '#4ecf9e', border: '2px solid var(--bg-base)',
          boxShadow: '0 0 6px rgba(78,207,158,0.6)',
          animation: 'statusLive 2s ease-in-out infinite',
        }} />
      </div>

      {/* Greeting */}
      <h2
        style={{
          fontFamily: 'var(--font-display)', fontWeight: 900,
          fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: 4, textAlign: 'center',
          letterSpacing: '-0.02em',
        }}
      >
        {greeting}{firstName ? `, ${firstName}` : ''}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.63rem',
          color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: 20, lineHeight: 1.6,
          maxWidth: 280,
        }}
      >
        {cards.length > 0
          ? "Your daily brief is ready — I already know your semester."
          : "Your AI companion for varsity life. Ask me anything."}
      </p>

      {/* Brief cards */}
      {cards.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: cards.length >= 4 ? '1fr 1fr' : cards.length === 3 ? '1fr 1fr' : cards.length === 2 ? '1fr 1fr' : '1fr',
            gap: 8, width: '100%', maxWidth: 340, marginBottom: 20,
          }}
        >
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => card.prompt && onPrompt(card.prompt)}
              disabled={!card.prompt}
              style={{
                background: `${card.color}0d`,
                border: `1px solid ${card.color}25`,
                borderRadius: 16, padding: '12px 14px',
                textAlign: 'left', cursor: card.prompt ? 'pointer' : 'default',
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Top accent line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${card.color}60, transparent)`,
                borderRadius: '16px 16px 0 0',
              }} />
              <div style={{ fontSize: 18, marginBottom: 6 }}>{card.icon}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {card.label}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: card.color, letterSpacing: '-0.01em' }}>
                {card.value}
              </div>
              {card.prompt && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.46rem', color: card.color, opacity: 0.5, marginTop: 4 }}>
                  Tap to ask →
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Quick-start prompts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16, maxWidth: 340 }}>
        {suggestions.map(s => (
          <button
            key={s.label}
            onClick={() => onPrompt(s.prompt)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
              background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.55)', borderRadius: 20,
              padding: '5px 12px', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        onClick={onShowCapabilities}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
          background: 'rgba(78,207,158,0.08)', border: '0.5px solid rgba(78,207,158,0.2)',
          color: '#4ecf9e', borderRadius: 12, padding: '7px 16px', cursor: 'pointer',
        }}
      >
        ✦ See everything I can do
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NovaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [messageCount, setMessageCount] = useState(0)
  const [messageLimit, setMessageLimit] = useState(20)
  const [isPremium, setIsPremium] = useState(false)
  const [userTier, setUserTier] = useState<'free' | 'scholar' | 'nova_unlimited'>('free')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showMoods, setShowMoods] = useState(false)
  const [showCrisisPanel, setShowCrisisPanel] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showCapabilities, setShowCapabilities] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { show: showUpgrade, modal: upgradeModal } = useUpgradePrompt()
  const [historyList, setHistoryList] = useState<Array<{
    id: string; title: string | null; conversation_type: string;
    crisis_detected: boolean; updated_at: string; message_count: number;
  }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [dailyBriefData, setDailyBriefData] = useState<{
    name: string | null
    nextExamName: string | null
    daysToExam: number | null
    urgentTaskCount: number
    wellnessScore: number | null
    xpLevel: string
    totalXP: number
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef      = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // ── Image attachment ────────────────────────────────────────────────────────
  const [pendingImage, setPendingImage] = useState<{
    data: string; mimeType: 'image/jpeg'; previewUrl: string
  } | null>(null)
  const [imageCompressing, setImageCompressing] = useState(false)

  // ── Voice I/O ──────────────────────────────────────────────────────────────
  const [voiceMode, setVoiceMode]       = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const newResponseRef = useRef(false)   // true only for live Nova replies, not history loads
  const sr    = useSpeechRecognition()
  const synth = useSpeechSynthesis()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Online / offline detection
  useEffect(() => {
    const up = () => setIsOnline(true)
    const down = () => setIsOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  // Persist messages to localStorage after every exchange (enables offline read-back)
  useEffect(() => {
    if (messages.length === 0) return
    try {
      localStorage.setItem('nova-session-cache', JSON.stringify({
        messages: messages.map(m => ({
          ...m,
          imagePreviewUrl: undefined, // object URLs die on unmount — don't persist
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
        })),
        messageCount,
        messageLimit,
        isPremium,
      }))
    } catch { /* storage quota */ }
  }, [messages, messageCount, messageLimit, isPremium])

  useEffect(() => {
    const loadHistory = async () => {
      // Offline — restore last session from localStorage
      if (!navigator.onLine) {
        try {
          const cached = localStorage.getItem('nova-session-cache')
          if (cached) {
            const data = JSON.parse(cached)
            if (data.messages?.length > 0) {
              setMessages(data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
                ...m, timestamp: new Date(m.timestamp),
              })))
            } else {
              setShowWelcome(true)
            }
            setMessageCount(data.messageCount || 0)
            setMessageLimit(data.messageLimit || 10)
            setIsPremium(data.isPremium || false)
          } else {
            setShowWelcome(true)
          }
        } catch { setShowWelcome(true) }
        setInitialLoading(false)
        return
      }
      try {
        const res = await fetch('/api/nova')
        if (!res.ok) {
          if (res.status === 401) router.push('/auth/login')
          return
        }
        const data = await res.json()
        if (data.messages?.length > 0) {
          setMessages(data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; created_at: string }) => ({
            ...m,
            timestamp: new Date(m.created_at),
          })))
        } else {
          setShowWelcome(true)
        }
        setMessageCount(data.messageCount || 0)
        setMessageLimit(data.messageLimit || 10)
        setIsPremium(data.isPremium || false)
        if (data.tier) setUserTier(data.tier)
        if (data.dailyBriefData) setDailyBriefData(data.dailyBriefData)
      } catch (err) {
        console.error(err)
      } finally {
        setInitialLoading(false)
      }
    }
    loadHistory()
  }, [router])

  // Pre-fill input from ?prompt= (bursary deep-links) or ?text=/?url= (Web Share Target API)
  useEffect(() => {
    const prompt = searchParams.get('prompt')
    const sharedText = searchParams.get('text')
    const sharedUrl = searchParams.get('url')
    const sharedTitle = searchParams.get('title')
    if (prompt) {
      setInput(decodeURIComponent(prompt))
    } else if (sharedText || sharedUrl) {
      const parts = [sharedTitle, sharedText, sharedUrl].filter(Boolean)
      setInput(parts.join(' — '))
    }
  }, [searchParams])

  const openHistory = async () => {
    setShowHistory(true)
    if (!isOnline) {
      // Show cached conversation list
      try {
        const cached = localStorage.getItem('nova-history-list-cache')
        if (cached) setHistoryList(JSON.parse(cached))
      } catch { /* ignore */ }
      return
    }
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/nova/history')
      if (res.ok) {
        const data = await res.json()
        const list = data.conversations ?? []
        setHistoryList(list)
        try { localStorage.setItem('nova-history-list-cache', JSON.stringify(list)) } catch { /* quota */ }
      }
    } catch { /* silent */ } finally {
      setHistoryLoading(false)
    }
  }

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/nova/history?id=${id}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })))
      setConversationId(id)
      setShowWelcome(false)
      setShowHistory(false)
    } catch { /* silent */ }
  }

  const startNewChat = () => {
    setMessages([])
    setConversationId(null)
    setShowWelcome(true)
    setShowHistory(false)
    setShowCrisisPanel(false)
  }

  // Load voice mode preference
  useEffect(() => {
    try { setVoiceMode(localStorage.getItem('nova-voice-mode') === 'true') } catch { /* ignore */ }
  }, [])

  // Mirror live transcript into the textarea while listening
  useEffect(() => {
    if (sr.isListening) setInput(sr.transcript)
  }, [sr.transcript, sr.isListening])

  // Clear speakingMsgId when browser TTS finishes (ElevenLabs clears via onended)
  useEffect(() => {
    if (!synth.isSpeaking && !audioRef.current) setSpeakingMsgId(null)
  }, [synth.isSpeaking])

  // Auto-speak: only for live Nova replies, NOT for history/conversation loads
  useEffect(() => {
    if (!voiceMode || loading) return
    if (!newResponseRef.current) return
    newResponseRef.current = false
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant') return
    speakMsg(last.content, last.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const speakMsg = useCallback(async (rawText: string, msgId: string) => {
    // Toggle off if already speaking this message
    if (speakingMsgId === msgId) {
      audioRef.current?.pause()
      audioRef.current = null
      synth.stop()
      setSpeakingMsgId(null)
      return
    }

    // Stop whatever was playing
    audioRef.current?.pause()
    audioRef.current = null
    synth.stop()
    setSpeakingMsgId(msgId)

    // Try ElevenLabs for premium users
    if (isPremium || userTier === 'nova_unlimited') {
      try {
        const res = await fetch('/api/nova/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: rawText }),
        })
        if (res.ok) {
          const blob = await res.blob()
          const url  = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio
          audio.onended = () => { audioRef.current = null; setSpeakingMsgId(null); URL.revokeObjectURL(url) }
          audio.onerror = () => {
            audioRef.current = null
            URL.revokeObjectURL(url)
            synth.speak(rawText, () => setSpeakingMsgId(null))
          }
          await audio.play()
          return
        }
      } catch { /* fall through to browser TTS */ }
    }

    // Browser TTS (free tier + fallback)
    synth.speak(rawText, () => setSpeakingMsgId(null))
  }, [speakingMsgId, isPremium, userTier, synth.speak, synth.stop])

  const handleMicClick = useCallback(() => {
    if (sr.isListening) { sr.stop(); return }
    sr.start((text) => sendMessage(text))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sr])

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode(prev => {
      const next = !prev
      try { localStorage.setItem('nova-voice-mode', String(next)) } catch { /* ignore */ }
      if (!next) { audioRef.current?.pause(); audioRef.current = null; synth.stop(); setSpeakingMsgId(null) }
      return next
    })
  }, [synth])

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/nova/history?id=${id}`, { method: 'DELETE' })
    setHistoryList(prev => prev.filter(c => c.id !== id))
    if (conversationId === id) startNewChat()
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so the same file can be re-selected
    e.target.value = ''
    setImageCompressing(true)
    try {
      const compressed = await compressImage(file)
      // Revoke previous preview to avoid memory leak
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
      setPendingImage(compressed)
    } catch {
      toast.error('Could not load image — try a different file')
    } finally {
      setImageCompressing(false)
    }
  }

  const clearPendingImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    setPendingImage(null)
  }

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || input).trim()
    if ((!text && !pendingImage) || loading) return
    if (!isOnline) { toast.error("You're offline — Nova needs internet to respond"); return }

    const imagePreviewUrl = pendingImage?.previewUrl
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: selectedMood ? `[Mood: ${selectedMood}] ${text}` : text,
      timestamp: new Date(),
      imagePreviewUrl,
    }

    const capturedImage = pendingImage
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSelectedMood(null)
    setPendingImage(null)  // clear before API call (previewUrl still in userMessage)
    setShowWelcome(false)
    setShowCapabilities(false)
    setLoading(true)

    try {
      const history = messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content,
      }))

      // Read cached correlations so Nova can reference the student's real 30-day patterns
      let correlationInsights = null
      try {
        const now = new Date()
        const weekNum = Math.ceil((now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + 6) / 7)
        const cached = localStorage.getItem(`varsityos-correlations-${now.getFullYear()}-w${weekNum}`)
        if (cached) correlationInsights = JSON.parse(cached).insights ?? null
      } catch { /* ignore */ }

      const res = await fetch('/api/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          mood: selectedMood,
          conversationId,
          correlationInsights,
          ...(capturedImage ? { imageData: capturedImage.data, mediaType: capturedImage.mimeType } : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          toast.error('Slow down — give Nova a moment to breathe')
          setMessages(prev => prev.filter(m => m.id !== userMessage.id))
          setInput(text)
          return
        }
        if (data.error === 'limit_reached' || data.error === 'free_limit_reached') {
          showUpgrade(
            'Nova message limit reached',
            userTier === 'scholar'
              ? 'You\'ve used all 150 Scholar messages this month. Upgrade to Nova Unlimited for unlimited conversations.'
              : 'You\'ve used all 20 free messages this month. Upgrade to Nova Scholar for 150 messages/month.',
            userTier === 'scholar' ? 'nova_unlimited' : 'scholar',
          )
          return
        }
        throw new Error(data.error || 'Failed to send message')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        isCrisis: data.isCrisis,
        resources: data.resources || [],
      }

      newResponseRef.current = true   // allow auto-speak for this response
      setMessages(prev => [...prev, assistantMessage])
      setMessageCount(data.messagesUsed || messageCount + 1)
      if (data.conversationId && !conversationId) setConversationId(data.conversationId)

      trackEvent('nova_message_sent', {
        tier: userTier,
        has_mood: !!selectedMood,
        is_crisis: !!data.isCrisis,
        message_count: data.messagesUsed || messageCount + 1,
      })

      if (data.isCrisis) setShowCrisisPanel(true)
    } catch (err) {
      console.error(err)
      toast.error('Nova had a moment — please try again')
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      setInput(text)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isUnlimited = userTier === 'nova_unlimited'
  const usagePercent = (isPremium || isUnlimited) ? 0 : Math.round((messageCount / messageLimit) * 100)
  const usageLeft = messageLimit - messageCount

  return (
    <div className="chat-page-height flex flex-col bg-[var(--bg-base)]" style={{ position: 'relative', overflow: 'hidden' }}>
      {upgradeModal}
      {/* Nova deep-space ambient — grainy nebula behind the chat */}
      <AmbientImage zone="nova" opacity={0.38} blurPx={5} saturation={1.6}
        overlayColor="linear-gradient(180deg,rgba(5,4,12,0.12) 0%,rgba(10,9,23,0.04) 100%)" />
      {/* History drawer */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="w-80 max-w-[90vw] h-full bg-[var(--bg-base)] border-r border-white/10 flex flex-col shadow-2xl animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div>
                <div className="font-display font-bold text-white text-sm">Chat History</div>
                <div className="font-mono text-[0.55rem] text-white/30 mt-0.5">{historyList.length} conversations</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={startNewChat}
                  className="font-mono text-[0.6rem] px-3 py-1.5 rounded-lg bg-teal-600/20 border border-teal-500/30 text-teal-400 hover:bg-teal-600/30 transition-all"
                >
                  + New chat
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-teal-600 rounded-full typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              ) : historyList.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-2xl mb-2">🌟</div>
                  <p className="font-mono text-[0.6rem] text-white/30">No conversations yet</p>
                  <p className="font-mono text-[0.55rem] text-white/20 mt-1">Start chatting with Nova</p>
                </div>
              ) : (
                historyList.map(convo => {
                  const date = new Date(convo.updated_at)
                  const isToday = date.toDateString() === new Date().toDateString()
                  const dateStr = isToday
                    ? date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                    : date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
                  const isActive = convo.id === conversationId

                  return (
                    <button
                      key={convo.id}
                      onClick={() => loadConversation(convo.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-all group relative',
                        isActive && 'bg-teal-600/10 border-l-2 border-l-teal-500'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {convo.crisis_detected && (
                              <span className="text-[0.5rem] bg-red-500/20 text-red-400 border border-red-500/20 px-1 rounded">SOS</span>
                            )}
                            <span className="font-display font-semibold text-[0.72rem] text-white truncate">
                              {convo.title || 'Conversation'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[0.52rem] text-white/25">{convo.message_count} msgs</span>
                            <span className="font-mono text-[0.52rem] text-white/20">·</span>
                            <span className="font-mono text-[0.52rem] text-white/25">{dateStr}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(convo.id, e)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs flex-shrink-0"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-black/40 backdrop-blur-sm" />
        </div>
      )}

      <TopBar
        title="Nova"
        action={
          <div className="flex items-center gap-2">
            {/* History button */}
            <button
              onClick={openHistory}
              className="font-mono text-[0.58rem] px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
              title="Chat history"
            >
              ☰ History
            </button>
            {/* Capabilities menu button */}
            <button
              onClick={() => setShowCapabilities(!showCapabilities)}
              className={cn(
                'font-mono text-[0.58rem] px-2.5 py-1 rounded-lg border transition-all',
                showCapabilities
                  ? 'bg-teal-600/20 border-teal-500/40 text-teal-400'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
              )}
              title="What can Nova do?"
            >
              ✦ Menu
            </button>

            {isUnlimited && (
              <span className="font-mono text-[0.55rem] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                ✦ UNLIMITED
              </span>
            )}
            {!isUnlimited && !isPremium && (
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all',
                      usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-teal-600'
                    )}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <span className={cn('font-mono text-[0.55rem]',
                  usagePercent > 80 ? 'text-red-400' : usagePercent > 50 ? 'text-amber-400' : 'text-white/30'
                )}>
                  {usageLeft} left
                </span>
              </div>
            )}
            {isPremium && !isUnlimited && (
              <span className="font-mono text-[0.55rem] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                ⭐ {userTier === 'scholar' ? 'SCHOLAR' : 'UNLIMITED'}
              </span>
            )}
          </div>
        }
      />

      {/* Capabilities menu — slides in below TopBar */}
      {showCapabilities && (
        <NovaCapabilitiesMenu
          onSelectPrompt={(msg) => { setInput(msg); inputRef.current?.focus() }}
          onClose={() => setShowCapabilities(false)}
        />
      )}

      {/* Crisis banner */}
      {showCrisisPanel && (
        <div className="mx-4 mt-3 rounded-2xl p-4 bg-red-500/10 border border-red-500/25 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display font-bold text-red-400 text-sm mb-2">
                🆘 Crisis Support Lines
              </div>
              <div className="space-y-1.5">
                {CRISIS_NUMBERS.map(c => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="font-mono text-[0.6rem] text-white/40 w-16">{c.type}</span>
                    <span className="font-display font-bold text-white text-sm">{c.name}:</span>
                    <a
                      href={`tel:${c.number.replace(/\s/g, '')}`}
                      className="font-mono text-sm text-red-300 hover:text-red-200 underline transition-colors"
                    >
                      {c.number}
                    </a>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[0.58rem] text-white/30 mt-2">
                Your university counselling centre is also available — check their website for hours.
              </p>
            </div>
            <button
              onClick={() => setShowCrisisPanel(false)}
              className="text-white/30 hover:text-white/60 text-sm flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {initialLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 bg-teal-600 rounded-full typing-dot"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Welcome state — personalised daily brief */}
            {showWelcome && messages.length === 0 && (
              <NovaDailyBrief
                briefData={dailyBriefData}
                onPrompt={(msg) => sendMessage(msg)}
                onShowCapabilities={() => setShowCapabilities(true)}
              />
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 animate-fade-up',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-900/60 to-teal-900/60 border border-purple-500/20 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
                    🌟
                  </div>
                )}

                <div className="max-w-[82%] space-y-1.5">
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-teal-600/20 border border-teal-600/30 text-white rounded-tr-sm'
                        : msg.isCrisis
                        ? 'bg-red-500/10 border border-red-500/20 text-white rounded-tl-sm'
                        : 'bg-[var(--bg-surface)] border border-white/7 text-white/90 rounded-tl-sm'
                    )}
                  >
                    {/* Image thumbnail in user bubble */}
                    {msg.imagePreviewUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={msg.imagePreviewUrl}
                        alt="Attached"
                        className="w-full max-w-[220px] rounded-xl mb-2 object-cover border border-white/10"
                      />
                    )}
                    {msg.role === 'assistant' ? (
                      <NovaMarkdown>
                        {msg.content.replace(/^\[Mood: .+?\] /, '')}
                      </NovaMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {msg.content.replace(/^\[Mood: .+?\] /, '')}
                      </p>
                    )}
                    <div className={cn(
                      'flex items-center mt-1.5',
                      msg.role === 'user' ? 'justify-end' : 'justify-between'
                    )}>
                      <div className={cn(
                        'font-mono text-[0.52rem]',
                        msg.role === 'user' ? 'text-teal-400/50' : 'text-white/25'
                      )}>
                        {msg.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {msg.role === 'assistant' && synth.isSupported && (
                        <button
                          onClick={() => speakMsg(msg.content, msg.id)}
                          title={speakingMsgId === msg.id ? 'Stop' : 'Read aloud'}
                          className={cn(
                            'ml-2 flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[0.6rem] transition-all',
                            speakingMsgId === msg.id
                              ? 'bg-teal-600/30 text-teal-400 border border-teal-500/40'
                              : 'bg-white/4 text-white/25 hover:bg-white/10 hover:text-white/50 border border-transparent'
                          )}
                        >
                          {speakingMsgId === msg.id ? '◼' : '🔊'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Resource links — shown below assistant message */}
                  {msg.role === 'assistant' && msg.resources && msg.resources.length > 0 && (
                    <div className="space-y-1 pl-1">
                      {msg.resources.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/3 hover:bg-white/7 border border-white/7 hover:border-teal-600/25 rounded-xl px-3 py-2 transition-all group"
                        >
                          <span className="text-sm">{RESOURCE_ICONS[r.type] || '🔗'}</span>
                          <div className="min-w-0">
                            <p className="font-mono text-[0.6rem] text-teal-300/80 group-hover:text-teal-300 truncate transition-colors">
                              {r.title}
                            </p>
                            {r.description && (
                              <p className="font-mono text-[0.55rem] text-white/25 truncate">{r.description}</p>
                            )}
                          </div>
                          <span className="text-white/20 text-xs ml-auto flex-shrink-0">↗</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-900/60 to-teal-900/60 border border-purple-500/20 flex items-center justify-center text-base flex-shrink-0">
                  🌟
                </div>
                <div className="bg-[var(--bg-surface)] border border-white/7 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-5">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="typing-dot"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Mood selector */}
      {showMoods && (
        <div className="px-4 pb-2 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MOODS.map(mood => (
              <button
                key={mood.label}
                onClick={() => {
                  setSelectedMood(selectedMood === mood.label ? null : mood.label)
                  setShowMoods(false)
                }}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-xs font-mono transition-all',
                  selectedMood === mood.label
                    ? 'bg-teal-600/20 border-teal-500/50 text-teal-400'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                )}
              >
                <span className="text-xl">{mood.emoji}</span>
                <span className="text-[0.6rem]">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mood indicator */}
      {selectedMood && (
        <div className="px-4 pb-1 animate-fade-in">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-white/30">Mood set:</span>
            <span className="bg-teal-600/15 text-teal-400 border border-teal-600/20 px-2 py-0.5 rounded-full font-mono text-[0.6rem]">
              {MOODS.find(m => m.label === selectedMood)?.emoji} {selectedMood}
            </span>
            <button
              onClick={() => setSelectedMood(null)}
              className="text-white/25 hover:text-white/50 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for image selection */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Image preview strip — shown when an image is pending */}
      {(pendingImage || imageCompressing) && (
        <div className="px-4 pb-2 animate-fade-in">
          <div className="flex items-center gap-3 bg-white/4 border border-white/10 rounded-xl px-3 py-2">
            {imageCompressing ? (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-white/10 animate-pulse" />
                <span className="font-mono text-[0.6rem] text-white/30">Compressing…</span>
              </div>
            ) : pendingImage && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pendingImage.previewUrl}
                  alt="Attached"
                  className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0"
                />
                <span className="font-mono text-[0.6rem] text-white/50 flex-1">Image ready to send</span>
                <button
                  onClick={clearPendingImage}
                  className="text-white/30 hover:text-red-400 text-xs transition-colors"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-6 pt-2 border-t border-white/7 bg-[var(--bg-base)]">
        {!isUnlimited && !isPremium && usageLeft <= 3 && usageLeft > 0 && (
          <div className="mb-2 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            <span className="font-mono text-[0.6rem] text-amber-400">
              {usageLeft} message{usageLeft === 1 ? '' : 's'} left this month
            </span>
            <Link href="/upgrade" className="font-mono text-[0.6rem] text-amber-400 underline">
              Upgrade →
            </Link>
          </div>
        )}

        {!isUnlimited && usageLeft === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="font-display font-bold text-white text-sm mb-1">Monthly limit reached</p>
            <p className="font-mono text-[0.62rem] text-white/40 mb-3">
              {userTier === 'scholar'
                ? 'Nova Unlimited (R89/month) removes all caps — unlimited messages'
                : 'Nova Scholar gives you 150 messages for R29/month'}
            </p>
            <Link
              href="/upgrade"
              className="inline-block font-display font-bold text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 px-5 py-2 rounded-xl hover:bg-amber-500/20 transition-all"
            >
              ⭐ {userTier === 'scholar' ? 'Go Nova Unlimited — R89/month' : 'Unlock Nova Scholar — R29/month'}
            </Link>
          </div>
        ) : (
          <>
          {!isOnline && (
            <div style={{ margin: '0 0 10px', padding: '8px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📴</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(245,158,11,0.9)' }}>
                Offline — showing last session. Nova can&apos;t respond until you reconnect.
              </span>
            </div>
          )}
          <div className="flex items-end gap-3">
            {/* Mood button */}
            <button
              onClick={() => setShowMoods(!showMoods)}
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all border',
                showMoods || selectedMood
                  ? 'bg-teal-600/20 border-teal-500/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              )}
              aria-label="Set mood"
            >
              {selectedMood ? MOODS.find(m => m.label === selectedMood)?.emoji : '😊'}
            </button>

            {/* Mic button — only when Web Speech API is available */}
            {sr.isSupported && (
              <button
                onClick={handleMicClick}
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all border',
                  sr.isListening
                    ? 'bg-red-500/20 border-red-500/50 animate-pulse'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                )}
                aria-label={sr.isListening ? 'Stop listening' : 'Speak to Nova'}
              >
                {sr.isListening ? '🔴' : '🎙'}
              </button>
            )}

            {/* Camera button — attach an image for Nova Vision */}
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={imageCompressing || loading}
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all border',
                pendingImage
                  ? 'bg-teal-600/20 border-teal-500/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10',
                (imageCompressing || loading) && 'opacity-40 cursor-not-allowed'
              )}
              aria-label="Attach image"
              title="Snap or attach an image — exam paper, textbook, notes"
            >
              📷
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={sr.isListening ? 'Listening…' : 'Talk to Nova…'}
                rows={1}
                maxLength={2000}
                className={cn(
                  'w-full bg-[var(--bg-surface)] border rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 resize-none outline-none transition-all font-body',
                  sr.isListening
                    ? 'border-red-500/40 ring-2 ring-red-500/15'
                    : 'border-white/10 hover:border-white/20 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20'
                )}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                }}
                disabled={loading || sr.isListening}
              />
            </div>

            {/* Auto-read toggle — only when TTS is available */}
            {synth.isSupported && (
              <button
                onClick={toggleVoiceMode}
                title={voiceMode ? 'Auto-read on — click to turn off' : 'Auto-read off — click to enable'}
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all border',
                  voiceMode
                    ? 'bg-teal-600/20 border-teal-500/40 text-teal-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/40'
                )}
                aria-label="Toggle auto-read"
              >
                🔊
              </button>
            )}

            {/* Send button */}
            <button
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !pendingImage) || loading || sr.isListening}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
              aria-label="Send message"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          </>
        )}

        <p className="font-mono text-[0.54rem] text-white/15 text-center mt-2">
          Nova is an AI companion, not a licensed therapist. In crisis, call SADAG: 0800 21 4446
        </p>
      </div>
    </div>
  )
}
