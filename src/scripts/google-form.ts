/**
 * Manejador de envío a Google Forms.
 *
 * Publica el payload contra el endpoint público `formResponse` del
 * formulario, cuyas respuestas se vuelcan automáticamente a la Google
 * Sheet vinculada. No se usan credenciales de la API de Sheets: el único
 * dato necesario es el ID público del formulario y los IDs de campo
 * (`entry.XXXXXXXX`), ambos inyectados por variables de entorno en build.
 *
 * El endpoint no emite CORS, por lo que el envío se hace en modo
 * `no-cors`: la respuesta es opaca pero el registro queda asentado.
 */

export interface GoogleFormConfig {
  formId: string;
  /** Mapa: nombre de campo local -> ID de entrada de Google (`entry.XXXX`). */
  entries: Record<string, string>;
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

const FORM_RESPONSE_URL = (formId: string): string =>
  `https://docs.google.com/forms/d/e/${formId}/formResponse`;

export function isConfigured(config: GoogleFormConfig): boolean {
  return (
    config.formId.length > 0 &&
    Object.values(config.entries).every((entry) => entry.startsWith('entry.'))
  );
}

export async function submitToGoogleForm(
  config: GoogleFormConfig,
  values: Record<string, string>
): Promise<SubmitResult> {
  if (!isConfigured(config)) {
    return {
      ok: false,
      error:
        'Formulario no configurado: faltan PUBLIC_GOOGLE_FORM_ID o los IDs de campo.',
    };
  }

  const body = new URLSearchParams();
  for (const [field, entryId] of Object.entries(config.entries)) {
    body.append(entryId, values[field] ?? '');
  }

  try {
    await fetch(FORM_RESPONSE_URL(config.formId), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error de red desconocido.',
    };
  }
}
