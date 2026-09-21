export interface Archetype {
  id: string
  name: string
  blurb: string
  /** Fed into template scoring alongside whatever the user dumps. */
  keywords: string[]
}

export interface PillarTemplate {
  id: string
  name: string
  blurb: string
  pillars: string[]
  /** Archetypes this set suits. */
  archetypes: string[]
  keywords: string[]
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'builder',
    name: 'The Builder',
    blurb:
      'You are making something of your own. The work is exciting, and it quietly eats everything else.',
    keywords: [
      'launch', 'ship', 'build', 'startup', 'business', 'project', 'product',
      'design', 'code', 'client', 'freelance', 'revenue', 'pitch', 'launch',
    ],
  },
  {
    id: 'operator',
    name: 'The Operator',
    blurb:
      'A demanding job takes the best hours of your day. You want the rest of your life to survive it.',
    keywords: [
      'work', 'job', 'career', 'promotion', 'deadline', 'meetings', 'manager',
      'overtime', 'burnout', 'commute', 'email', 'performance',
    ],
  },
  {
    id: 'caretaker',
    name: 'The Caretaker',
    blurb: 'People depend on you. You are very good at putting yourself last.',
    keywords: [
      'kids', 'family', 'parents', 'partner', 'caring', 'home', 'cooking',
      'school', 'chores', 'appointments', 'groceries', 'household',
    ],
  },
  {
    id: 'rebuilder',
    name: 'The Rebuilder',
    blurb:
      'You are coming back from a rough stretch. Small and steady beats ambitious right now.',
    keywords: [
      'recovery', 'therapy', 'sleep', 'anxiety', 'burnout', 'reset', 'habits',
      'routine', 'debt', 'health', 'rebuild', 'stress', 'walking',
    ],
  },
  {
    id: 'student',
    name: 'The Student',
    blurb:
      'You are learning something hard on purpose, around everything else you already do.',
    keywords: [
      'study', 'course', 'exam', 'degree', 'learn', 'practice', 'language',
      'certification', 'reading', 'research', 'skill', 'revision',
    ],
  },
  {
    id: 'steady',
    name: 'The Steady',
    blurb:
      'Nothing is on fire. You just want the good weeks to stop being accidental.',
    keywords: [
      'consistency', 'balance', 'habits', 'fitness', 'hobby', 'friends',
      'savings', 'maintain', 'routine', 'discipline', 'gym',
    ],
  },
]

export const TEMPLATES: PillarTemplate[] = [
  {
    id: 'ship-and-stay-whole',
    name: 'Ship and Stay Whole',
    blurb: 'For building something without disappearing into it.',
    pillars: ['Craft', 'Health', 'Money', 'People', 'Mind'],
    archetypes: ['builder'],
    keywords: [
      'ship', 'launch', 'build', 'product', 'client', 'revenue', 'design',
      'code', 'startup', 'project', 'pitch', 'marketing', 'website',
    ],
  },
  {
    id: 'hold-the-line',
    name: 'Hold the Line',
    blurb: 'For a job that would take everything if you let it.',
    pillars: ['Work', 'Body', 'Home', 'Money', 'Rest'],
    archetypes: ['operator'],
    keywords: [
      'work', 'job', 'deadline', 'meetings', 'promotion', 'overtime', 'boss',
      'career', 'burnout', 'commute', 'rest', 'sleep', 'email',
    ],
  },
  {
    id: 'people-first',
    name: 'People First',
    blurb: 'For a life with other people in it who need you.',
    pillars: ['People', 'Home', 'Health', 'Money', 'Self'],
    archetypes: ['caretaker'],
    keywords: [
      'kids', 'family', 'partner', 'parents', 'home', 'cooking', 'school',
      'chores', 'friends', 'groceries', 'appointments', 'household',
    ],
  },
  {
    id: 'back-on-your-feet',
    name: 'Back On Your Feet',
    blurb: 'Small, unglamorous, repeatable. For rebuilding a base.',
    pillars: ['Health', 'Mind', 'Money', 'People', 'Routine'],
    archetypes: ['rebuilder'],
    keywords: [
      'sleep', 'therapy', 'recovery', 'anxiety', 'habits', 'routine', 'debt',
      'reset', 'stress', 'walking', 'meals', 'rebuild',
    ],
  },
  {
    id: 'learn-deep',
    name: 'Learn Deep',
    blurb: 'For carrying real study alongside a full life.',
    pillars: ['Study', 'Health', 'Craft', 'People', 'Rest'],
    archetypes: ['student'],
    keywords: [
      'study', 'exam', 'course', 'degree', 'practice', 'reading', 'research',
      'language', 'skill', 'learn', 'notes', 'revision',
    ],
  },
  {
    id: 'the-good-week',
    name: 'The Good Week',
    blurb: 'A balanced default, for making good weeks repeatable.',
    pillars: ['Health', 'Craft', 'People', 'Money', 'Mind'],
    archetypes: ['steady'],
    keywords: [
      'balance', 'consistency', 'fitness', 'hobby', 'friends', 'savings',
      'habits', 'reading', 'gym', 'cooking', 'discipline',
    ],
  },
]
