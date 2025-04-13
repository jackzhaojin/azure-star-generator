/**
 * Main service for STAR story generation
 * Orchestrates the process of generating stories
 */
const openAIDao = require('../dao/openAIDao');
const promptBuilder = require('./promptBuilder');
const responseProcessor = require('./responseProcessor');
const { estimateTokenCount } = require('../utils/tokenUtil');
/**
 * Generate STAR stories using Azure OpenAI
 * @param {Array} parsedData - Array of feedback data objects
 * @param {string} interactionType - Type of audience for the stories
 * @param {string} customPrompt - Additional custom instructions
 * @param {Object} context - Azure Functions context for logging
 * @returns {Array} - Generated stories
 */
async function generateStories(parsedData, interactionType, customPrompt, context) {
    try {
        // Log information about the data size
        context.log(`Processing spreadsheet with ${parsedData.length} entries. Will use a maximum of 50 entries.`);
        
        // Limit to max 50 entries if larger
        const limitedData = parsedData.length > 50 ? parsedData.slice(0, 50) : parsedData;
        
        if (parsedData.length > 50) {
            context.log(`Limited input data from ${parsedData.length} to 50 entries to reduce token usage`);
        }
        
        // Step 1: Build the prompt using the prompt builder with limited data
        const prompt = promptBuilder.buildPrompt(limitedData, interactionType, customPrompt);
        
        // Log token estimation
        const tokenCount = estimateTokenCount(prompt);
        context.log(`Prompt built with estimated ${tokenCount} tokens for ${limitedData.length} entries`);
        
        // Step 2: Prepare messages for OpenAI API
        const messages = [
            { 
                role: "system", 
                content: "You are a helpful assistant helping me craft professional stories about myself. You excel at formatting responses as JSON when requested."
            },
            { 
                role: "user", 
                content: prompt 
            }
        ];
        
        // Step 3: Call the OpenAI API
        const response = await openAIDao.generateCompletion(messages, context);
        
        // Step 4: Extract content from response
        const content = response.choices[0].message.content;
        
        // Step 5: Process the response
        return responseProcessor.processResponse(content);
    } catch (error) {
        context.log.error('Error in story generation process:', error);
        throw new Error(`Story generation failed: ${error.message}`);
    }
}

/**
 * Validates that a story object has all required fields in the correct format
 * @param {Object} story - The story object to validate
 * @returns {boolean} - Whether the story is valid
 */
function isValidStory(story) {
    // Basic object validation
    if (!story || typeof story !== 'object') {
        return false;
    }
    
    // Check situation and task are non-empty strings
    if (typeof story.situation !== 'string' || story.situation.trim() === '' ||
        typeof story.task !== 'string' || story.task.trim() === '') {
        return false;
    }
    
    // Check result is a non-empty string
    if (typeof story.result !== 'string' || story.result.trim() === '') {
        return false;
    }
    
    // Check action is either a non-empty string or an array of non-empty strings
    if (Array.isArray(story.action)) {
        // Must have at least one action item
        if (story.action.length === 0) {
            return false;
        }
        
        // All action items must be non-empty strings
        for (const item of story.action) {
            if (typeof item !== 'string' || item.trim() === '') {
                return false;
            }
        }
    } else if (typeof story.action !== 'string' || story.action.trim() === '') {
        // If not an array, must be a non-empty string
        return false;
    }
    
    return true;
}

module.exports = {
    generateStories
};