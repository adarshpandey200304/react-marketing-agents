/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// html2pdf.js ships without types.
declare module 'html2pdf.js' {
  const html2pdf: any;
  export default html2pdf;
}
