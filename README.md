# Form to Google Sheets

A TypeScript/Node.js application that receives form submissions and appends the data to a Google Spreadsheet using the Google Sheets API.

## Tech Stack

- **Backend**: Node.js with Express and TypeScript
- **Frontend**: Vite + TypeScript
- **API Integration**: Google Sheets API (googleapis)
- **Development**: ts-node, nodemon for hot-reloading

## Features

- Express.js backend with TypeScript for type safety
- Google Sheets API integration
- Simple HTML form for testing
- Error handling and validation
- CORS enabled for cross-origin requests
- Request logging with Morgan

## Setup Instructions

### 1. Google Sheets API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API
4. Create a service account and download the JSON key file
5. Create a new Google Spreadsheet and share it with the service account email (with Editor permissions)
6. Note the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`

### 2. Environment Configuration

1. Create a `.env` file in the root directory with the following variables:

```env
GOOGLE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
PORT=3000
```

**Important**: Keep the quotes around `GOOGLE_PRIVATE_KEY` and preserve the `\n` characters.

### 3. Installation

```bash
# Install dependencies
npm install
```

## Running the Application

### Development Mode

Start the development server with hot-reloading:

```bash
npm run dev
```

The server will start at `http://localhost:3000` (or your configured PORT).

### Production Build

Build the TypeScript code and prepare for production:

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript in the `dist/` folder
- Copy the `public/` folder to `dist/`

### Production Mode

Run the compiled production build:

```bash
npm start
```

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

**Success Response:**
```json
{
  "success": true,
  "message": "Form data successfully added to Google Sheets",
  "updatedRows": 1
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to submit form data",
  "error": "Error details here"
}
```

## Testing

A simple HTML form is available at the root URL (`http://localhost:3000`) for testing the form submission functionality.

## Project Structure

```
.
├── server.ts              # Main Express server with TypeScript
├── public/
│   └── index.html        # Test form interface
├── src/
│   ├── main.ts           # Frontend entry point
│   └── counter.ts        # Example TypeScript module
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env                  # Environment variables (create this)
└── README.md            # This file
```

## Customization

- Modify the HTML form in `public/index.html` to match your requirements
- Adjust the spreadsheet range in `server.ts` (currently set to `Sheet1!A:Z`)
- Add additional validation or processing logic in the `/api/submit-form` endpoint
- Update TypeScript types in `server.ts` to match your form structure

## Troubleshooting

### Build Errors

If you encounter module resolution errors, ensure:
- All relative imports use `.js` extensions (e.g., `import { x } from './module.js'`)
- TypeScript is configured with `"moduleResolution": "NodeNext"`

### Google Sheets API Errors

- Verify your service account has Editor permissions on the spreadsheet
- Check that the `GOOGLE_PRIVATE_KEY` in `.env` preserves `\n` characters
- Ensure the spreadsheet ID is correct

### Port Already in Use

Change the `PORT` value in your `.env` file to use a different port.

## License

MIT
