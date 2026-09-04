# Manual de uso — Exervis Mail Triage

Agente de triaje de correo para Exervis: lee la bandeja de `prueba@exervis.com`,
clasifica cada correo con IA según las reglas de negocio del departamento de
facturación, y ejecuta la acción correspondiente (reenviar, actualizar en
sistema, o marcar para revisión manual).

---

## 1. Puesta en marcha

### 1.1 Requisitos
- Node.js y npm instalados.
- Una cuenta de correo válida para `prueba@exervis.com` (proveedor: One.com).
- Una API key de OpenAI.

### 1.2 Configuración

Copia `.env.example` a `.env.local` y rellena:

```
OPENAI_API_KEY=              # API key de OpenAI
OPENAI_MODEL=gpt-4o-mini      # modelo de clasificación (opcional, este es el valor por defecto)
CLASSIFICATION_CONFIDENCE_THRESHOLD=60   # umbral de confianza 0-100 (ver sección 6)
MAILING_SERVICE=outlook
MAIL_USER=                   # cuenta que lee/envía correo (prueba@exervis.com)
MAIL_PASSWORD=
```

`.env.local` nunca se sube al repositorio (está en `.gitignore`).

### 1.3 Arrancar

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

---

## 2. Iniciar sesión

La pantalla de entrada pide el correo y la contraseña de la cuenta que se va a
leer (`prueba@exervis.com` u otra que se decida usar). Al enviar el
formulario, la app **verifica la conexión IMAP de verdad** antes de dejarte
pasar — si las credenciales son incorrectas, verás el error de conexión real
en pantalla, no un mensaje genérico.

Las credenciales se guardan en una cookie `httpOnly` de sesión (no en el
código ni en base de datos) y se usan tanto para leer la bandeja (IMAP) como
para enviar correos reales cuando corresponda (SMTP).

---

## 3. El Dashboard

### 3.1 Barra superior

| Elemento | Qué hace |
|---|---|
| **Envío Real de Correos: ACTIVADO / DESACTIVADO** | Interruptor maestro de seguridad. Ver sección 5. |
| **Escuchando** (indicador verde) | Confirma que la bandeja se refresca sola cada 15 segundos (trae correos nuevos por IMAP). Esto **no** implica que se procesen solos — eso depende del interruptor de Envío Real. |
| **Procesar Bandeja** | Clasifica con IA y ejecuta la acción de **todos** los correos en estado "pendiente" de una vez. |

### 3.2 Columna izquierda — Bandeja de entrada

Lista de correos con tres pestañas de filtro: **Todos**, **Pendientes**,
**Procesados**. Cada fila muestra remitente, asunto, fecha relativa y una
etiqueta de estado (pendiente / procesado / error).

### 3.3 Panel derecho — Visor de correo

Al seleccionar un correo se ve su contenido completo (remitente, fecha,
cuerpo). Si ya fue procesado, aparece además:
- La **categoría asignada** con el **% de confianza** del modelo.
- Un botón **"Ver detalle de la decisión"** con el resumen de por qué se
  clasificó así.
- Un botón **Procesar / Reprocesar** para volver a lanzar la clasificación de
  ese correo en concreto (útil para probar cambios o forzar un reintento).

### 3.4 Panel inferior — Historial de Gestión

Línea de tiempo con cada paso real que ha dado el agente al procesar el
correo seleccionado:

1. **Recepción** — correo recibido.
2. **Adjuntos** *(si tiene)* — qué se extrajo de cada adjunto (texto de
   PDF/Word/Excel, o "enviado a visión" para imágenes) y si alguno falló.
3. **Análisis NLP** — llamada a OpenAI en curso.
4. **Clasificación** — categoría asignada y % de confianza.
5. **Extracción** — datos de negocio extraídos (fechas, importes, referencias...).
6. **Acción** — qué regla de negocio se aplicó y a quién/qué sistema.
7. **Reenvío** *(solo si la acción es reenviar)* — si se envió de verdad o solo se simuló.
8. **Completado** — fin del procesamiento.

Si el correo aún no se ha procesado, este panel lo indica claramente en vez
de mostrar un historial vacío o falso.

---

## 4. Reglas de negocio (qué hace la IA con cada tipo de correo)

| Categoría | Detectada cuando... | Acción |
|---|---|---|
| 🏥 Ausencia (Cliente) | Aviso de ausencia desde un dominio **externo** | Reenviar a Producción/Delegación |
| 🏭 Ausencia (Producción) | Mismo aviso desde un dominio **@exervis.com** | Gestionar en sistema (Abono/Comparativa) |
| 💰 Justificante de cobro | Justificantes de pago, confirmings, transferencias | Reenviar a Glenis |
| 📊 Info. facturación | Horas puntuales, datos para facturar | Procesar en sistema de facturación |
| 🏦 Cambio de cuenta | Solicitud de cambio de número de cuenta | Actualizar en sistema |
| 📋 Cambio datos / Presupuesto | Cambios de datos de cliente o solicitud de presupuesto | Reenviar a Oficina Técnica |
| ⚠️ Incidencia en servicio | Fallos o problemas en la prestación del servicio | Reenviar a Producción/Delegación |
| 🔄 Autorización recibo | Autorización para gestionar un recibo devuelto | Reenviar a Pagos |
| 📤 Solicitud de facturas | Piden factura de un mes o de un cargo concreto | Procesar en sistema de facturación |
| 🚨 Queja por subida de precios | Disconformidad con incrementos de precio | Revisión manual (requiere humano) |
| ❓ Sin clasificar | Confianza del modelo por debajo del umbral | Revisión manual (requiere humano) |

