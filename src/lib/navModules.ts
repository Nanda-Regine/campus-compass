// Single source of truth for the 6 primary nav destinations shown in
// FeatureGrid (bento cards) and ModulePillList (desktop sidebar pills).
// Components derive their display from this array; no duplicate color/icon defs.

export type NavModule = {
  href:        string
  label:       string
  icon:        string
  color:       string  // accent / subColor used for text, bars, hover rings
  iconBg:      string  // icon container background
  wideInGrid?: boolean // spans full width in the bento grid
}

export const NAV_MODULES: readonly NavModule[] = [
  { href: '/nova',             label: 'Nova',   icon: '✨', color: '#9b6fd4', iconBg: 'rgba(155,111,212,0.15)', wideInGrid: true  },
  { href: '/study',            label: 'Study',  icon: '📚', color: '#4ecf9e', iconBg: 'rgba(78,207,158,0.10)'                    },
  { href: '/budget',           label: 'Budget', icon: '💰', color: '#c9a84c', iconBg: 'rgba(201,168,76,0.10)'                    },
  { href: '/meals',            label: 'Meals',  icon: '🍲', color: '#e8834a', iconBg: 'rgba(232,131,74,0.10)'                    },
  { href: '/dashboard/work',   label: 'Work',   icon: '💼', color: '#7090d0', iconBg: 'rgba(112,144,208,0.10)'                   },
  { href: '/dashboard/groups', label: 'Groups', icon: '👥', color: '#7090d0', iconBg: 'rgba(112,144,208,0.10)', wideInGrid: true  },
]
