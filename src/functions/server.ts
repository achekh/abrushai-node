import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { google } from 'googleapis';

// Define form data interface
interface FormData {
  [key: string]: string | number | boolean;
}

// Google Sheets API setup
const setupGoogleSheets = () => {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return google.sheets({ version: 'v4', auth });
};

// Helper function to parse JSON body
async function parseJson(req: HttpRequest): Promise<FormData | null> {
  try {
    const bodyText = await req.text();
    return bodyText ? JSON.parse(bodyText) : null;
  } catch {
    return null;
  }
}

// POST /api/submit-form handler
async function submitFormHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing form submission');

  try {
    const formData = await parseJson(req);
    
    if (!formData || Object.keys(formData).length === 0) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'No form data provided' })
      };
    }

    context.log('Received form data:', formData);
    
    const values = [Object.values(formData)];
    const sheets = setupGoogleSheets();
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Sheet1!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });

    context.log('Sheets API response:', response.data);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Form data successfully added to Google Sheets',
        updatedRows: response.data.updates?.updatedRows || 0
      })
    };
  } catch (error) {
    context.error('Error submitting form data:', error);
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to submit form data',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

// GET /api/health handler
async function healthHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Health check request');

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      message: 'Azure Function is healthy',
      timestamp: new Date().toISOString()
    })
  };
}

// GET / handler
async function rootHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Root endpoint accessed');

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      message: 'Form submission service is running',
      endpoints: {
        healthCheck: 'GET /api/health',
        submitForm: 'POST /api/submit-form'
      }
    })
  };
}

// Register individual functions
app.http('submitForm', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'api/submit-form',
  handler: submitFormHandler
});

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'api/health',
  handler: healthHandler
});

app.http('root', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: '',
  handler: rootHandler
});
