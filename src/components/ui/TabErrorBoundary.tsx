'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  label?: string
}

interface State {
  error: Error | null
}

export default class TabErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[TabErrorBoundary:${this.props.label ?? 'unknown'}]`, error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error.message
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="font-display font-bold text-white text-sm mb-1">
            {this.props.label ? `${this.props.label} ran into a problem` : 'Something went wrong'}
          </p>
          {msg && (
            <p className="font-mono text-[0.58rem] text-white/55 mb-5 max-w-xs leading-relaxed">
              {msg}
            </p>
          )}
          <button
            onClick={() => this.setState({ error: null })}
            className="font-mono text-[0.65rem] bg-teal-600/15 border border-teal-600/30 text-teal-400 px-4 py-2 rounded-xl transition-all hover:bg-teal-600/25"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
