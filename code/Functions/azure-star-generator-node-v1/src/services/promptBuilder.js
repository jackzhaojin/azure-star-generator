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
    // Get interaction-specific context based on dropdown selection
    const contextInfo = getInteractionContext(interactionType);
    
    // Base prompt with STAR structure guidance
    const basePrompt = `You are an expert in crafting professional STAR (Situation, Task, Action, Result) stories. 
    Create compelling and authentic narratives based on the following feedback data that I've received.
    
    Each story must follow this specific structure:
    - Situation: Exactly ONE concise sentence that sets the context with specific details about the challenge or opportunity. Be specific and quantitative where possible.
    - Task: ONE to TWO sentences clearly explaining my specific responsibilities or objectives in this situation. Focus on what I needed to accomplish.
    - Action: A BULLETED LIST of specific steps I took, focusing on MY individual contribution even in team settings. Include 4-6 concrete actions. Feel free to extrapolate reasonable details based on the information provided.
    - Result: EXACTLY THREE sentences quantifying the positive outcomes where possible and linking them directly to my actions. The first sentence should focus on immediate impacts, the second on metrics or quantifiable outcomes, and the third on longer-term or broader implications.
    
    ${contextInfo.instructions}
    ${contextInfo.audience}`;
    
    // Include a selection of feedback entries as context - up to 40 entries for more context
    const feedbackExamples = getFeedbackExamples(parsedData, interactionType);
    
    // Add custom prompt if provided
    const customPromptText = customPrompt ? `\n\nAdditional context and instructions: ${customPrompt}` : "";
    
    // Output format instructions - JSON format with example
    const outputFormatInstructions = getOutputFormatInstructions();
    
    // Combine all components into the final prompt
    return `${basePrompt}\n\n${feedbackExamples}${customPromptText}\n\n${outputFormatInstructions}`;
}

/**
 * Get context information based on the interaction type from dropdown
 * @param {string} interactionType - Selected interaction type from UI dropdown
 * @returns {Object} - Object with instructions and audience context
 */
function getInteractionContext(interactionType) {
    let instructions = '';
    let audience = '';
    
    // Match the interaction types from the HTML dropdown
    switch(interactionType) {
        // Story Collections
        case 'top10':
            instructions = `Generate my top 10 most impactful STAR stories based on the feedback data provided. 
            These should be diverse, covering different skills and situations, and showcase my most significant achievements. 
            For each story, create a clear Situation, Task, Action, and Result that demonstrates substantial positive impact. 
            Select stories that would be most impressive in interview scenarios.`;
            break;
            
        case 'leadership':
            instructions = `Generate STAR stories that highlight my leadership and management abilities. 
            Focus on instances where I led teams, influenced stakeholders, made difficult decisions, resolved conflicts, 
            or developed other team members. Include examples that demonstrate strategic thinking, emotional intelligence, 
            delegation, motivation, and other key leadership competencies.`;
            break;
            
        case 'technical':
            instructions = `Generate STAR stories that showcase my technical expertise and problem-solving abilities. 
            Focus on instances where I solved complex technical challenges, implemented innovative solutions, 
            demonstrated deep expertise in specific technologies, or improved systems/processes through technical means. 
            Include quantifiable results where possible.`;
            break;
            
        case 'sales':
            instructions = `Generate STAR stories that highlight my client success and sales achievements. 
            Focus on instances where I won new business, strengthened client relationships, overcame objections, 
            identified new opportunities, or delivered exceptional client value. Include specific metrics on revenue 
            generated, deals closed, or client satisfaction improvements where possible.`;
            break;
            
        // Audience-Focused Stories
        case 'colleague':
            audience = `These stories will be shared with colleagues who are familiar with my industry and organization. 
            The tone should be collaborative and emphasis should be on teamwork and mutual success. 
            Include relevant technical details that a peer would understand and appreciate.`;
            break;
            
        case 'client':
            audience = `These stories will be shared with potential clients to demonstrate my expertise and value. 
            The tone should be professional and confident but not boastful. Focus on client outcomes and benefits 
            rather than internal processes. Use industry-appropriate language but avoid excessive jargon.`;
            break;
            
        case 'employer':
            audience = `These stories will be shared in job interviews or performance reviews. 
            The tone should be achievement-oriented and demonstrate my unique value proposition. 
            Each story should clearly highlight skills relevant to potential employers and include 
            quantifiable results wherever possible.`;
            break;
            
        case 'custom':
            // For custom prompts, we rely on the additional context provided by the user
            instructions = 'Generate professional STAR stories based on the additional context provided.';
            break;
            
        default:
            // Default case for any new options added in the future
            instructions = `Generate professional STAR stories tailored for the "${interactionType}" context.`;
    }
    
    return { instructions, audience };
}

/**
 * Get feedback examples formatted for the prompt
 * @param {Array} parsedData - Array of feedback data objects
 * @param {string} interactionType - Type of interaction
 * @returns {string} - Formatted feedback examples
 */
function getFeedbackExamples(parsedData, interactionType) {
    // Use up to 40 entries to provide comprehensive context
    const maxEntries = 40;
    const feedbackCount = Math.min(maxEntries, parsedData.length);
    
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
    
    - "situation": A single sentence describing the context (required)
    - "task": 1-2 sentences describing my responsibility (required)
    - "action": An ARRAY OF STRINGS where each string is one action step I took (required)
    - "result": Exactly three sentences about the outcome (required)
    
    Here is an example of the exact JSON format expected:
    
    [
      {
        "situation": "A Fortune 500 client's e-commerce platform was failing to meet compliance with new regional data privacy regulations, putting a $50M annual revenue stream at risk.",
        "task": "As the lead software architect, I was tasked with redesigning the system to meet the regulation in under 8 weeks while ensuring zero downtime for customers.",
        "action": [
          "Analyzed legacy architecture and identified non-compliant components.",
          "Collaborated with legal to translate regulatory needs into technical specs.",
          "Designed region-specific services with data residency enforcement.",
          "Refactored data storage for dynamic regional sharding.",
          "Automated compliance checks in CI/CD pipeline.",
          "Tested regional scenarios in parallel environments."
        ],
        "result": "The solution was delivered one week ahead of the deadline, avoiding potential fines and public exposure. We achieved 100% compliance certification across all impacted regions. Additionally, customer trust scores in post-deployment surveys rose by 12%, improving brand reputation."
      },
      {
        "situation": "An internal analytics platform used across multiple business units was slow, outdated, and underutilized, costing over $2M annually with little executive support to maintain it.",
        "task": "I was brought in to assess and redesign the platform to justify its continuation or recommend decommissioning.",
        "action": [
          "Interviewed stakeholders to uncover needs and pain points.",
          "Evaluated usage patterns to find high-impact areas.",
          "Redesigned using serverless cloud architecture to cut idle costs.",
          "Automated data ingestion with Azure Data Factory.",
          "Built role-based dashboards for key business units."
        ],
        "result": "The new platform reduced infrastructure costs by 65% and improved processing time by 80%. User adoption increased by 3x within the first quarter, with all departments integrating the dashboards into their monthly reporting. Ultimately, the project delivered a $1.2M net savings in the first year and became a reference model for future internal tools."
      }
    ]
    
    DO NOT include any explanations, introductions, or text outside of this JSON array. The response should be directly parseable by JSON.parse() without any modifications.`;
}

module.exports = {
    buildPrompt
};