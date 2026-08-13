/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROQ_KEY?: string;
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  readonly VITE_PROVIDER_OPENROUTER_URL?: string;
  readonly VITE_PROVIDER_OPENROUTER_KEY?: string;
  readonly VITE_PROVIDER_GROQ_URL?: string;
  readonly VITE_PROVIDER_GROQ_KEY?: string;
  readonly VITE_PROVIDER_TOGETHER_URL?: string;
  readonly VITE_PROVIDER_TOGETHER_KEY?: string;
  readonly VITE_PROVIDER_HUGGINGFACE_URL?: string;
  readonly VITE_PROVIDER_HUGGINGFACE_KEY?: string;
  readonly VITE_PROVIDER_DEEPSEEK_URL?: string;
  readonly VITE_PROVIDER_DEEPSEEK_KEY?: string;
  readonly VITE_PROVIDER_MISTRAL_URL?: string;
  readonly VITE_PROVIDER_MISTRAL_KEY?: string;
  readonly VITE_PROVIDER_POLLINATIONS_URL?: string;
  readonly VITE_PROVIDER_POLLINATIONS_KEY?: string;
  readonly DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
