# Casos de prueba — Email Triage (Exervis)

Correos listos para copiar/pegar y enviar a **prueba@exervis.com**, pensados
para comprobar que se cumplen las reglas de negocio originales y para forzar
los corner cases más habituales del pipeline (IA + reglas + adjuntos + envío
real).

Para los casos que necesitan un adjunto, puedes usar directamente los
ficheros de ejemplo ya generados en `src/lib/fixtures/attachments/`
(`parte-medico.pdf`, `solicitud-presupuesto.docx`, `horas-puntuales.xlsx`,
`imagen-placeholder.png`).

---

## 1. Las 10 categorías de negocio (caso feliz)

### 1.1 Ausencia — Cliente
- **Desde**: una cuenta externa (Gmail, dominio de cliente...)
- **Asunto**: `Ausencia por enfermedad`
- **Cuerpo**:
  ```
  Buenos días,

  Les informo de que estaré de baja médica del 10 al 14 de este mes por
  gripe. Adjunto parte médico.

  Un saludo,
  Laura Gómez
  ```
- **Esperado**: `ausencia_cliente` → Reenviar a Producción/Delegación.

### 1.2 Ausencia — Producción (interno)
- **Desde**: una cuenta `@exervis.com`
- **Asunto**: `Ausencia por enfermedad`
- **Cuerpo**: el mismo texto que 1.1.
- **Esperado**: `ausencia_produccion` → Gestionar en sistema (Abono/Comparativa).
- ⚠️ Compáralo con 1.1: el texto es idéntico, solo cambia el dominio del
  remitente — así se valida que la regla mira el dominio, no lo que dice
  el cuerpo.

### 1.3 Justificante de cobro
- **Asunto**: `Justificante de transferencia - Factura 2026-0451`
- **Cuerpo**:
  ```
  Buenos días,

  Adjunto justificante bancario de la transferencia realizada hoy por
  importe de 1.240,00€ correspondiente a la factura 2026-0451.

  Saludos.
  ```
- **Esperado**: `justificante_cobro` → Reenviar a Glenis.

### 1.4 Información para facturar
- **Asunto**: `Horas puntuales del mes`
- **Cuerpo**:
  ```
  Hola,

  Os paso las horas puntuales de este mes para facturar: 8h de refuerzo
  el día 3 y 4h el día 17.

  Gracias.
  ```
- **Esperado**: `info_facturacion` → Procesar para facturación (Sistema).

### 1.5 Cambio de número de cuenta
- **Asunto**: `Cambio de cuenta bancaria`
- **Cuerpo**:
  ```
  Buenas,

  A partir de este mes, por favor giren los recibos a la nueva cuenta:
  ES91 2100 0418 4502 0005 1332.

  Gracias.
  ```
- **Esperado**: `cambio_cuenta` → Actualizar en sistema.

### 1.6 Cambio de datos / Presupuesto
- **Asunto**: `Solicitud de presupuesto y cambio de CIF`
- **Cuerpo**:
  ```
  Hola,

  Necesitamos un presupuesto actualizado para el servicio de limpieza de
  nuestra nueva sede. Además, hemos cambiado de CIF: ahora es B87654321.

  Un saludo.
  ```
- **Esperado**: `cambio_datos_presupuesto` → Reenviar a Oficina Técnica.

### 1.7 Incidencia en el servicio
- **Asunto**: `Incidencia: personal no se presentó`
- **Cuerpo**:
  ```
  Buenos días,

  El personal de limpieza no se ha presentado hoy en el turno de mañana.
  Necesitamos que se resuelva cuanto antes.

  Gracias.
  ```
- **Esperado**: `incidencia_servicio` → Reenviar a Producción/Delegación.

### 1.8 Autorización de recibo devuelto
- **Asunto**: `Autorización recibo devuelto`
- **Cuerpo**:
  ```
  Buenas,

  Autorizamos la gestión del recibo devuelto correspondiente al mes de
  agosto. Pueden proceder a volver a pasarlo al cobro.

  Saludos.
  ```
- **Esperado**: `autorizacion_recibo` → Reenviar a Pagos.

### 1.9a Solicitud de facturas — por mes
- **Asunto**: `Solicitud de factura`
- **Cuerpo**:
  ```
  Hola,

  Nos falta la factura correspondiente al mes de julio. ¿Podéis
  reenviárnosla?

  Gracias.
  ```
- **Esperado**: `solicitud_facturas` → Procesar (Sistema). Comprobar que
  `extractedData.keyDates`/`references` recoge "julio".

### 1.9b Solicitud de facturas — por cargo
- **Asunto**: `Factura del cargo del día 3`
- **Cuerpo**:
  ```
  Buenas,

  Necesitamos la factura correspondiente al cargo realizado en nuestra
  cuenta el día 3 de este mes, por importe de 450€.

  Gracias.
  ```
- **Esperado**: `solicitud_facturas`. Comprobar que
  `extractedData.amounts`/`references` recoge el importe/fecha del cargo
  (no un mes).

### 1.10 Queja por subida de precios
- **Asunto**: `Disconformidad con la subida de precios`
- **Cuerpo**:
  ```
  A la atención de comercial,

  No aceptamos el incremento del 9% aplicado en la última factura. El
  contrato fija un máximo del 3% anual. Solicitamos revisión inmediata.

  Atentamente.
  ```
