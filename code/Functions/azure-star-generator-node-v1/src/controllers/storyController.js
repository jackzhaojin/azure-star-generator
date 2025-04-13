/**
 * Controller for handling STAR story generation requests
 */
const storyService = require('../services/storyService');

/**
 * Handle story generation request
 * @param {Object} request - HTTP request object
 * @param {Object} context - Azure Functions context
 * @returns {Object} - HTTP response
 */
async function generateStories(request, context) {
    context.log(`Http function processing star stories generation request`);
    
    try {
        // Parse request body
        const requestBody = await request.json();
        const { parsedData, interactionType, customPrompt } = requestBody;
        
        // Validate request
        if (!parsedData || !Array.isArray(parsedData)) {
            context.log.warn('Invalid request: Parsed CSV data is required as an array.');
            return {
                status: 400,
                jsonBody: { 
                    success: false, 
                    error: 'Parsed CSV data is required as an array' 
                }
            };
        }
        
        // Log parsed request data
        context.log('Parsed request body:', { 
            dataCount: parsedData.length, 
            interactionType, 
            hasCustomPrompt: !!customPrompt 
        });
        
        // Generate STAR stories using the service
        const generatedStories = await storyService.generateStories(
            parsedData, 
            interactionType, 
            customPrompt, 
            context
        );
        
        context.log('Successfully generated stories:', generatedStories.length);
        
        // Return successful response
        return {
            jsonBody: { 
                success: true, 
                stories: generatedStories 
            }
        };
    } catch (error) {
        // Log and return error
        context.log.error('Error generating stories:', error);
        return {
            status: 500,
            jsonBody: { 
                success: false, 
                error: 'Failed to generate stories: ' + error.message 
            }
        };
    }
}

module.exports = {
    generateStories
};