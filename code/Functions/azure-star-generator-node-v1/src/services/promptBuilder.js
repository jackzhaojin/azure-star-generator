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

    IMPORTANT: Each story must strictly adhere to this structure. Do not deviate from the format or omit any required elements. Ensure that the Situation, Task, Action, and Result are clearly distinct and follow the specified guidelines.
    Guidelines needs to be extrapolated, for example, if it's a sales topic we need to talk about revenue. If it's about technical we need to focus on result for a technical.

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
        case 'top5':
            instructions = `Guideline: Select the top 5 STAR stories that represent a diverse range of my skills and experiences. 
            Prioritize stories that demonstrate versatility, adaptability, and a balance of technical, leadership, and interpersonal skills. 
            Ensure each story is unique and highlights a different aspect of my professional journey.`;
            break;
            
        case 'leadership':
            instructions = `Guideline: Focus on STAR stories that emphasize my ability to lead and inspire others. 
            Highlight situations where I drove organizational change, mentored team members, or navigated complex challenges 
            requiring strategic decision-making. Include examples that showcase my vision, resilience, and ability to influence outcomes.`;
            break;
            
        case 'technical':
            instructions = `Guideline: Generate STAR stories that delve into my technical problem-solving and innovation. 
            Highlight scenarios where I tackled cutting-edge challenges, introduced groundbreaking solutions, or optimized 
            systems for efficiency and scalability. Focus on technical depth, creativity, and measurable results.`;
            break;
            
        case 'sales':
            instructions = `Guideline: Create STAR stories that showcase my ability to drive business growth and client success. 
            Highlight achievements in exceeding sales targets, building long-term client relationships, and identifying 
            untapped opportunities. Focus on metrics like revenue growth, client retention, and market expansion.`;
            break;
            
        // Audience-Focused Stories
        case 'colleague':
            audience = `Guideline: These stories will be shared with colleagues to foster collaboration and mutual understanding. 
            Emphasize teamwork, shared successes, and contributions to group objectives. Use a tone that is relatable and 
            avoids overly formal language, while still being professional.`;
            break;
            
        case 'client':
            audience = `Guideline: These stories will be shared with clients to build trust and credibility. 
            Focus on delivering value, solving client-specific challenges, and achieving measurable outcomes. 
            Use a tone that is client-centric, emphasizing benefits and results over internal processes.`;
            break;
            
        case 'employer':
            audience = `Guideline: These stories will be shared with potential employers to highlight my unique qualifications. 
            Focus on achievements that align with the job role, showcasing my ability to deliver results and exceed expectations. 
            Use a tone that is confident and emphasizes my professional growth and impact.`;
            break;
            
        case 'custom':
            // For custom prompts, we rely on the additional context provided by the user
            instructions = 'Generate STAR stories tailored to the specific context and instructions provided.';
            break;
            
        default:
            // Default case for any new options added in the future
            instructions = `Generate STAR stories customized for the "${interactionType}" context, ensuring relevance and impact.`;
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
    // Limit to 50 entries maximum to avoid token issues
    const maxEntries = 50;
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