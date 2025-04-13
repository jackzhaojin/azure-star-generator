/**
 * Service for STAR story generation business logic
 */
const openAIDao = require('../dao/openAIDao');
const { estimateTokenCount } = require('../utils/tokenUtil');

class StoryService {
    /**
     * Generate STAR stories using Azure OpenAI
     * @param {Array} parsedData - Array of feedback data objects
     * @param {string} interactionType - Type of audience for the stories
     * @param {string} customPrompt - Additional custom instructions
     * @param {Object} context - Azure Functions context for logging
     * @returns {Array} - Generated stories
     */
    async generateStories(parsedData, interactionType, customPrompt, context) {
        // Build the prompt for story generation
        const prompt = this.buildPrompt(parsedData, interactionType, customPrompt);
        
        // Log the generated prompt
        context.log('Generated prompt for Azure OpenAI:', prompt);
        
        // Estimate token count for the prompt
        const tokenCount = estimateTokenCount(prompt);
        context.log(`Estimated token count for prompt: ${tokenCount}`);
        
        // Define messages for the chat completion
        const messages = [
            { 
                role: "system", 
                content: "You are a helpful assistant helping me craft professional stories about myself." 
            },
            { 
                role: "user", 
                content: prompt 
            }
        ];
        
        // Get completion from Azure OpenAI
        const response = await openAIDao.generateCompletion(messages, context);
        
        // Extract the completion text
        const completion = response.choices[0].message;
        context.log('Received completion from Azure OpenAI');
        
        // Parse the AI response into structured stories
        const stories = this.parseAIResponse(completion.content);
        context.log(`Successfully parsed ${stories.length} stories from the response`);
        
        return stories;
    }
    
    /**
     * Build prompt for Azure OpenAI
     * @param {Array} parsedData - Array of feedback data objects
     * @param {string} interactionType - Type of audience for the stories
     * @param {string} customPrompt - Additional custom instructions
     * @returns {string} - Generated prompt
     */
    buildPrompt(parsedData, interactionType, customPrompt) {
        const basePrompt = `You are an expert in crafting STAR (Situation, Task, Action, Result) stories. Based on the following feedback data, generate professional STAR stories tailored for the "${interactionType}" audience.`;
        
        const feedbackExamples = parsedData.slice(0, 3).map(entry => {
            return `Feedback: ${entry['Actual Feedback'] || 'N/A'}\nTags: ${entry['Tags'] || 'N/A'}\nProject: ${entry['Project / Context'] || 'N/A'}`;
        }).join("\n\n");
        
        const customPromptText = customPrompt ? `\n\nAdditional context: ${customPrompt}` : "";
        
        return `${basePrompt}\n\n${feedbackExamples}${customPromptText}`;
    }
    
    /**
     * Parse AI response into structured stories
     * @param {string} responseText - Raw text response from AI
     * @returns {Array} - Array of structured story objects
     */
    parseAIResponse(responseText) {
        const stories = [];
        const chunks = responseText.split(/\n\s*\n/); // Split by empty lines
        
        for (const chunk of chunks) {
            // Try to extract STAR components
            const situationMatch = chunk.match(/situation:?\s*(.*?)\s*(?=task:|$)/is);
            const taskMatch = chunk.match(/task:?\s*(.*?)\s*(?=action:|$)/is);
            const actionMatch = chunk.match(/action:?\s*(.*?)\s*(?=result:|$)/is);
            const resultMatch = chunk.match(/result:?\s*(.*)\s*$/is);
            
            // If we have all four components, add as a valid story
            if (situationMatch && taskMatch && actionMatch && resultMatch) {
                const story = {
                    situation: situationMatch[1].trim(),
                    task: taskMatch[1].trim(),
                    action: actionMatch[1].trim(),
                    result: resultMatch[1].trim()
                };
                
                // Only add if all fields have content
                if (story.situation && story.task && story.action && story.result) {
                    stories.push(story);
                }
            }
        }
        
        return stories;
    }
}

module.exports = new StoryService();