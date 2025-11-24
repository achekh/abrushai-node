import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { google } from 'googleapis';

// Define form data interface
interface FormData {
  [key: string]: string | number | boolean;
}

// CORS configuration for the allowed origin
const ALLOWED_ORIGIN = 'https://red-sea-0ab736403.3.azurestaticapps.net';
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = ['Content-Type', 'Authorization'];
const MAX_AGE = '86400';

// Helper to get CORS headers
function getCorsHeaders(origin?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    'Access-Control-Max-Age': MAX_AGE
  };

  // Only add Allow-Origin if request is from allowed origin
  if (origin === ALLOWED_ORIGIN) {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGIN;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
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

// OPTIONS handler for CORS preflight requests
async function optionsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Handling preflight request');
  const origin = req.headers.get('origin');
  const headers = getCorsHeaders(origin);

  return {
    status: 204,
    headers
  };
}

// POST /api/submit-form handler
async function submitFormHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing form submission');
  const origin = req.headers.get('origin');

  try {
    const formData = await parseJson(req);
    const headers = getCorsHeaders(origin);
    
    if (!formData || Object.keys(formData).length === 0) {
      return {
        status: 400,
        headers,
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
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Form data successfully added to Google Sheets',
        updatedRows: response.data.updates?.updatedRows || 0
      })
    };
  } catch (error) {
    context.error('Error submitting form data:', error);
    const headers = getCorsHeaders(origin);
    
    return {
      status: 500,
      headers,
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
  const origin = req.headers.get('origin');
  const headers = getCorsHeaders(origin);

  return {
    status: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Azure Function is healthy',
      timestamp: new Date().toISOString()
    })
  };
}


// Register individual functions
app.http('submitForm', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'api/submit-form',
  handler: (req, context) => {
    if (req.method === 'OPTIONS') {
      return optionsHandler(req, context);
    }
    return submitFormHandler(req, context);
  }
});

app.http('health', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'api/health',
  handler: (req, context) => {
    if (req.method === 'OPTIONS') {
      return optionsHandler(req, context);
    }
    return healthHandler(req, context);
  }
});
