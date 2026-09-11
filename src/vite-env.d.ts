/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      alt?: string;
      ar?: boolean;
      'auto-rotate'?: boolean;
      'camera-controls'?: boolean;
      exposure?: number;
      style?: React.CSSProperties;
    };
  }
}
