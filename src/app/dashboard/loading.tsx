export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0c0f0e] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-teal-600/20 flex items-center justify-center animate-pulse">
          <span className="text-xl">🌟</span>
        </div>
        <div className="font-mono text-[0.6rem] text-white/30 tracking-widest uppercase animate-pulse">Loading…</div>
      </div>
    </div>
  )
}
