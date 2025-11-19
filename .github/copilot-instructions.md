# Copilot Instructions for abrushai-node

## Project Overview
This is a TypeScript/Node.js application that receives form submissions and appends the data to a Google Spreadsheet using the Google Sheets API. The backend is built with Express and TypeScript, while the frontend uses Vite and TypeScript. The main integration point is the Google Sheets API via the `googleapis` package.

## Architecture & Key Files
- `server.ts`: Main Express server, handles API requests and Google Sheets integration.
- `public/index.html`: Simple HTML form for testing submissions.
- `src/main.ts`: Frontend entry point (Vite app).
- `.env`: Required for Google API credentials and configuration.
- `package.json`: Scripts and dependencies.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Development mode (hot-reload):** `npm run dev`
- **Build for production:** `npm run build` (outputs to `dist/`)
- **Run production build:** `npm start`
- **Test form submission:** Use the form at `/` (root URL) to POST to `/api/submit-form`.

## API Patterns
- Main endpoint: `POST /api/submit-form` (see `server.ts` for request/response shape)
- Data is validated and appended to Google Sheets (`Sheet1!A:Z` by default)
- Error and success responses are structured with `{ success, message, ... }`

## Project-Specific Conventions
- All Google Sheets API credentials must be set in `.env` (quotes and `\n` in private key are required)
- Spreadsheet ID must be correct and service account must have Editor permissions
- TypeScript is used throughout; backend and frontend are separated
- CORS and request logging (Morgan) are enabled in the backend
- All customizations (form fields, spreadsheet range, validation) are handled in `server.ts` and `public/index.html`

## Troubleshooting
- For Google API errors, check `.env` formatting and spreadsheet permissions
- For build errors, ensure TypeScript uses `moduleResolution: NodeNext` and imports use `.js` extensions
- Change `PORT` in `.env` if port conflicts occur

## Example Customization
- To add new form fields, update both `public/index.html` and the request handler in `server.ts`
- To change the spreadsheet range, modify the relevant code in `server.ts`

## References
- See `README.md` for full setup and troubleshooting details
- Key files: `server.ts`, `public/index.html`, `.env`, `package.json`, `README.md`

---
For questions or unclear conventions, review `README.md` or ask for clarification on specific workflows or patterns.