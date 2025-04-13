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
        // Create tailored instructions based on interaction type
        let specificInstructions = '';
        let audienceContext = '';
        
        switch(interactionType) {
            case 'top10':
                specificInstructions = `Generate my top 10 most impactful STAR stories based on the feedback data provided. 
                These should be diverse, covering different skills and situations, and showcase my most significant achievements. 
                For each story, create a clear Situation, Task, Action, and Result that demonstrates substantial positive impact. 
                Select stories that would be most impressive in interview scenarios.`;
                break;
                
            case 'leadership':
                specificInstructions = `Generate STAR stories that highlight my leadership and management abilities. 
                Focus on instances where I led teams, influenced stakeholders, made difficult decisions, resolved conflicts, 
                or developed other team members. Include examples that demonstrate strategic thinking, emotional intelligence, 
                delegation, motivation, and other key leadership competencies.`;
                break;
                
            case 'technical':
                specificInstructions = `Generate STAR stories that showcase my technical expertise and problem-solving abilities. 
                Focus on instances where I solved complex technical challenges, implemented innovative solutions, 
                demonstrated deep expertise in specific technologies, or improved systems/processes through technical means. 
                Include quantifiable results where possible.`;
                break;
                
            case 'sales':
                specificInstructions = `Generate STAR stories that highlight my client success and sales achievements. 
                Focus on instances where I won new business, strengthened client relationships, overcame objections, 
                identified new opportunities, or delivered exceptional client value. Include specific metrics on revenue 
                generated, deals closed, or client satisfaction improvements where possible.`;
                break;
                
            case 'colleague':
                audienceContext = `These stories will be shared with colleagues who are familiar with my industry and organization. 
                The tone should be collaborative and emphasis should be on teamwork and mutual success. 
                Include relevant technical details that a peer would understand and appreciate.`;
                break;
                
            case 'client':
                audienceContext = `These stories will be shared with potential clients to demonstrate my expertise and value. 
                The tone should be professional and confident but not boastful. Focus on client outcomes and benefits 
                rather than internal processes. Use industry-appropriate language but avoid excessive jargon.`;
                break;
                
            case 'employer':
                audienceContext = `These stories will be shared in job interviews or performance reviews. 
                The tone should be achievement-oriented and demonstrate my unique value proposition. 
                Each story should clearly highlight skills relevant to potential employers and include 
                quantifiable results wherever possible.`;
                break;
                
            case 'custom':
                // For custom prompts, we'll rely on the additional context provided by the user
                break;
                
            default:
                // Default case for any new options added in the future
                specificInstructions = `Generate professional STAR stories tailored for the "${interactionType}" context.`;
        }
        
        // Base prompt with STAR structure guidance
        const basePrompt = `You are an expert in crafting professional STAR (Situation, Task, Action, Result) stories. 
        Create compelling and authentic narratives based on the following feedback data that I've received.
        
        Each story must follow this structure:
        - Situation: Concisely set the context with specific details about the challenge or opportunity
        - Task: Clearly explain my specific responsibilities or objectives in this situation
        - Action: Detail the specific steps I took, focusing on MY individual contribution even in team settings
        - Result: Quantify the positive outcomes where possible and link them directly to my actions
        
        ${specificInstructions}
        ${audienceContext}`;
        
        // Include a selection of feedback entries as context
        // Use more entries for the dataset if generating top 10
        const feedbackCount = interactionType === 'top10' ? Math.min(10, parsedData.length) : Math.min(5, parsedData.length);
        const feedbackExamples = parsedData.slice(0, feedbackCount).map((entry, index) => {
            return `Feedback Entry #${index + 1}:
            Date: ${entry['Date'] || 'N/A'}
            Source: ${entry['Source'] || 'N/A'}
            Project/Context: ${entry['Project / Context'] || 'N/A'}
            Feedback Type: ${entry['Feedback Type'] || 'N/A'}
            Tags/Skills: ${entry['Tags'] || 'N/A'}
            Impact Rating: ${entry['Star Impact (1-5)'] || 'N/A'}
            Actual Feedback: ${entry['Actual Feedback'] || 'N/A'}`;
        }).join("\n\n");
        
        // Add custom prompt if provided
        const customPromptText = customPrompt ? `\n\nAdditional context and instructions: ${customPrompt}` : "";
        
        // Final formatting instructions
        const formattingInstructions = `
        Format each story clearly with distinct sections labeled "Situation:", "Task:", "Action:", and "Result:".
        Use professional language appropriate for business settings. 
        Each story should be concise but complete, focusing on high-impact details.
        Separate each story with a blank line for clarity.`;
        
        // Combine all components into the final prompt
        return `${basePrompt}\n\n${feedbackExamples}${customPromptText}\n\n${formattingInstructions}`;
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