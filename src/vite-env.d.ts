/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL: string
  readonly VITE_DOCS_API_URL: string
  readonly VITE_ANALYSIS_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 