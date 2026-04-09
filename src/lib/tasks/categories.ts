export const TASK_CATEGORY_GROUPS = {
  academic: {
    label: 'Academic',
    color: '#0d9488',
    icon: '📚',
    types: ['assignment', 'exam', 'test', 'project', 'presentation', 'reading', 'tutorial', 'lab', 'group_project'],
  },
  life: {
    label: 'Life & Admin',
    color: '#5C6BC0',
    icon: '🏠',
    types: ['reminder', 'meeting', 'appointment', 'chore', 'errand', 'admin'],
  },
  wellness: {
    label: 'Wellness',
    color: '#66BB6A',
    icon: '🌿',
    types: ['self_care', 'exercise', 'social', 'personal_goal'],
  },
  work: {
    label: 'Work',
    color: '#FFA726',
    icon: '💼',
    types: ['work_shift', 'work_task'],
  },
  finance: {
    label: 'Finance',
    color: '#C9A84C',
    icon: '💰',
    types: ['payment_due', 'budget_review'],
  },
} as const

export type TaskCategoryGroup = keyof typeof TASK_CATEGORY_GROUPS

export const TASK_TYPE_LABELS: Record<string, string> = {
  // Academic (legacy capitalized forms also supported)
  assignment:    'Assignment',
  Assignment:    'Assignment',
  exam:          'Exam',
  test:          'Test / Quiz',
  Test:          'Test',
  project:       'Project',
  Project:       'Project',
  presentation:  'Presentation',
  Presentation:  'Presentation',
  reading:       'Reading',
  Reading:       'Reading',
  tutorial:      'Tutorial',
  lab:           'Lab / Practical',
  group_project: 'Group Project',
  // Life & Admin
  reminder:    'Reminder',
  meeting:     'Meeting',
  appointment: 'Appointment',
  chore:       'Chore',
  errand:      'Errand',
  admin:       'Admin Task',
  // Wellness
  self_care:     'Self Care',
  exercise:      'Exercise',
  social:        'Social',
  personal_goal: 'Personal Goal',
  // Work
  work_shift: 'Work Shift',
  work_task:  'Work Task',
  // Finance
  payment_due:   'Payment Due',
  budget_review: 'Budget Review',
  // Other
  Other:  'Other',
  other:  'Other',
}

export function getGroupForType(type: string): TaskCategoryGroup | null {
  for (const [group, def] of Object.entries(TASK_CATEGORY_GROUPS)) {
    if ((def.types as readonly string[]).includes(type.toLowerCase())) {
      return group as TaskCategoryGroup
    }
  }
  return null
}

export function groupColor(type: string): string {
  const group = getGroupForType(type)
  return group ? TASK_CATEGORY_GROUPS[group].color : '#4b5563'
}
