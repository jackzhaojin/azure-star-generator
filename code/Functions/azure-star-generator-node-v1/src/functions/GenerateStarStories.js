/**
 * Azure Function for generating STAR stories
 * This file is the entry point for the HTTP trigger
 */
const { app } = require('@azure/functions');
const storyController = require('../controllers/storyController');

// HTTP trigger function definition
app.http('GenerateStarStories', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // Forward request to controller
            return await storyController.generateStories(request, context);
        } catch (error) {
            // Handle any unexpected errors
            context.log.error('Unhandled error in function:', error);
            return {
                status: 500,
                jsonBody: { 
                    success: false, 
                    error: 'An unexpected error occurred' 
                }
            };
        } finally {
            context.log(`FINALLY: Http function completed processing request`);
        }
    }
});

module.exports = app;