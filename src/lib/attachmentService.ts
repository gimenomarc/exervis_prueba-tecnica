import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { EmailAttachment } from './types';

// pdf-parse (pdfjs-dist por debajo) necesita localizar su worker script.
// Bajo Next.js/Turbopack la resolución automática del "fake worker" falla
// porque el bundler no copia pdf.worker.mjs a la ruta esperada, así que
// apuntamos explícitamente al fichero real dentro de node_modules.
const pdfWorkerPath = path.join(
  process.cwd(),
  'node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs'
);
PDFParse.setWorker(pathToFileURL(pdfWorkerPath).href);

// ==========================================
// Attachment Service
// ==========================================
// Extrae texto legible de adjuntos de documento (PDF, Word, Excel) para
// que el LLM pueda usarlo como contexto adicional al clasificar un correo.
// Las imágenes NO se procesan aquí: se pasan tal cual a la API de OpenAI
// (gpt-4o-mini soporta visión) para que el propio modelo las interprete.
// ==========================================

export interface ExtractedAttachmentText {
  filename: string;
  text: string;
}

export interface AttachmentImage {
  filename: string;
  mimeType: string;
  base64: string;
}

export function isImageAttachment(attachment: EmailAttachment): boolean {
  return attachment.mimeType.startsWith('image/');
}

function isPdf(attachment: EmailAttachment): boolean {
  return attachment.mimeType === 'application/pdf' || attachment.filename.toLowerCase().endsWith('.pdf');
}

function isDocx(attachment: EmailAttachment): boolean {
  return (
    attachment.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    attachment.filename.toLowerCase().endsWith('.docx')
  );
}

function isXlsx(attachment: EmailAttachment): boolean {
  return (
    attachment.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    attachment.filename.toLowerCase().endsWith('.xlsx')
  );
}

/**
 * Extrae el texto de un adjunto de documento (PDF/DOCX/XLSX).
 * Devuelve null si el tipo de adjunto no es un documento soportado
 * (p. ej. una imagen, que se gestiona por separado con visión).
 */
export async function extractAttachmentText(
  attachment: EmailAttachment
): Promise<string | null> {
  const buffer = Buffer.from(attachment.content, 'base64');

  if (isPdf(attachment)) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (isDocx(attachment)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (isXlsx(attachment)) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets = workbook.SheetNames.map((name) => {
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
      return `[Hoja: ${name}]\n${csv}`;
    });
    return sheets.join('\n\n').trim();
  }

  return null;
}

/**
 * Procesa todos los adjuntos de un correo: extrae texto de los documentos
 * soportados y separa las imágenes para envío directo a visión.
 * Un fallo en un adjunto individual no interrumpe el resto.
 */
export async function processAttachments(attachments: EmailAttachment[]): Promise<{
  texts: ExtractedAttachmentText[];
  images: AttachmentImage[];
  errors: { filename: string; message: string }[];
}> {
  const texts: ExtractedAttachmentText[] = [];
  const images: AttachmentImage[] = [];
  const errors: { filename: string; message: string }[] = [];

  for (const attachment of attachments) {
    try {
      if (isImageAttachment(attachment)) {
        images.push({
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          base64: attachment.content,
        });
        continue;
      }

      const text = await extractAttachmentText(attachment);
      if (text) {
        texts.push({ filename: attachment.filename, text });
      } else {
        errors.push({
          filename: attachment.filename,
          message: `Tipo de adjunto no soportado: ${attachment.mimeType}`,
        });
      }
    } catch (error) {
      errors.push({
        filename: attachment.filename,
        message: error instanceof Error ? error.message : 'Error desconocido al extraer el adjunto.',
      });
    }
  }

  return { texts, images, errors };
}
