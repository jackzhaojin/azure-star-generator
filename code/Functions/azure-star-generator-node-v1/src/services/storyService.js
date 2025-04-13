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
        // Step 1: Build the prompt using the prompt builder
        const prompt = promptBuilder.buildPrompt(parsedData, interactionType, customPrompt);
        
        // Log token estimation
        const tokenCount = estimateTokenCount(prompt);
        context.log(`Prompt built with estimated ${tokenCount} tokens`);
        
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

module.exports = {
    generateStories
};