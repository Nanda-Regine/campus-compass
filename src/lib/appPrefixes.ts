// Single source of truth for which routes render the desktop sidebar and reserve
// the --sidebar-w content offset. The pre-paint inline script in app/layout.tsx, the
// Sidebar, and the MobileSidebar ALL derive from this list so they can never disagree.
// A mismatch causes a visible desktop layout jump on hydration (the script reserves
// 220px before paint, then Sidebar resets it to 0 if the route isn't in its own list).
export const APP_PREFIXES = [
  '/dashboard', '/study', '/budget', '/meals', '/nova', '/profile',
  '/campus-life', '/referral', '/streak', '/upgrade', '/career',
  '/bursaries', '/notes', '/social', '/tutoring', '/health', '/sleep',
  '/fitness', '/safety', '/movement', '/civic', '/regulate', '/international',
  '/lms', '/housing', '/launchpad', '/broadcasts', '/marketplace', '/src',
  '/stokvel', '/skills', '/tour', '/groups', '/jobs', '/mentors', '/growth',
  '/entrepreneur', '/wisdom', '/reader', '/discounts', '/feedback', '/security', '/admin',
] as const
