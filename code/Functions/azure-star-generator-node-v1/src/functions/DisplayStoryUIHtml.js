const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

// Read the HTML template with inline CSS and JS
let htmlTemplate;

try {
    // Using path.resolve to ensure proper path resolution in Azure environment
    const templatesDir = path.resolve(__dirname, '../templates');
    
    htmlTemplate = fs.readFileSync(path.join(templatesDir, 'index.html'), 'utf8');
    console.log('Successfully loaded HTML template');
} catch (error) {
    console.error('Error loading HTML template:', error);
    // Fallback HTML in case the file cannot be read
    htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>STAR Story Generator</title>
        <style>
            body { font-family: sans-serif; margin: 20px; }
        </style>
    </head>
    <body>
        <h1>STAR Story Generator</h1>
        <p>Error loading the application. Please try again later.</p>
    </body>
    </html>`;
}

app.http('DisplayStoryUIHtml', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        
        // GET requests - return the HTML page with inline CSS and JS
        return {
            body: htmlTemplate,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store' // Prevents caching to make development easier
            }
        };
    }
});

module.exports = app;