- **Esperado**: `queja_precio` → Revisión manual (requiere humano).
  `urgency` debería salir `high`.

---

## 2. El motivo real está en el adjunto (no en el cuerpo)

### 2.1 PDF con el motivo real
- **Asunto**: `Documentación adjunta`
- **Cuerpo**: `Buenos días, les adjunto la documentación correspondiente.`
- **Adjunto**: `parte-medico.pdf`
- **Esperado**: clasifica como ausencia usando el contenido del PDF, no el
  cuerpo (vacío de información).

### 2.2 DOCX con el motivo real
- **Adjunto**: `solicitud-presupuesto.docx`, cuerpo igual de vacío que 2.1.
- **Esperado**: `cambio_datos_presupuesto`.

### 2.3 XLSX con el motivo real
- **Adjunto**: `horas-puntuales.xlsx`, cuerpo vacío.
- **Esperado**: `info_facturacion`, con importes extraídos de la hoja.

### 2.4 Imagen como único contenido
- **Adjunto**: una foto real de un recibo/justificante (no el placeholder
  de 1x1 píxel del repo, que no tiene contenido legible).
- **Esperado**: la IA debe describir razonablemente lo que ve vía visión.

### 2.5 Adjunto corrupto / no soportado
- **Adjunto**: un `.zip` o un `.exe` cualquiera.
- **Esperado**: el correo se sigue clasificando por el cuerpo; el paso
  "Adjuntos" del historial debe mostrar `warning` con el error, **sin**
  tumbar el procesamiento del resto del lote.

### 2.6 Varios adjuntos mezclados
- **Adjuntos**: PDF + imagen + XLSX en el mismo correo.
- **Esperado**: los tres se procesan (texto extraído de PDF/XLSX,
  imagen enviada a visión), todo junto en una sola llamada a OpenAI.

---

## 3. Correos ambiguos o fuera de las 10 categorías

### 3.1 Dos motivos a la vez
- **Asunto**: `Queja y cambio de cuenta`
- **Cuerpo**:
  ```
  Buenas,

  Por un lado, no estamos de acuerdo con la subida de precios del último
  trimestre. Por otro, os pedimos que cambiéis nuestra cuenta bancaria a
  ES12 3456 7890 1234 5678 9012.

  Gracias.
  ```
- **Esperado**: observar qué categoría prioriza la IA (no hay regla de
  desempate definida en el prompt actual).

### 3.2 Spam / fuera de tema
- **Asunto**: `¡Oferta especial solo hoy!`
- **Cuerpo**: cualquier texto publicitario sin relación con el negocio.
- **Esperado**: el prompt obliga a elegir una de las 10 categorías ("usa
  la más cercana") — comprobar que no fuerza algo absurdo con confianza
  alta.

### 3.3 Correo vacío
- **Asunto**: (vacío o solo símbolos)
- **Cuerpo**: vacío, sin adjuntos.
- **Esperado**: no debe crashear; revisar cómo se comporta `rationale`.

### 3.4 Correo en inglés
- **Asunto**: `Sick leave notice`
- **Cuerpo**: `I will be on sick leave from the 10th to the 14th.`
- **Esperado**: clasifica igual (`ausencia_*` según dominio) pese al
  idioma.

---

## 4. Fallos controlados (nada debe romper el flujo completo)

- **`OPENAI_API_KEY` inválida**: quita temporalmente la clave de
  `.env.local`, procesa un correo → debe quedar `status: error` con log
  claro, y el resto del lote (si hay más) no debe fallar en cascada.
- **Credenciales de correo incorrectas con Envío Real activado**:
  pon una contraseña equivocada en `MAIL_PASSWORD`, activa el toggle,
  procesa un correo con acción de reenvío → debe fallar controladamente
  (log en rojo en el paso "Reenvío"), nunca fingir éxito.
- **IMAP caído**: cierra sesión o pon una contraseña incorrecta en el
  login → `getEmails()` no debe crashear, solo devolver lo que ya hubiera
  en memoria.

---

## 5. Envío Real de Correos (el más crítico para la demo)

1. Con el toggle **DESACTIVADO**: procesa un correo con acción de
   reenvío (p.ej. 1.1, 1.3, 1.6, 1.7 u 1.8) → el log debe decir
   `[SIMULACIÓN]` y **no debe llegar nada real** a prueba3@exervis.com.
2. Actívalo y repite con otro correo del mismo tipo → debe llegar un
   correo real a `prueba3@exervis.com`, asunto `Fwd: ...`, con el motivo
   de negocio en el cuerpo.
3. Alterna el toggle varias veces y refresca la página → el estado debe
   mantenerse (vive en el servidor, no en el navegador).

---

## 6. Concurrencia y repetición

- Pulsa "Procesar Bandeja" y, mientras corre, pulsa "Reprocesar" sobre un
  correo individual distinto → no debería duplicar logs ni dejar estados
  inconsistentes.
- Reprocesa un correo que ya estaba `procesado` → el historial de gestión
  debe reiniciarse limpio (sin acumular logs de la ejecución anterior).
- Deja pasar >15s tras enviar dos correos nuevos a la bandeja real →
  ambos deben aparecer en "Pendientes" tras el refresco automático, sin
  procesarse solos (el procesado es manual desde el cambio reciente).
