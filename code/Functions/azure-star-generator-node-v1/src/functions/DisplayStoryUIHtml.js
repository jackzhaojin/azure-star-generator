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
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        // Handle POST requests (STAR story generation)
        if (request.method === 'POST') {
            try {
                const requestBody = await request.json();
                const { feedbackText, category } = requestBody;
                
                // Generate STAR story (placeholder implementation)
                const starStory = generateSTARStory(feedbackText, category);
                
                return {
                    jsonBody: { 
                        success: true, 
                        story: starStory 
                    }
                };
            } catch (error) {
                context.log.error('Error processing request:', error);
                return {
                    status: 500,
                    jsonBody: { 
                        success: false, 
                        error: 'Failed to process request' 
                    }
                };
            }
        }
        
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

// Function to generate a STAR story based on feedback
function generateSTARStory(feedbackText, category) {
    // This is a placeholder implementation
    // In reality, you would call Azure OpenAI or another AI service here
    
    return {
        situation: `Based on your feedback about "${category}", here's a situation you might have faced: You were working at Accenture on a client project that required implementing Azure cloud services.`,
        task: "Your task was to analyze the client's requirements, design an appropriate cloud architecture, and implement the solution while ensuring it met performance and security standards.",
        action: "You researched Azure best practices, collaborated with your team to develop a comprehensive implementation plan, and executed the migration in phases to minimize disruption to the client's operations.",
        result: "As a result, the client successfully migrated to Azure with minimal downtime, achieving a 30% reduction in operational costs and improved system reliability. Your work was specifically recognized in your performance review."
    };
}