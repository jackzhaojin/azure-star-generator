/**
 * Response Processor for STAR story generation
 * Handles parsing, validation, and processing of AI responses
 */

/**
 * Process raw AI response into structured stories
 * @param {string} responseText - Raw text response from AI
 * @returns {Array} - Array of validated story objects
 */
function processResponse(responseText) {
    try {
        // Parse the response into structured stories
        const stories = parseAIResponse(responseText);
        
        if (!stories || stories.length === 0) {
            throw new Error('No valid stories were parsed from the response');
        }
        
        // Validate and enhance each story
        return validateStories(stories);
    } catch (error) {
        throw new Error(`Failed to process AI response: ${error.message}`);
    }
}

/**
 * Parse AI response into structured stories
 * @param {string} responseText - Raw text response from AI
 * @returns {Array} - Array of structured story objects
 */
function parseAIResponse(responseText) {
    try {
        // Try to extract JSON if it's wrapped in other text
        let jsonText = responseText;
        
        // Look for JSON array brackets if the response contains other text
        const jsonStartIndex = responseText.indexOf('[');
        const jsonEndIndex = responseText.lastIndexOf(']');
        
        if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
            jsonText = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
        }
        
        // Parse the JSON
        const stories = JSON.parse(jsonText);
        
        // Validate that we have an array
        if (!Array.isArray(stories)) {
            throw new Error('Response is not a valid array');
        }
        
        return stories;
    } catch (error) {
        // Fallback to the text parsing method if JSON parsing fails
        return parseAIResponseText(responseText);
    }
}

/**
 * Fallback method to parse AI response as text if JSON parsing fails
 * @param {string} responseText - Raw text response from AI
 * @returns {Array} - Array of structured story objects
 */
function parseAIResponseText(responseText) {
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
            // Extract action items as an array by looking for bullet points or numbered lists
            let actionText = actionMatch[1].trim();
            let actionItems = [];
            
            // Try to split by bullet points (•, -, *, etc.) or numbered items
            const bulletMatches = actionText.match(/(?:^|\n)[\s]*[•\-\*\d+\.\)]\s*(.*?)(?=(?:^|\n)[\s]*[•\-\*\d+\.\)]|$)/gs);
            
            if (bulletMatches && bulletMatches.length > 0) {
                // Process each bullet point
                actionItems = bulletMatches.map(bullet => {
                    // Remove the bullet character or number and trim
                    return bullet.replace(/^[\s]*[•\-\*\d+\.\)]\s*/, '').trim();
                });
            } else {
                // If no bullet points found, try to split by sentences or semicolons
                actionItems = actionText.split(/[\.;]\s+/).filter(item => item.trim().length > 0);
            }
            
            // If we still don't have action items, use the whole text as one item
            if (actionItems.length === 0) {
                actionItems = [actionText];
            }
            
            const story = {
                situation: situationMatch[1].trim(),
                task: taskMatch[1].trim(),
                action: actionItems,
                result: resultMatch[1].trim()
            };
            
            stories.push(story);
        }
    }
    
    return stories;
}

/**
 * Validate stories and filter out invalid ones
 * @param {Array} stories - Array of story objects
 * @returns {Array} - Array of validated story objects
 */
function validateStories(stories) {
    // Filter out invalid stories
    return stories.filter(story => {
        // Check if all required fields exist
        const hasAllFields = story && 
            typeof story === 'object' &&
            typeof story.situation === 'string' && story.situation.trim() !== '' &&
            typeof story.task === 'string' && story.task.trim() !== '' &&
            story.result && typeof story.result === 'string' && story.result.trim() !== '';
        
        // Check if action is an array or can be converted to one
        let validAction = false;
        if (Array.isArray(story.action)) {
            validAction = story.action.length > 0 && 
                          story.action.every(item => typeof item === 'string' && item.trim() !== '');
        } else if (typeof story.action === 'string' && story.action.trim() !== '') {
            // Convert string to single-item array if needed
            story.action = [story.action];
            validAction = true;
        }
        
        return hasAllFields && validAction;
    }).map(story => {
        // Normalize text in each field
        return {
            situation: normalizeText(story.situation),
            task: normalizeText(story.task),
            action: Array.isArray(story.action) 
                ? story.action.map(normalizeText) 
                : [normalizeText(story.action)],
            result: normalizeText(story.result)
        };
    });
}

/**
 * Normalize text by trimming and standardizing whitespace
 * @param {string} text - The text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
    if (!text) return '';
    
    // Replace multiple spaces with a single space
    return text.trim().replace(/\s+/g, ' ');
}

module.exports = {
    processResponse
};