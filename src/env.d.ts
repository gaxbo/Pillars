/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** 'true' skips sign-in and runs the app on mock data. Dev only. */
  readonly VITE_BYPASS_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
