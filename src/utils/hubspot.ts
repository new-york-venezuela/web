export interface HubSpotConfig {
  portalId: string;
  formId: string;
  fieldMapping: Record<string, string>;
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

const HUBSPOT_API_URL = 'https://api.hsforms.com/submissions/v3/integration/submit';

export function isConfigured(config: HubSpotConfig): boolean {
  return (
    config.portalId.length > 0 &&
    config.formId.length > 0 &&
    Object.keys(config.fieldMapping).length > 0
  );
}

export async function submitToHubSpot(
  config: HubSpotConfig,
  values: Record<string, string>
): Promise<SubmitResult> {
  if (!isConfigured(config)) {
    return {
      ok: false,
      error: 'HubSpot no configurado: faltan HUBSPOT_PORTAL_ID o HUBSPOT_FORM_ID.',
    };
  }

  const fields = Object.entries(config.fieldMapping)
    .map(([localField, hubspotField]) => ({
      name: hubspotField,
      value: values[localField] ?? '',
    }))
    .filter(field => field.value || field.name === 'company' || field.name === 'message');

  const url = `${HUBSPOT_API_URL}/${config.portalId}/${config.formId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields,
        context: {
          pageUri: typeof window !== 'undefined' ? window.location.href : '',
          pageName: 'Contact Form Submission',
        },
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `HubSpot error: ${response.status} ${response.statusText}`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error de red desconocido.',
    };
  }
}
