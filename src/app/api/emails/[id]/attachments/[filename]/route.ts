import { NextResponse } from 'next/server';
import { getEmailById } from '@/lib/emailService';

// GET /api/emails/:id/attachments/:filename
// Descarga el adjunto original de un correo (sin previsualización, tal cual).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { id, filename } = await params;
    const decodedFilename = decodeURIComponent(filename);

    const email = await getEmailById(id);
    if (!email) {
      return NextResponse.json({ success: false, message: 'Correo no encontrado.' }, { status: 404 });
    }

    const attachment = email.attachments?.find((a) => a.filename === decodedFilename);
    if (!attachment) {
      return NextResponse.json({ success: false, message: 'Adjunto no encontrado.' }, { status: 404 });
    }

    const buffer = Buffer.from(attachment.content, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return NextResponse.json(
      { success: false, message: 'Error al descargar el adjunto.' },
      { status: 500 }
    );
  }
}
