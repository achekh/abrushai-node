import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { google } from 'googleapis';

// Define form data interface
interface FormData {
  [key: string]: string | number | boolean;
}

// Helper to get response headers with Content-Type
function getResponseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json'
  };
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

// Verify reCAPTCHA token with Google
async function verifyRecaptcha(token: string, context: InvocationContext): Promise<{ success: boolean; score?: number; action?: string; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    context.error('RECAPTCHA_SECRET_KEY environment variable is not set');
    return { success: false, error: 'reCAPTCHA not configured' };
  }

  if (!token) {
    return { success: false, error: 'No reCAPTCHA token provided' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json() as any;
    
    context.log('reCAPTCHA verification response:', { success: data.success, score: data.score, action: data.action });

    if (!data.success) {
      return { success: false, error: 'reCAPTCHA verification failed' };
    }

    // Check score threshold (0.0 to 1.0, where 1.0 is very likely legitimate)
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');
    if (data.score < scoreThreshold) {
      context.warn(`reCAPTCHA score ${data.score} below threshold ${scoreThreshold}`);
      return { success: false, error: 'reCAPTCHA score too low (likely bot activity)' };
    }

    return { success: true, score: data.score, action: data.action };
  } catch (error) {
    context.error('Error verifying reCAPTCHA:', error);
    return { success: false, error: error instanceof Error ? error.message : 'reCAPTCHA verification error' };
  }
}

// POST /api/submit-form handler
async function submitFormHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing form submission');
  const headers = getResponseHeaders();

  try {
    const formData = await parseJson(req);
    
    if (!formData || Object.keys(formData).length === 0) {
      return {
        status: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'No form data provided' })
      };
    }

    context.log('Received form data');
    
    // Extract and verify reCAPTCHA token
    const recaptchaToken = formData.recaptchaToken as string;
    const recaptchaVerification = await verifyRecaptcha(recaptchaToken, context);
    
    if (!recaptchaVerification.success) {
      return {
        status: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: recaptchaVerification.error || 'reCAPTCHA verification failed'
        })
      };
    }

    context.log(`reCAPTCHA verification passed (score: ${recaptchaVerification.score})`);
    
    // Filter out recaptchaToken before writing to Google Sheets
    const filteredData = Object.entries(formData)
      .filter(([key]) => key !== 'recaptchaToken')
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as FormData);
    
    const values = [Object.values(filteredData)];
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
  const headers = getResponseHeaders();

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
