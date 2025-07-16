# Teach Me - Chrome Extension

This Chrome extension helps you understand concepts you find confusing while browsing the web. Simply highlight the text you want to understand, and the extension will provide a simple explanation.

## Architecture

The project is divided into two main components:

1.  **Chrome Extension (Frontend):**
    *   `manifest.json`: Defines the extension's properties and permissions.
    *   `popup.html`, `styles.css`, `popup.js`: The user interface for displaying the explanation.
    *   `content_script.js`: Injected into web pages to handle text highlighting and communication with the backend.

2.  **Backend Server:**
    *   `index.js`: An Express.js server that handles requests from the Chrome extension.
    *   `package.json`: Lists the project's dependencies.
    *   The server uses the Google Generative AI API to generate explanations.

## Setup and Usage

To run this project, you'll need to have Node.js and npm installed.

### Backend

1.  **Navigate to the `backend` directory:**
    ```bash
    cd teach_me_app/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the `backend` directory and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key
    ```

4.  **Start the server:**
    ```bash
    node index.js
    ```
    The server will be running at `http://localhost:5001`.

### Frontend (Chrome Extension)

1.  **Open Chrome** and navigate to `chrome://extensions`.
2.  **Enable "Developer mode"** in the top right corner.
3.  **Click "Load unpacked"** and select the `teach_me_app` directory.
4.  The extension should now be active. You can open any web page and start highlighting text to get an explanation.
