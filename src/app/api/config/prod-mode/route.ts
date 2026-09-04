import { NextResponse } from 'next/server';
import { isProdModeEnabled, setProdMode, PROD_FORWARD_TARGET } from '@/lib/appConfig';

// GET /api/config/prod-mode
// Devuelve si Prod Mode está activo (y a qué dirección se reenviaría de verdad).
export async function GET() {
  return NextResponse.json({
    success: true,
    enabled: isProdModeEnabled(),
    target: PROD_FORWARD_TARGET,
  });
}

// POST /api/config/prod-mode  { enabled: boolean }
// Activa/desactiva el envío real de correos reenviados.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const enabled = Boolean(body?.enabled);
    setProdMode(enabled);
    return NextResponse.json({ success: true, enabled, target: PROD_FORWARD_TARGET });
  } catch (error) {
    console.error('Error setting prod mode:', error);
    return NextResponse.json(
      { success: false, message: 'Error al cambiar el modo.' },
      { status: 500 }
    );
  }
}
