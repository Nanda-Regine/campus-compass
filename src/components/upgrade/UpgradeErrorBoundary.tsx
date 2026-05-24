'use client'

import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { crashed: boolean }

export default class UpgradeErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  componentDidCatch(error: Error) {
    console.error('[UpgradePage] Boundary caught:', error.message)
  }

  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          padding: '24px 16px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
        }}>
          <p style={{ marginBottom: 12 }}>Something went wrong loading the upgrade page.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              border: '0.5px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
            }}
          >
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
