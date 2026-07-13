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
    } as any,
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
