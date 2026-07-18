# HubSpot Form Integration Setup (Free Tier) — 2026

This guide covers integrating your web form with HubSpot's free tier to capture leads into your CRM.

## Prerequisites

- **HubSpot Account**: Free tier (no paid features needed for basic form submission)
- **Contacts or Leads Portal**: Your HubSpot account automatically includes this
- **No API key required**: HubSpot's public form submission endpoint works without authentication

## Step 1: Create a HubSpot Form

1. **Log in** to HubSpot at `hubspot.com`
2. **Navigate to Marketing → Lead Capture → Forms** (or Forms in your menu)
3. **Click "Create form"**
4. **Select template**: Choose "Blank" or "Contact Form"
5. **Form name**: Give it a name like `"Website Contact Form 2026"`
6. **Add fields** in this order:
   - Full Name (field type: Single-line text) — set as **required**
   - Email (field type: Email) — set as **required**
   - Phone Number (field type: Phone number) — set as **required**
   - Business Type (field type: Dropdown)
     - Options: Supermercado, Restaurante, Hotel, Catering, Otro
     - Set as **required**
   - Company Name (field type: Single-line text) — optional
   - Message (field type: Multi-line text) — optional

7. **Submit button**: Set button text to "Solicitar Llamada" (or leave as default "Submit")
8. **Save & Publish** the form

## Step 2: Get Your Form ID and Field IDs

After publishing, you need to capture the form identifiers:

1. **Find Form ID + Portal ID**:
   - Go back to your form and open its settings
   - Look for the **embed code** or **form details** section
   - The URL or embed code contains your **Portal ID** and **Form ID**
   - Example embed code snippet: `<script charset="utf-8" type="text/javascript" src="//js.hsforms.net/forms/embed/v2.js"></script>`
   - In the JavaScript block, you'll see `portalId` and `formId`

2. **Get Field IDs**:
   - In the form editor, click on each field
   - The field name/ID appears in the sidebar (e.g., `firstname`, `email`, `phone`, `businesstype`, `company`, `message`)
   - Note these exactly — HubSpot field names are case-sensitive and usually lowercase

**Typical HubSpot Field Names (Standard):**
- First Name: `firstname`
- Email: `email`
- Phone: `phone`
- Company: `company`
- (Custom fields: check your form settings)

## Step 3: Set Environment Variables

Add these to your `.env.local` or `.env` file:

```env
HUBSPOT_PORTAL_ID=YOUR_PORTAL_ID_HERE
HUBSPOT_FORM_ID=YOUR_FORM_ID_HERE
```

Optionally, if using custom field names, create a mapping:

```env
HUBSPOT_FIELD_MAPPING={"fullName":"firstname","email":"email","phone":"phone","businessType":"businesstype","companyName":"company","message":"message"}
```

## Step 4: API Endpoint Format

HubSpot's public form submission endpoint:

```
POST https://api.hsforms.com/submissions/v3/integration/submit/PORTAL_ID/FORM_ID
```

**Request body** (JSON):
```json
{
  "fields": [
    { "name": "firstname", "value": "John Doe" },
    { "name": "email", "value": "john@example.com" },
    { "name": "phone", "value": "+58 (412) 555-1234" },
    { "name": "businesstype", "value": "restaurant" },
    { "name": "company", "value": "My Restaurant" },
    { "name": "message", "value": "Interested in bulk orders" }
  ],
  "context": {
    "pageUri": "https://alimentosnewyork.com/solicitar-llamada/",
    "pageName": "Contact Form Submission"
  }
}
```

## Step 5: Test

1. Go to your website form at `/solicitar-llamada/` or `/contacto/`
2. Fill out all fields
3. Submit
4. Check HubSpot **Contacts** to see if the new contact was created
5. If successful, you'll see a new contact with the submitted data

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **404 error** | Verify Portal ID and Form ID are correct |
| **Contacts not appearing** | Check field names match HubSpot exactly (case-sensitive) |
| **Missing data** | Ensure all required fields are sent; optional fields can be empty strings |
| **CORS errors** | HubSpot allows cross-origin requests for form submissions — should work automatically |

## Important Notes

- **Free tier limits**: No workflow automation, no lead scoring, no form branching — but unlimited form submissions
- **Data retention**: Contacts in HubSpot free tier are retained indefinitely (no delete limit)
- **Compliance**: HubSpot free tier includes basic GDPR compliance tools (Privacy Policy link required on form)
- **Future upgrade path**: If you need automation, lead scoring, or email sequences, you can upgrade to a paid tier without migrating data

## Verifying the Setup

Once live:

1. **Monitor submissions**: Open HubSpot Contacts, sort by "Date created" (newest first)
2. **Check form analytics**: In the form editor, view "Performance" to see submissions over time
3. **Export leads**: HubSpot allows exporting contacts as CSV from the Contacts tab

---

**Last updated**: 2026-07-18  
**HubSpot Free Tier**: Confirmed working with form submissions (no upgrade required)
