/**
 * The database's length limits on text people type (supabase/migrations 0001
 * and 0004). Inputs stop here, so a long entry is cut off as it's typed
 * rather than failing to save.
 */
export const MAX_LENGTH = {
  pillarName: 40,
  goalTitle: 80,
  taskTitle: 200,
  fullName: 100,
} as const