**Regla clave**: la distinción entre ausencia de Cliente y de Producción se
decide **solo por el dominio del remitente**, nunca por lo que diga el texto
del correo.

**El motivo real puede estar en un adjunto**: si el cuerpo del correo es
vago pero trae un PDF/Word/Excel o una imagen con la información real, la IA
lee ese contenido antes de clasificar — no se basa solo en el texto visible.

---

## 5. Envío Real de Correos (Prod Mode)

Es el interruptor más delicado de la app: decide si las acciones de tipo
"reenviar" mandan un correo de verdad o solo se simulan.

- **DESACTIVADO (rojo, por defecto)** — cuando se procesa un correo que
  requiere reenvío, el paso "Reenvío" del historial dice `[SIMULACIÓN]` y
  **no sale ningún correo real**. Modo seguro para pruebas y demos.
- **ACTIVADO (verde)** — el reenvío se ejecuta de verdad por SMTP, a
  **`prueba3@exervis.com`**, con el motivo de negocio (a qué departamento iba
  dirigido conceptualmente) incluido en el cuerpo del correo reenviado.

**Efecto adicional del interruptor**: mientras está **ACTIVADO**, el ciclo
automático de 15 segundos no solo refresca la bandeja — también **procesa
automáticamente todos los correos pendientes**, lo que incluye el envío real
si corresponde. Con el interruptor **DESACTIVADO**, el procesado sigue
siendo siempre manual (botón "Procesar Bandeja" o "Procesar" en un correo
concreto). Esto solo funciona mientras la pestaña del dashboard está abierta
en el navegador (es un temporizador del lado del cliente).

El estado del interruptor vive en el servidor (no en el navegador), así que
persiste aunque recargues la página, pero se resetea a DESACTIVADO si
reinicias el servidor.

---

## 6. Umbral de confianza y "Sin clasificar"

La IA no solo elige una categoría: también reporta un **% de confianza real**
en esa elección. Si ese porcentaje cae por debajo del umbral configurado
(`CLASSIFICATION_CONFIDENCE_THRESHOLD`, 60% por defecto), el sistema **no
confía en la categoría sugerida** y marca el correo como **"Sin clasificar"**,
enviándolo a revisión manual — con una explicación breve de por qué (qué
categoría sugería la IA y con qué confianza).

Esto evita que un correo ambiguo, vacío, spam o con varios motivos mezclados
acabe con una etiqueta de negocio falsa solo porque el modelo estaba
obligado a elegir algo.

---

## 7. Adjuntos

- **PDF, Word (.docx), Excel (.xlsx)**: se extrae el texto localmente en el
  servidor (sin llamar a ningún LLM para eso) y se añade al contexto que ve
  la IA.
- **Imágenes**: se envían directamente al modelo (que soporta visión) — no
  hay extracción de texto previa, el propio modelo "las lee".
- **Adjuntos corruptos o de tipo no soportado**: no rompen el procesamiento
  del correo; se registra un aviso en el paso "Adjuntos" y se sigue
  clasificando por el resto del contenido disponible.
- Desde el Historial de Gestión, cada adjunto analizado aparece como un
  chip clicable que lo descarga (sin previsualización).

---

## 8. Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| Un correo queda en `status: error` tras procesar | Falta `OPENAI_API_KEY` o es inválida | Revisa `.env.local` y reinicia el servidor |
| El paso "Reenvío" falla | `MAIL_USER`/`MAIL_PASSWORD` incorrectos con Envío Real activado | Verifica las credenciales de la cuenta de correo |
| El login rechaza credenciales correctas | El proveedor (One.com) puede requerir ajustes de seguridad específicos en la cuenta | Confirma acceso IMAP/SMTP manual con esas credenciales |
| La bandeja no trae correos nuevos | No has iniciado sesión, o la sesión caducó | Vuelve a iniciar sesión |
| Un correo desaparece de la lista tras un rato | *(bug ya corregido)* — si reaparece, revisar `getEmails()` en `emailService.ts` | — |

---

## 9. Notas técnicas rápidas

- **Sin base de datos**: el estado de los correos vive en memoria del
  servidor mientras el proceso de Next.js esté arriba. Se pierde al
  reiniciar.
- **Un correo → una llamada a OpenAI**: cada procesamiento de correo (con
  o sin adjuntos) hace exactamente una llamada al modelo, nunca más.
- **Qué decide la IA vs. qué decide el código**: la IA solo clasifica y
  extrae datos. Qué hacer con esa categoría (a quién reenviar, si requiere
  humano, etc.) es lógica de negocio fija en `businessRules.ts`, no una
  decisión del modelo.
