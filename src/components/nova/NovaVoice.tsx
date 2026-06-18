'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Web Speech API minimal types ────────────────────────────────────────────

interface SRInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((e: SREvent) => void) | null
  onend: (() => void) | null
  onerror: ((e: SRErrorEvent) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SRResult {
  readonly isFinal: boolean
  readonly [i: number]: { transcript: string }
}
interface SRResultList {
  readonly length: number
  readonly [i: number]: SRResult
}
interface SREvent extends Event {
  readonly results: SRResultList
  readonly resultIndex: number
}
interface SRErrorEvent extends Event {
  readonly error: string
}
type SRConstructor = new () => SRInstance

function getSRConstructor(): SRConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w['SpeechRecognition'] as SRConstructor) || (w['webkitSpeechRecognition'] as SRConstructor) || null
}

// ─── Voice hook ───────────────────────────────────────────────────────────────

export interface NovaVoiceHook {
  isSupported: boolean
  isListening: boolean
  isSpeaking: boolean
  startListening: (onTranscript: (text: string) => void) => void
  stopListening: () => void
  speak: (text: string) => void
  cancelSpeech: () => void
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.lang === 'en-ZA') ||
    voices.find(v => v.lang === 'en-GB' && /female|zira|hazel|susan/i.test(v.name)) ||
    voices.find(v => v.lang.startsWith('en') && /female|samantha|karen|moira|veena/i.test(v.name)) ||
    voices.find(v => v.lang === 'en-GB') ||
    voices.find(v => v.lang.startsWith('en')) ||
    null
  )
}

export function useNovaVoice(): NovaVoiceHook {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const srRef = useRef<SRInstance | null>(null)

  // Detect support client-side only
  useEffect(() => {
    const srOk = !!getSRConstructor()
    const synthOk = typeof window !== 'undefined' && 'speechSynthesis' in window
    setIsSupported(srOk || synthOk)

    // Pre-load voices so they are available when speak() is called
    if (synthOk) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }

    return () => {
      // Cleanup on unmount
      srRef.current?.abort()
      window.speechSynthesis?.cancel()
    }
  }, [])

  const stopListening = useCallback(() => {
    srRef.current?.abort()
    srRef.current = null
    setIsListening(false)
  }, [])

  const startListening = useCallback((onTranscript: (text: string) => void) => {
    const SR = getSRConstructor()
    if (!SR) return

    // Clean up any previous instance
    srRef.current?.abort()
    srRef.current = null

    const sr = new SR()
    sr.continuous = false
    sr.interimResults = false
    sr.lang = 'en-ZA'
    sr.maxAlternatives = 1

    sr.onresult = (e: SREvent) => {
      let transcript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          transcript += e.results[i][0].transcript
        }
      }
      if (transcript.trim()) {
        onTranscript(transcript.trim())
      }
      sr.stop()
    }

    sr.onend = () => {
      setIsListening(false)
      srRef.current = null
    }

    sr.onerror = (e: SRErrorEvent) => {
      console.error('[NovaVoice] SpeechRecognition error:', e.error)
      setIsListening(false)
      srRef.current = null
    }

    srRef.current = sr
    try {
      sr.start()
      setIsListening(true)
    } catch (err) {
      console.error('[NovaVoice] Failed to start recognition:', err)
      srRef.current = null
    }
  }, [])

  const cancelSpeech = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel()
    }
    setIsSpeaking(false)
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // Cancel any current speech first
    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    // Strip markdown for cleaner speech
    const cleaned = text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim()
      .slice(0, 1000)

    if (!cleaned) return

    const utt = new SpeechSynthesisUtterance(cleaned)
    utt.lang = 'en-ZA'
    utt.rate = 1.0
    utt.pitch = 1.0

    const voice = pickEnglishVoice()
    if (voice) utt.voice = voice

    utt.onstart = () => setIsSpeaking(true)
    utt.onend = () => setIsSpeaking(false)
    utt.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utt)
  }, [])

  return {
    isSupported,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  }
}
