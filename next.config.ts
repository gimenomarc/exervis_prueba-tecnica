import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // El rastreo automatico de dependencias de Next.js (usado tanto para
  // `output: standalone` como internamente por Vercel al desplegar) no
  // detecta paquetes cargados con require/import dinamico. Sin esto,
  // imap/imap-simple/mailparser/openai/nodemailer/mammoth/xlsx/pdf-parse
  // faltan en el bundle de las rutas API y provocan un 500 en runtime
  // (p.ej. GET /api/emails) tanto en Vercel como en el paquete standalone.
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/imap/**',
      './node_modules/imap-simple/**',
      './node_modules/mailparser/**',
      './node_modules/openai/**',
      './node_modules/nodemailer/**',
      './node_modules/mammoth/**',
      './node_modules/xlsx/**',
      './node_modules/pdf-parse/**',
      // pdf-parse usa pdfjs-dist por debajo, que a su vez usa el paquete
      // nativo @napi-rs/canvas para polyfillear DOMMatrix/ImageData/Path2D
      // en Node. Sin esto, /api/emails y el procesado petan en runtime.
      './node_modules/pdfjs-dist/**',
      './node_modules/@napi-rs/**',
      './node_modules/napi-postinstall/**',
    ],
  },
  /* config options here */
};

export default nextConfig;
