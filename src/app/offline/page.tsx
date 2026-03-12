export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#080f0e] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-3xl mb-6 shadow-teal">
        📶
      </div>

      <h1 className="font-display font-black text-2xl text-white mb-2">
        You&apos;re offline
      </h1>
      <p className="font-mono text-xs text-white/40 mb-10 max-w-xs">
        No data connection detected. Here&apos;s what you can still access:
      </p>

      <div className="w-full max-w-xs space-y-3 mb-10">
        {[
          { icon: '🏠', label: 'Dashboard',     note: 'Last saved data' },
          { icon: '📚', label: 'Study Planner', note: 'Tasks, exams, timetable' },
          { icon: '💰', label: 'Budget',        note: 'Expenses & summary' },
          { icon: '🍲', label: 'Meal Prep',     note: 'Meal plans & grocery list' },
        ].map(item => (
          <div
            key={item.label}
            className="flex items-center gap-3 bg-white/5 border border-white/7 rounded-xl px-4 py-3"
          >
            <span className="text-xl">{item.icon}</span>
            <div className="text-left">
              <div className="font-display text-sm text-white">{item.label}</div>
              <div className="font-mono text-[0.6rem] text-white/35">{item.note}</div>
            </div>
            <span className="ml-auto font-mono text-[0.55rem] text-teal-400 uppercase tracking-wide">Available</span>
          </div>
        ))}

        <div className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl px-4 py-3 opacity-50">
          <span className="text-xl">🌟</span>
          <div className="text-left">
            <div className="font-display text-sm text-white/50">Nova AI</div>
            <div className="font-mono text-[0.6rem] text-white/25">Needs data connection</div>
          </div>
          <span className="ml-auto font-mono text-[0.55rem] text-white/25 uppercase tracking-wide">Offline</span>
        </div>
      </div>

      <p className="font-mono text-[0.6rem] text-white/20">
        VarsityOS saves your data locally so you&apos;re never left empty-handed.
      </p>
    </div>
  )
}
