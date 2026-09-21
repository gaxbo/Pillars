import { isSupabaseConfigured } from '@/lib/supabase'
import { mockRepository } from './mock'
import type { PillarsRepository } from './repository'
import { supabaseRepository } from './supabase'

/**
 * The single place that decides where data comes from. With no Supabase keys
 * the app still runs end to end on sample data, which keeps the board usable
 * for design work and demos.
 */
export const repository: PillarsRepository = isSupabaseConfigured
  ? supabaseRepository
  : mockRepository

export { isSupabaseConfigured }
