import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Setup middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

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

// API endpoint to handle form submissions
app.post('/api/submit-form', async (req: Request, res: Response) => {
  try {
    const formData: FormData = req.body;
    
    if (!formData || Object.keys(formData).length === 0) {
      return res.status(400).json({ success: false, message: 'No form data provided' });
    }

    console.log('Received form data:', formData);

    // Convert form data to array format for Google Sheets
    const values = [Object.values(formData)];
    
    // Initialize Google Sheets
    const sheets = setupGoogleSheets();
    
    // Append data to the spreadsheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Sheet1!A:Z', // Adjust range as needed
      valueInputOption: 'USER_ENTERED',
      requestBody: { values } // Changed from 'resource' to 'requestBody'
    });

    console.log('Sheets API response:', response.data);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Form data successfully added to Google Sheets',
      updatedRows: response.data.updates?.updatedRows || 0
    });
  } catch (error) {
    console.error('Error submitting form data:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to submit form data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Serve the HTML form for testing
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
