'use client'

import { useMemo, memo } from 'react'
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Module, Exam } from '@/types'

interface Props {
  modules: Module[]
  exams: Exam[]
}

// ── Custom node components ────────────────────────────────────────────────────

const CenterNode = memo(() => (
  <div style={{
    width: 56, height: 56, borderRadius: '50%',
    background: 'linear-gradient(135deg, #4ecf9e 0%, #38bdf8 100%)',
    border: '2px solid rgba(78,207,158,0.6)',
    boxShadow: '0 0 24px rgba(78,207,158,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px',
  }}>
    🎓
    <Handle type="source" position={Position.Right} style={{ opacity: 0, border: 'none', background: 'none', width: 0, height: 0 }} />
  </div>
))
CenterNode.displayName = 'CenterNode'

const ModuleNode = memo(({ data }: { data: Record<string, unknown> }) => {
  const color = String(data.color ?? '#4ecf9e')
  return (
    <div style={{
      padding: '7px 11px',
      borderRadius: '10px',
      background: 'rgba(10,8,24,0.92)',
      border: `1px solid ${color}55`,
      boxShadow: `0 0 10px ${color}18`,
      minWidth: '64px',
      textAlign: 'center',
    }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, border: 'none', background: 'none', width: 0, height: 0 }} />
      <div style={{ color: color, fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
        {String(data.label)}
      </div>
      {!!data.name && (
        <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '9px', marginTop: '2px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {String(data.name)}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0, border: 'none', background: 'none', width: 0, height: 0 }} />
    </div>
  )
})
ModuleNode.displayName = 'ModuleNode'

const ExamNode = memo(({ data }: { data: Record<string, unknown> }) => {
  const daysLeft = Number(data.daysLeft)
  const urgent   = daysLeft <= 7
  const color    = urgent ? '#ef4444' : daysLeft <= 14 ? '#f59e0b' : '#6b7280'
  return (
    <div style={{
      padding: '5px 9px',
      borderRadius: '8px',
      background: 'rgba(6,4,18,0.95)',
      border: `1px solid ${color}45`,
      textAlign: 'center',
      minWidth: '52px',
    }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, border: 'none', background: 'none', width: 0, height: 0 }} />
      <div style={{ color: color, fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
        {String(data.label)}
      </div>
      <div style={{ color, fontSize: '8px', opacity: 0.8, marginTop: '2px' }}>
        {daysLeft}d
      </div>
    </div>
  )
})
ExamNode.displayName = 'ExamNode'

// Stable reference — must live outside component to avoid re-registration
const NODE_TYPES = { center: CenterNode, module: ModuleNode, exam: ExamNode }

// ── Layout builder ────────────────────────────────────────────────────────────
const CANVAS_W = 600
const CANVAS_H = 440
const CX = CANVAS_W / 2
const CY = CANVAS_H / 2
const INNER_R = 152
const OUTER_R = 280

// SA university module colours → a consistent orbit ring colour
const MODULE_COLORS: Record<string, string> = {
  red:    '#f87171',
  orange: '#fb923c',
  amber:  '#fbbf24',
  yellow: '#facc15',
  lime:   '#a3e635',
  green:  '#4ade80',
  teal:   '#4ecf9e',
  cyan:   '#22d3ee',
  sky:    '#38bdf8',
  blue:   '#60a5fa',
  indigo: '#818cf8',
  violet: '#a78bfa',
  purple: '#c084fc',
  pink:   '#f472b6',
  rose:   '#fb7185',
}

function moduleColor(m: Module): string {
  const raw = (m.color ?? m.colour ?? 'teal') as string
  return MODULE_COLORS[raw.toLowerCase()] ?? '#4ecf9e'
}

function buildGraph(modules: Module[], exams: Exam[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const upcoming = exams.filter(e => new Date(e.exam_date) >= new Date())

  // Center node
  nodes.push({
    id: 'center',
    type: 'center',
    position: { x: CX - 28, y: CY - 28 },
    data: {},
    selectable: false,
    draggable: false,
  })

  // Module ring (inner orbit)
  modules.forEach((m, i) => {
    const angle = (2 * Math.PI * i) / Math.max(modules.length, 1) - Math.PI / 2
    const x = CX + INNER_R * Math.cos(angle) - 38
    const y = CY + INNER_R * Math.sin(angle) - 18
    nodes.push({
      id: `m-${m.id}`,
      type: 'module',
      position: { x, y },
      data: { label: m.module_code || m.code, name: m.module_name || m.name, color: moduleColor(m) },
      selectable: false,
      draggable: false,
    })
    edges.push({
      id: `ec-${m.id}`,
      source: 'center',
      target: `m-${m.id}`,
      style: { stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1.5 },
      animated: false,
    })
  })

  // Exam ring (outer orbit)
  upcoming.forEach((e, i) => {
    const angle = (2 * Math.PI * i) / Math.max(upcoming.length, 1) - Math.PI / 2
    const x = CX + OUTER_R * Math.cos(angle) - 28
    const y = CY + OUTER_R * Math.sin(angle) - 16
    const daysLeft = Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86_400_000)
    const code = e.module?.module_code ?? e.module?.code ?? '?'

    nodes.push({
      id: `x-${e.id}`,
      type: 'exam',
      position: { x, y },
      data: { label: code, daysLeft },
      selectable: false,
      draggable: false,
    })

    // Connect exam to its module if present
    const parent = modules.find(m => m.id === e.module_id)
    edges.push({
      id: `em-${e.id}`,
      source: parent ? `m-${parent.id}` : 'center',
      target: `x-${e.id}`,
      style: {
        stroke: daysLeft <= 7 ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.25)',
        strokeWidth: 1,
        strokeDasharray: '4 3',
      },
      animated: daysLeft <= 7,
    })
  })

  return { nodes, edges }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ModuleOrbitMap({ modules, exams }: Props) {
  const { nodes, edges } = useMemo(() => buildGraph(modules, exams), [modules, exams])

  const upcomingCount = exams.filter(e => new Date(e.exam_date) >= new Date()).length

  return (
    <div style={{
      background: 'rgba(6,4,18,0.95)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '18px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: '#e5e7eb', margin: 0 }}>
          Module Orbit
        </p>
        <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>
          {modules.length} module{modules.length !== 1 ? 's' : ''} · {upcomingCount} upcoming exam{upcomingCount !== 1 ? 's' : ''}
        </p>
      </div>

      {modules.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: '#4b5563', fontSize: '13px' }}>Add modules to see your academic orbit.</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: '400px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            panOnDrag={false}
            panOnScroll={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              color="rgba(255,255,255,0.025)"
              gap={32}
              size={1}
            />
          </ReactFlow>
        </div>
      )}

      {/* Legend */}
      <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ecf9e', display: 'inline-block' }} />
          <span style={{ color: '#6b7280', fontSize: '10px' }}>Module</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          <span style={{ color: '#6b7280', fontSize: '10px' }}>Exam upcoming</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          <span style={{ color: '#6b7280', fontSize: '10px' }}>Exam in ≤7 days</span>
        </div>
      </div>
    </div>
  )
}
