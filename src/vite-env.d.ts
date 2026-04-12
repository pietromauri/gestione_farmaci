/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCRIPT_URL: string
  // aggiungi altre variabili se necessario...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
