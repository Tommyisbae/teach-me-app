# Teach Me - Chrome Extension

This Chrome extension helps you understand concepts you find confusing while browsing the web. Simply highlight the text you want to understand, right-click, and select "Explain with Teach Me" from the context menu.

## Architecture

The project is divided into three main components:

1.  **Chrome Extension (Frontend):**
    *   `manifest.json`: Defines the extension's properties and permissions.
    *   `popup.html`, `styles.css`, `popup.js`: The user interface for displaying the explanation and conversation history.
    *   `content_script.js`: Injected into web pages to handle communication with the background script.
    *   `background.js`: The service worker that manages the context menu and communication between different parts of the extension.

2.  **Backend Server:**
    *   `api/explain.js`: A serverless function (for Vercel) that handles requests from the Chrome extension.
    *   `api/package.json`: Lists the project's backend dependencies.
    *   The server uses the Google Generative AI API to generate explanations.

## Setup and Usage

To run this project, you'll need to have Node.js and npm installed.

### Backend (API)
1.  Navigate to the `api` directory: `cd api`
2.  Install dependencies: `npm install`
3.  You'll need a `GEMINI_API_KEY`. You can create a `.env` file in the `api` directory to store it: `GEMINI_API_KEY=your_api_key_here`

### Frontend (Chrome Extension)

1.  **Open Chrome** and navigate to `chrome://extensions`.
2.  **Enable "Developer mode"** in the top right corner.
3.  **Click "Load unpacked"** and select the `teach_me_app` directory.
4.  The extension should now be active. You can open any web page, highlight text, right-click, and select "Explain with Teach Me" to get an explanation.

## Vercel Deployment

To deploy the backend to Vercel:

1.  Create a Vercel account at [https://vercel.com](https://vercel.com).
2.  Install the Vercel CLI: `npm install -g vercel`
3.  From the `teach_me_app` directory, run `vercel login`.
4.  Run `vercel` to deploy. Vercel will automatically detect the `api/explain.js` file and deploy it as a serverless function.
5.  Once deployed, Vercel will give you a URL (e.g., `https://your-project.vercel.app`). You need to update the `content_script.js` file to use this URL for the API endpoint (e.g., `https://your-project.vercel.app/api/explain`).
6.  You also need to set your `GEMINI_API_KEY` as an environment variable in your Vercel project settings.