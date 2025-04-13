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
        context.log('Starting story generation process...');
        context.log(`Input: ${parsedData.length} data entries, interaction type: ${interactionType}`);
        
        // Step 1: Build the prompt using the prompt builder
        const prompt = promptBuilder.buildPrompt(parsedData, interactionType, customPrompt);
        
        // Log the generated prompt and token estimation
        const tokenCount = estimateTokenCount(prompt);
        context.log(`Generated prompt with estimated ${tokenCount} tokens`);
        
        // Step 2: Prepare messages for the OpenAI API
        const messages = prepareMessages(prompt);
        
        // Step 3: Call the OpenAI API via the DAO
        context.log('Calling Azure OpenAI API...');
        const response = await openAIDao.generateCompletion(messages, context);
        
        // Step 4: Extract the completion content
        const completionContent = extractCompletionContent(response);
        context.log('Successfully received response from Azure OpenAI');
        
        // Step 5: Process the response to get structured stories
        const stories = responseProcessor.processResponse(completionContent, context);
        context.log(`Successfully processed ${stories.length} stories`);
        
        return stories;
    } catch (error) {
        context.log.error('Error in story generation process:', error);
        throw new Error(`Story generation failed: ${error.message}`);
    }
}

/**
 * Prepare messages for the OpenAI API
 * @param {string} prompt - The generated prompt
 * @returns {Array} - Array of message objects
 */
function prepareMessages(prompt) {
    return [
        { 
            role: "system", 
            content: "You are a helpful assistant helping me craft professional stories about myself. You excel at formatting responses as JSON when requested."
        },
        { 
            role: "user", 
            content: prompt 
        }
    ];
}

/**
 * Extract completion content from API response
 * @param {Object} response - The API response
 * @returns {string} - The completion content
 */
function extractCompletionContent(response) {
    if (!response || !response.choices || response.choices.length === 0 || !response.choices[0].message) {
        throw new Error('Invalid or empty response from OpenAI API');
    }
    
    return response.choices[0].message.content || '';
}

module.exports = {
    generateStories
};