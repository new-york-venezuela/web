import type { APIRoute } from 'astro';
import { validateFormData } from '../../utils/formValidation';
import { appendLeadToSheet } from '../../utils/googleSheets';
import { submitToHubSpot } from '../../utils/hubspot';

export const POST: APIRoute = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    // Validate form data
    const validation = validateFormData(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: 'Validation failed', errors: validation.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hubspotEnabled = import.meta.env.HUBSPOT_PORTAL_ID && import.meta.env.HUBSPOT_FORM_ID;
    const googleSheetsEnabled = import.meta.env.GOOGLE_SHEET_ID;

    if (hubspotEnabled) {
      // Submit to HubSpot (primary destination)
      const fieldMapping = import.meta.env.HUBSPOT_FIELD_MAPPING
        ? JSON.parse(import.meta.env.HUBSPOT_FIELD_MAPPING)
        : {
            fullName: 'firstname',
            phone: 'phone',
            email: 'email',
            businessType: 'businesstype',
            companyName: 'company',
            message: 'message',
          };

      const hubspotResult = await submitToHubSpot(
        {
          portalId: import.meta.env.HUBSPOT_PORTAL_ID,
          formId: import.meta.env.HUBSPOT_FORM_ID,
          fieldMapping,
        },
        body
      );

      if (!hubspotResult.ok) {
        console.error('HubSpot submission failed:', hubspotResult.error);
        return new Response(
          JSON.stringify({ error: 'Error al enviar a HubSpot' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else if (googleSheetsEnabled) {
      // Fallback to Google Sheets if HubSpot not configured
      await appendLeadToSheet(body);
    } else {
      return new Response(
        JSON.stringify({ error: 'No hay destino configurado para el formulario' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solicitud recibida. Nos pondremos en contacto pronto.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Form submission error:', error);
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
