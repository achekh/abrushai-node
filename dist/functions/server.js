import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { google } from 'googleapis';
// Create Express app
const expressApp = express();
// Setup middleware
expressApp.use(cors());
expressApp.use(morgan('dev'));
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));
// Google Sheets API setup
const setupGoogleSheets = () => {
    const auth = new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return google.sheets({ version: 'v4', auth });
};
// Endpoint 1: Handle form submissions
expressApp.post('/api/submit-form', async (req, res) => {
    try {
        const formData = req.body;
        if (!formData || Object.keys(formData).length === 0) {
            return res.status(400).json({ success: false, message: 'No form data provided' });
        }
        console.log('Received form data:', formData);
        const values = [Object.values(formData)];
        const sheets = setupGoogleSheets();
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Sheet1!A:Z',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values }
        });
        console.log('Sheets API response:', response.data);
        return res.status(200).json({
            success: true,
            message: 'Form data successfully added to Google Sheets',
            updatedRows: response.data.updates?.updatedRows || 0
        });
    }
    catch (error) {
        console.error('Error submitting form data:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit form data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Endpoint 2: Health check / status endpoint
expressApp.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Azure Function is healthy',
        timestamp: new Date().toISOString()
    });
});
// Root endpoint
expressApp.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Form submission service is running',
        endpoints: {
            healthCheck: 'GET /api/health',
            submitForm: 'POST /api/submit-form'
        }
    });
});
// Azure Functions HTTP trigger handler
export default async function handler(req, context) {
    context.log(`Http function processed request for url "${req.url}"`);
    return new Promise((resolve, reject) => {
        const responseHeaders = {
            'Content-Type': 'application/json'
        };
        const res = {
            statusCode: 200,
            headers: responseHeaders,
            body: '',
            status: (code) => {
                res.statusCode = code;
                return res;
            },
            json: (data) => {
                res.body = JSON.stringify(data);
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: res.body
                });
            },
            send: (data) => {
                res.body = typeof data === 'string' ? data : JSON.stringify(data);
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: res.body
                });
            },
            setHeader: (key, value) => {
                res.headers[key] = value;
            },
            end: () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: res.body
                });
            }
        };
        expressApp(req, res);
    });
}
//# sourceMappingURL=server.js.map