'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim()
}

function pickVoice(): SpeechSynthesisVoice | null {
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

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setIsSupported('speechSynthesis' in window)
    // Pre-load voices (Chrome needs this trigger)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  const speak = useCallback((rawText: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const text = cleanForSpeech(rawText).slice(0, 1000)
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang  = 'en-ZA'
    utt.rate  = 1.05
    utt.pitch = 1.0

    // Voices may load lazily — try immediately, then retry on voiceschanged
    const voice = pickVoice()
    if (voice) utt.voice = voice

    utt.onstart = () => setIsSpeaking(true)
    utt.onend   = () => { setIsSpeaking(false); onEnd?.() }
    utt.onerror = () => { setIsSpeaking(false); onEnd?.() }

    utterRef.current = utt
    window.speechSynthesis.speak(utt)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  return { speak, stop, isSpeaking, isSupported }
}
