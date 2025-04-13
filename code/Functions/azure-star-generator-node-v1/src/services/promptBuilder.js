/**
 * Prompt Builder for STAR story generation
 * Handles all prompt engineering and preparation logic
 */

/**
 * Build prompt for Azure OpenAI based on interaction type
 * @param {Array} parsedData - Array of feedback data objects
 * @param {string} interactionType - Type of audience for the stories
 * @param {string} customPrompt - Additional custom instructions
 * @returns {string} - Generated prompt
 */
function buildPrompt(parsedData, interactionType, customPrompt) {
    // Create tailored instructions based on interaction type
    let specificInstructions = getSpecificInstructions(interactionType);
    let audienceContext = getAudienceContext(interactionType);
    
    // Base prompt with STAR structure guidance
    const basePrompt = getBasePrompt(specificInstructions, audienceContext);
    
    // Include a selection of feedback entries as context
    // Use more entries for the dataset if generating top 10
    const feedbackExamples = getFeedbackExamples(parsedData, interactionType);
    
    // Add custom prompt if provided
    const customPromptText = customPrompt ? `\n\nAdditional context and instructions: ${customPrompt}` : "";
    
    // Output format instructions - JSON format
    const outputFormatInstructions = getOutputFormatInstructions();
    
    // Combine all components into the final prompt
    return `${basePrompt}\n\n${feedbackExamples}${customPromptText}\n\n${outputFormatInstructions}`;
}

/**
 * Get specific instructions based on interaction type
 * @param {string} interactionType - Type of interaction
 * @returns {string} - Specific instructions
 */
function getSpecificInstructions(interactionType) {
    switch(interactionType) {
        case 'top10':
            return `Generate my top 10 most impactful STAR stories based on the feedback data provided. 
            These should be diverse, covering different skills and situations, and showcase my most significant achievements. 
            For each story, create a clear Situation, Task, Action, and Result that demonstrates substantial positive impact. 
            Select stories that would be most impressive in interview scenarios.`;
            
        case 'leadership':
            return `Generate STAR stories that highlight my leadership and management abilities. 
            Focus on instances where I led teams, influenced stakeholders, made difficult decisions, resolved conflicts, 
            or developed other team members. Include examples that demonstrate strategic thinking, emotional intelligence, 
            delegation, motivation, and other key leadership competencies.`;
            
        case 'technical':
            return `Generate STAR stories that showcase my technical expertise and problem-solving abilities. 
            Focus on instances where I solved complex technical challenges, implemented innovative solutions, 
            demonstrated deep expertise in specific technologies, or improved systems/processes through technical means. 
            Include quantifiable results where possible.`;
            
        case 'sales':
            return `Generate STAR stories that highlight my client success and sales achievements. 
            Focus on instances where I won new business, strengthened client relationships, overcame objections, 
            identified new opportunities, or delivered exceptional client value. Include specific metrics on revenue 
            generated, deals closed, or client satisfaction improvements where possible.`;
            
        default:
            // Default case for any new options added in the future
            return `Generate professional STAR stories tailored for the "${interactionType}" context.`;
    }
}

/**
 * Get audience context based on interaction type
 * @param {string} interactionType - Type of interaction
 * @returns {string} - Audience context
 */
function getAudienceContext(interactionType) {
    switch(interactionType) {
        case 'colleague':
            return `These stories will be shared with colleagues who are familiar with my industry and organization. 
            The tone should be collaborative and emphasis should be on teamwork and mutual success. 
            Include relevant technical details that a peer would understand and appreciate.`;
            
        case 'client':
            return `These stories will be shared with potential clients to demonstrate my expertise and value. 
            The tone should be professional and confident but not boastful. Focus on client outcomes and benefits 
            rather than internal processes. Use industry-appropriate language but avoid excessive jargon.`;
            
        case 'employer':
            return `These stories will be shared in job interviews or performance reviews. 
            The tone should be achievement-oriented and demonstrate my unique value proposition. 
            Each story should clearly highlight skills relevant to potential employers and include 
            quantifiable results wherever possible.`;
            
        default:
            return ''; // No specific audience context for other types
    }
}

/**
 * Get base prompt with STAR structure guidance
 * @param {string} specificInstructions - Specific instructions based on interaction type
 * @param {string} audienceContext - Context about the audience
 * @returns {string} - Base prompt
 */
function getBasePrompt(specificInstructions, audienceContext) {
    return `You are an expert in crafting professional STAR (Situation, Task, Action, Result) stories. 
    Create compelling and authentic narratives based on the following feedback data that I've received.
    
    Each story must follow this structure:
    - Situation: Concisely set the context with specific details about the challenge or opportunity
    - Task: Clearly explain my specific responsibilities or objectives in this situation
    - Action: Detail the specific steps I took, focusing on MY individual contribution even in team settings
    - Result: Quantify the positive outcomes where possible and link them directly to my actions
    
    ${specificInstructions}
    ${audienceContext}`;
}

/**
 * Get feedback examples formatted for the prompt
 * @param {Array} parsedData - Array of feedback data objects
 * @param {string} interactionType - Type of interaction
 * @returns {string} - Formatted feedback examples
 */
function getFeedbackExamples(parsedData, interactionType) {
    const feedbackCount = interactionType === 'top10' ? Math.min(10, parsedData.length) : Math.min(5, parsedData.length);
    
    return parsedData.slice(0, feedbackCount).map((entry, index) => {
        return `Feedback Entry #${index + 1}:
        Date: ${entry['Date'] || 'N/A'}
        Source: ${entry['Source'] || 'N/A'}
        Project/Context: ${entry['Project / Context'] || 'N/A'}
        Feedback Type: ${entry['Feedback Type'] || 'N/A'}
        Tags/Skills: ${entry['Tags'] || 'N/A'}
        Impact Rating: ${entry['Star Impact (1-5)'] || 'N/A'}
        Actual Feedback: ${entry['Actual Feedback'] || 'N/A'}`;
    }).join("\n\n");
}

/**
 * Get output format instructions for JSON format
 * @returns {string} - Output format instructions
 */
function getOutputFormatInstructions() {
    return `
    VERY IMPORTANT: Your response MUST be formatted as a valid JSON array of story objects. Each object should have the following structure:
    
    [
      {
        "situation": "Description of the situation...",
        "task": "Description of the task...",
        "action": "Description of the action taken...",
        "result": "Description of the result achieved..."
      },
      {
        "situation": "...",
        "task": "...",
        "action": "...",
        "result": "..."
      }
    ]
    
    DO NOT include any explanations, introductions, or text outside of this JSON array. The response should be parseable by JSON.parse() without any modifications.`;
}

module.exports = {
    buildPrompt
};