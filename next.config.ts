import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // El bundler de Next.js (webpack/turbopack) no sabe procesar bien
  // paquetes que hacen require/import dinamico internamente (imap,
  // imap-simple, mailparser). Marcarlos como "external" evita que se
  // intenten inlinear en el bundle: se quedan como require() reales
  // resueltos contra node_modules en tiempo de ejecucion, tanto en
  // Vercel como en el build standalone.
  serverExternalPackages: [
    'imap',
    'imap-simple',
    'mailparser',
    'nodemailer',
    'openai',
    'mammoth',
    'xlsx',
    'pdf-parse',
  ],
  // El rastreo automatico de dependencias (usado por `output: standalone`
  // y tambien internamente por Vercel al desplegar) puede seguir sin
  // detectar ficheros que un paquete external necesita pero no importa
  // con un require/import estatico normal. pdf-parse usa pdfjs-dist por
  // debajo, que a su vez usa el paquete nativo @napi-rs/canvas para
  // polyfillear DOMMatrix/ImageData/Path2D en Node — sin esto, cualquier
  // ruta que importe emailService.ts (todas las /api/**) puede fallar
  // en runtime con un 500 vacio.
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/pdfjs-dist/**',
      './node_modules/@napi-rs/**',
      './node_modules/napi-postinstall/**',
    ],
  },
  /* config options here */
};

export default nextConfig;
