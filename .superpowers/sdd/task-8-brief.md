# Task 8: Google Sheets Integration & API Route

**Where this fits:** Creates the backend to capture form submissions and append to Google Sheet. Final link in form submission pipeline.

**Files:**
- Create: `src/utils/googleSheets.ts` — Google Sheets API integration
- Create: `src/pages/api/submit-lead.ts` — API endpoint for form submission

**Prerequisites (user setup):**
Before implementing, user must:
1. Create Google Sheet at https://sheets.google.com/
2. Get Sheet ID from URL (between `/d/` and `/edit`)
3. Create Google Cloud Project with Sheets API enabled
4. Create service account with JSON key
5. Share Google Sheet with service account email
6. Add to `.env`:
   - `GOOGLE_SHEET_ID=<sheet-id>`
   - `GOOGLE_PROJECT_ID=<project-id>`
   - `GOOGLE_PRIVATE_KEY_ID=<key-id>`
   - `GOOGLE_PRIVATE_KEY="<private-key-with-\n-for-newlines>"`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL=<service-account@...iam.gserviceaccount.com>`
   - `GOOGLE_CLIENT_ID=<client-id>`

## Step 1: Create googleSheets.ts utility

**File:** `src/utils/googleSheets.ts`

```typescript
import { google } from 'googleapis';

const sheets = google.sheets('v4');

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

export async function appendLeadToSheet(leadData: {
  fullName: string;
  phone: string;
  email: string;
  businessType: string;
  companyName?: string;
  message?: string;
}): Promise<boolean> {
  try {
    const auth = await getAuth();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      leadData.fullName,
      leadData.phone,
      leadData.email,
      leadData.businessType,
      leadData.companyName || '',
      leadData.message || '',
    ];

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: sheetId,
      range: 'Sheet1!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return true;
  } catch (error) {
    console.error('Google Sheets API error:', error);
    throw error;
  }
}
```

## Step 2: Create API route

**File:** `src/pages/api/submit-lead.ts`

```typescript
import type { APIRoute } from 'astro';
import { validateFormData } from '../../utils/formValidation';
import { appendLeadToSheet } from '../../utils/googleSheets';

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

    // Append to Google Sheet
    await appendLeadToSheet(body);

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
```

## Step 3: Verify integration

After creating files:
- `npm run build` should complete without errors
- Verify: imports resolve (googleapis, validateFormData)
- Check: .env variables are accessible in runtime (Astro passes them)
- Note: Actual Google Sheets append testing requires Google Cloud credentials

**Dependencies required:**
- `googleapis` package (check package.json has it, or `npm install googleapis`)
