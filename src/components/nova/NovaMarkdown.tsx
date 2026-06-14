'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const components: Components = {
  // Paragraphs — tight spacing, last one has no bottom margin
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),

  // Emphasis
  strong: ({ children }) => (
    <strong className="font-bold text-white">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-white/80">{children}</em>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed pl-0.5">{children}</li>
  ),

  // Code — inline vs block
  // pre wraps block code; code inside pre inherits its styling
  pre: ({ children }) => (
    <pre className="bg-black/50 border border-white/10 rounded-xl p-3 my-2 last:mb-0 overflow-x-auto text-xs font-mono text-teal-200 leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ children, className }) => {
    // Block code has a language-* className from remark, or is inside <pre>
    // Inline code has no className and contains no newlines
    const isInline =
      !className &&
      typeof children === 'string' &&
      !children.includes('\n')

    if (isInline) {
      return (
        <code className="bg-teal-900/40 text-teal-300 px-1.5 py-0.5 rounded text-[0.82em] font-mono">
          {children}
        </code>
      )
    }
    // Block code — unstyled here; parent <pre> provides the container
    return <code className={className}>{children}</code>
  },

  // Links — open externally, styled teal
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-teal-400 underline underline-offset-2 hover:text-teal-300 transition-colors"
    >
      {children}
    </a>
  ),

  // Headings — Nova occasionally structures with headers
  h1: ({ children }) => (
    <h1 className="font-display font-bold text-[1rem] text-white mb-1.5 mt-3 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display font-bold text-[0.9rem] text-white mb-1 mt-2.5 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display font-semibold text-[0.85rem] text-white/90 mb-1 mt-2 first:mt-0">
      {children}
    </h3>
  ),

  // Blockquotes — used for key insights
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-teal-500/50 pl-3 my-2 last:mb-0 text-white/65 italic">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => <hr className="border-white/10 my-3" />,

  // Tables (remark-gfm)
  table: ({ children }) => (
    <div className="overflow-x-auto my-2 last:mb-0">
      <table className="text-xs w-full border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-white/15">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-1.5 font-mono font-semibold text-teal-300/80 uppercase tracking-wide text-[0.65rem]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-1.5 border-b border-white/5 text-white/80">{children}</td>
  ),
}

export default function NovaMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  )
}
