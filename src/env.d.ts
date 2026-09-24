/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** 'true' skips sign-in and runs the app on mock data. Dev only. */
  readonly VITE_BYPASS_AUTH?: string
  /** Landing page only: where the app lives, for the early access sign-in. */
  readonly VITE_APP_URL?: string
  /** App only: shown on Help & Support when set. */
  readonly VITE_SUPPORT_EMAIL?: string
  /** App only: the landing site, linked from About Us for its roadmap. */
  readonly VITE_LANDING_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
