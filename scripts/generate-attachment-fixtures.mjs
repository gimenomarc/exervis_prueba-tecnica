// ==========================================
// Genera adjuntos de ejemplo REALES (no texto simulado) para poder probar
// el pipeline de extracción de adjuntos (PDF/DOCX/XLSX) sin tener aún una
// bandeja IMAP real conectada.
//
// Uso: node scripts/generate-attachment-fixtures.mjs
// Salida: src/lib/fixtures/attachments/*.{pdf,docx,xlsx}
// ==========================================

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'src', 'lib', 'fixtures', 'attachments');

async function generatePdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const lines = [
    'PARTE MEDICO DE BAJA LABORAL',
    '',
    'Paciente: Laura Fernandez Molina',
    'Empresa: Manufacturas Levante S.A.',
    'Periodo de baja: del 08/09/2026 al 12/09/2026 (5 dias)',
    'Motivo: Gripe estacional con fiebre alta',
    '',
    'Se recomienda reposo domiciliario durante el periodo indicado.',
    '',
    'Dr. Javier Ortega Ramos - Colegiado 28-45671',
  ];
  let y = 780;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 12, font, color: rgb(0, 0, 0) });
    y -= 22;
  }
  const bytes = await pdfDoc.save();
  await writeFile(path.join(outDir, 'parte-medico.pdf'), bytes);
}

async function generateDocx() {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: 'SOLICITUD DE PRESUPUESTO', bold: true, size: 32 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Cliente: Innovaciones Digitales S.L.' }),
          new Paragraph({ text: 'Contacto: Pedro Sanchez Diaz (CTO)' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'Solicitamos presupuesto actualizado para el servicio de limpieza de oficinas ' +
              'en nuestra nueva sede de Valencia, incluyendo 450 m2 de superficie y 3 plantas.',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Necesitamos tambien actualizar los datos fiscales del cliente: nuevo CIF B-12345678.' }),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  await writeFile(path.join(outDir, 'solicitud-presupuesto.docx'), buffer);
}

async function generateXlsx() {
  const wsData = [
    ['Concepto', 'Horas', 'Tarifa/h (EUR)', 'Importe (EUR)'],
    ['Servicio puntual - refuerzo limpieza', 12, 18.5, 222.0],
    ['Servicio puntual - fin de semana', 8, 22.0, 176.0],
    ['Total', '', '', 398.0],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'HorasPuntuales');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  await writeFile(path.join(outDir, 'horas-puntuales.xlsx'), buffer);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await generatePdf();
  await generateDocx();
  await generateXlsx();
  console.log('Fixtures generados en', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
