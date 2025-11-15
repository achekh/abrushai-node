# Form to Google Sheets

A Node.js application that receives form submissions and appends the data to a Google Spreadsheet.

## Features

- Express.js backend to handle form submissions
- Google Sheets API integration
- Simple HTML form for testing
- Error handling and validation

## Setup Instructions

### 1. Google Sheets API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API
4. Create a service account and download the JSON key file
5. Create a new Google Spreadsheet and share it with the service account email (with Editor permissions)
6. Note the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`

### 2. Environment Configuration

1. Open the `.env` file and update the following variables:
   - `GOOGLE_CLIENT_EMAIL`: Your service account email
   - `GOOGLE_PRIVATE_KEY`: Your service account private key (keep the quotes and \n characters)
   - `GOOGLE_SPREADSHEET_ID`: Your Google Spreadsheet ID
   - `PORT`: The port for your server (default: 3000)

### 3. Installation and Running

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The server will start at http://localhost:3000 (or your configured PORT).

## API Endpoints

### POST /api/submit-form

Accepts form data and appends it to the Google Spreadsheet.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "subject": "General Inquiry",
  "message": "Hello, I have a question about your services."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form data successfully added to Google Sheets",
  "updatedRows": 1
}
```

## Testing

A simple HTML form is available at the root URL (http://localhost:3000) for testing the form submission functionality.

## Customization

- Modify the HTML form in `public/index.html` to match your requirements
- Adjust the spreadsheet range in `server.js` if needed
- Add additional validation or processing logic as required
