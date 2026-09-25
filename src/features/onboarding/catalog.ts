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
  /**
   * What the brain dump is matched against: the everyday words someone in
   * this life actually writes ("call mom", "can't sleep", "invoice clients"),
   * grouped by the pillar they point to. Variants the crude stemmer can't
   * join ("save" and "savings", "hobby" and "hobbies") are listed both ways.
   */
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
      'design', 'code', 'client', 'freelance', 'revenue', 'pitch',
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

/**
 * No pillar name appears in two templates. Shared names (five sets had
 * Health, five had Money) made the choices read as the same list reshuffled;
 * each set now names things the way that life does: a builder's money is
 * Runway, a caretaker's is Budget.
 */
export const TEMPLATES: PillarTemplate[] = [
  {
    id: 'ship-and-stay-whole',
    name: 'Ship and Stay Whole',
    blurb: 'For building something without disappearing into it.',
    pillars: ['Build', 'Audience', 'Runway', 'Energy', 'Loved Ones'],
    archetypes: ['builder'],
    keywords: [
      // The work itself (Build)
      'ship', 'shipping', 'launch', 'build', 'product', 'app', 'website', 'code',
      'coding', 'design', 'feature', 'bug', 'prototype', 'mvp', 'portfolio',
      'startup', 'business', 'project', 'founder', 'freelance', 'hustle',
      // Who it's for (Audience)
      'client', 'customers', 'users', 'audience', 'followers', 'newsletter',
      'content', 'blog', 'podcast', 'video', 'post', 'marketing', 'brand', 'pitch',
      // Money for a builder (Runway)
      'runway', 'revenue', 'sales', 'sell', 'pricing', 'invoice', 'invoices',
      'funding', 'investors', 'profit', 'cash',
      // Keeping it sustainable (Energy, Loved Ones)
      'energy', 'loved',
    ],
  },
  {
    id: 'hold-the-line',
    name: 'Hold the Line',
    blurb: 'For a job that would take everything if you let it.',
    pillars: ['Day Job', 'Boundaries', 'Training', 'Household', 'Downtime'],
    archetypes: ['operator'],
    keywords: [
      // The job (Day Job)
      'work', 'job', 'office', 'shift', 'shifts', 'deadline', 'meetings', 'boss',
      'manager', 'team', 'coworker', 'colleague', 'email', 'inbox',
      'presentation', 'performance', 'promotion', 'career', 'salary', 'paycheck',
      'interview', 'quit', 'overtime', 'busy', 'commute', 'commuting', 'burnout',
      // Protecting the rest of the day (Boundaries, Downtime)
      'boundaries', 'boundary', 'weekend', 'lunch', 'downtime', 'unwind',
      'relax', 'rest', 'sleep', 'vacation', 'holiday', 'pto',
      // Keeping the body going (Training)
      'training', 'workout',
    ],
  },
  {
    id: 'people-first',
    name: 'People First',
    blurb: 'For a life with other people in it who need you.',
    pillars: ['Family', 'Logistics', 'Budget', 'My Health', 'Me Time'],
    archetypes: ['caretaker'],
    keywords: [
      // The people (Family)
      'family', 'families', 'kids', 'children', 'baby', 'son', 'daughter', 'mom',
      'mum', 'dad', 'parents', 'partner', 'husband', 'wife', 'sister', 'brother',
      'grandma', 'grandpa', 'pets', 'dog', 'care', 'caring',
      // Running the house (Logistics)
      'home', 'household', 'chores', 'laundry', 'dishes', 'cleaning', 'cooking',
      'dinner', 'groceries', 'grocery', 'errands', 'school', 'daycare', 'pickup',
      'appointments', 'doctor', 'dentist', 'calendar', 'logistics',
      // The money and the self (Budget, My Health, Me Time)
      'budget', 'bills', 'myself',
    ],
  },
  {
    id: 'back-on-your-feet',
    name: 'Back On Your Feet',
    blurb: 'Small, unglamorous, repeatable. For rebuilding a base.',
    pillars: ['Sleep', 'Headspace', 'Daily Basics', 'Money Reset', 'Support'],
    archetypes: ['rebuilder'],
    keywords: [
      // Rest (Sleep)
      'sleep', 'tired', 'exhausted', 'insomnia', 'bed', 'bedtime', 'nap',
      'doomscrolling', 'scrolling',
      // The inside (Headspace, Support)
      'therapy', 'therapist', 'counseling', 'anxiety', 'anxious', 'panic',
      'depression', 'depressed', 'overwhelmed', 'lonely', 'stress', 'mental',
      'headspace', 'journal', 'meditate', 'meditation', 'breathe', 'grief',
      'breakup', 'divorce', 'recovery', 'sober', 'drinking', 'support',
      // The base (Daily Basics)
      'routine', 'basics', 'meals', 'eat', 'water', 'shower', 'walk', 'walking',
      'reset', 'rebuild',
      // Money, starting over (Money Reset)
      'debt', 'loan', 'credit', 'broke', 'owe',
    ],
  },
  {
    id: 'learn-deep',
    name: 'Learn Deep',
    blurb: 'For carrying real study alongside a full life.',
    pillars: ['Coursework', 'Practice', 'Reading', 'Rest Days', 'Social Life'],
    archetypes: ['student'],
    keywords: [
      // The course (Coursework)
      'study', 'studying', 'class', 'lecture', 'lectures', 'homework',
      'assignment', 'essay', 'thesis', 'paper', 'exam', 'quiz', 'midterm',
      'finals', 'grades', 'course', 'degree', 'university', 'college', 'semester',
      'professor', 'tutor', 'bootcamp', 'certification', 'textbook', 'library',
      'notes', 'revision', 'research',
      // Getting better at it (Practice, Reading)
      'practice', 'practicing', 'flashcards', 'instrument', 'piano', 'guitar',
      'language', 'skill', 'learn', 'reading', 'book', 'chapter',
      // Around it (Social Life)
      'social', 'roommate', 'classmates',
    ],
  },
  {
    id: 'the-good-week',
    name: 'The Good Week',
    blurb: 'A balanced default, for making good weeks repeatable.',
    pillars: ['Fitness', 'Hobbies', 'Friends', 'Savings', 'Habits'],
    archetypes: ['steady'],
    keywords: [
      // The body (Fitness)
      'fitness', 'gym', 'exercise', 'run', 'yoga', 'pilates', 'lift', 'swim',
      'hike', 'hiking', 'bike', 'biking', 'climb', 'sports', 'steps',
      // What it's for (Hobbies, Friends)
      'hobby', 'hobbies', 'paint', 'draw', 'photography', 'garden', 'music',
      'knit', 'travel', 'trip', 'friends', 'brunch', 'hangout', 'games',
      // Keeping it going (Savings, Habits)
      'savings', 'save', 'invest', 'retirement', 'habits', 'streak',
      'consistency', 'discipline', 'balance', 'maintain',
    ],
  },
]
