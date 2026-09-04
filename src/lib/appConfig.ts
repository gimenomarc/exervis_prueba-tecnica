// ==========================================
// App Config
// ==========================================
// Estado en memoria (sin base de datos) para flags de configuración
// que afectan al comportamiento del backend en tiempo de ejecución.
// ==========================================

let prodModeEnabled = false;

/**
 * Dirección real a la que se reenvían los correos cuando Prod Mode
 * está activo. Con Prod Mode desactivado, el reenvío solo se simula
 * (se registra en el log, no se envía ningún correo real).
 */
export const PROD_FORWARD_TARGET = 'prueba3@exervis.com';

export function isProdModeEnabled(): boolean {
  return prodModeEnabled;
}

export function setProdMode(enabled: boolean): void {
  prodModeEnabled = enabled;
}
