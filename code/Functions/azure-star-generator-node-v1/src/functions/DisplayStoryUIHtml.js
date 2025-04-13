const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Templates paths
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

// Function to read file safely with fallback
function readFileWithFallback(filePath, fallback) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error loading file ${filePath}:`, error);
        return fallback;
    }
}

// Load HTML template
const htmlTemplate = readFileWithFallback(
    path.join(TEMPLATES_DIR, 'index.html'), 
    `<!DOCTYPE html><html><head><title>STAR Story Generator</title></head><body><h1>Error loading application</h1></body></html>`
);

// Load CSS files
const mainCss = readFileWithFallback(
    path.join(TEMPLATES_DIR, 'css/main.css'),
    `:root { --azure-blue: #0078d4; } body { font-family: sans-serif; margin: 20px; }`
);

// Load JavaScript modules
const jsModules = {
    'app': readFileWithFallback(path.join(TEMPLATES_DIR, 'js/app.js'), '// App initialization code'),
    'csv-handler': readFileWithFallback(path.join(TEMPLATES_DIR, 'js/csv-handler.js'), '// CSV handling code'),
    'story-generator': readFileWithFallback(path.join(TEMPLATES_DIR, 'js/story-generator.js'), '// Story generation code'),
    'ui-controller': readFileWithFallback(path.join(TEMPLATES_DIR, 'js/ui-controller.js'), '// UI control code'),
    'utils': readFileWithFallback(path.join(TEMPLATES_DIR, 'js/utils.js'), '// Utility functions')
};

app.http('DisplayStoryUIHtml', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        
        // Parse query parameters
        const queryParams = url.parse(request.url, true).query;
        const resourceType = queryParams.resource;
        
        // Return CSS if requested
        if (resourceType === 'css') {
            return {
                body: mainCss,
                headers: {
                    'Content-Type': 'text/css',
                    'Cache-Control': 'max-age=3600' // Cache for 1 hour
                }
            };
        }
        
        // Return specific JS module if requested
        if (resourceType === 'js' && queryParams.module) {
            const moduleName = queryParams.module;
            if (jsModules[moduleName]) {
                return {
                    body: jsModules[moduleName],
                    headers: {
                        'Content-Type': 'application/javascript',
                        'Cache-Control': 'max-age=3600' // Cache for 1 hour
                    }
                };
            } else {
                return {
                    status: 404,
                    body: `JavaScript module '${moduleName}' not found`
                };
            }
        }
        
        // Return all JS combined if requested with no specific module
        if (resourceType === 'js') {
            const combinedJs = Object.values(jsModules).join('\n\n');
            return {
                body: combinedJs,
                headers: {
                    'Content-Type': 'application/javascript',
                    'Cache-Control': 'max-age=3600' // Cache for 1 hour
                }
            };
        }
        
        // Default: return the HTML page with inline references to CSS and JS
        return {
            body: htmlTemplate,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store' // Don't cache the HTML for development ease
            }
        };
    }
});

module.exports = app;