'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// Minimal types for the Web Speech API (not in TypeScript lib by default)
interface SRInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((e: SREvent) => void) | null
  onend:    (() => void) | null
  onerror:  ((e: SRErrorEvent) => void) | null
  start: () => void
  stop:  () => void
  abort: () => void
}

interface SRResult { readonly isFinal: boolean; readonly [i: number]: { transcript: string } }
interface SRResultList { readonly length: number; readonly [i: number]: SRResult }
interface SREvent extends Event { readonly results: SRResultList; readonly resultIndex: number }
interface SRErrorEvent extends Event { readonly error: string }
type SRConstructor = new () => SRInstance

function getSR(): SRConstructor | null {
  if (typeof window === 'undefined') return null
  return (
    (window as unknown as Record<string, unknown>)['SpeechRecognition'] as SRConstructor ||
    (window as unknown as Record<string, unknown>)['webkitSpeechRecognition'] as SRConstructor ||
    null
  )
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const srRef = useRef<SRInstance | null>(null)
  const onFinalRef = useRef<((text: string) => void) | null>(null)

  useEffect(() => {
    setIsSupported(!!getSR())
  }, [])

  const start = useCallback((onFinal: (text: string) => void) => {
    const SR = getSR()
    if (!SR) return
    onFinalRef.current = onFinal

    const sr = new SR()
    sr.continuous = false
    sr.interimResults = true
    sr.lang = 'en-ZA'
    sr.maxAlternatives = 1

    sr.onresult = (e: SREvent) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const t = r[0].transcript
        if (r.isFinal) final += t; else interim += t
      }
      setTranscript(final || interim)
    }

    sr.onend = () => {
      setIsListening(false)
      setTranscript(prev => {
        if (prev.trim()) onFinalRef.current?.(prev.trim())
        return ''
      })
    }

    sr.onerror = () => {
      setIsListening(false)
      setTranscript('')
    }

    srRef.current = sr
    sr.start()
    setIsListening(true)
    setTranscript('')
  }, [])

  const stop = useCallback(() => {
    srRef.current?.stop()
    setIsListening(false)
  }, [])

  const reset = useCallback(() => {
    srRef.current?.abort()
    setIsListening(false)
    setTranscript('')
  }, [])

  return { isListening, transcript, isSupported, start, stop, reset }
}
