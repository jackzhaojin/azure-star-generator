/**
 * Story Generator module for the STAR Story Generator
 * Handles generating stories based on CSV data
 */

/**
 * Generate STAR stories via API
 * @param {string} interactionType - The type of interaction (e.g., 'top5', 'leadership')
 * @param {string} customPrompt - Optional custom prompt for story generation
 * @returns {Promise} - Promise resolving to generated stories
 */
async function generateStories(interactionType, customPrompt) {
    if (!window.AppState.parsedData) {
        throw new Error('No parsed data available for story generation.');
    }
    
    console.log("Generating STAR stories with", window.AppState.parsedData.length, "entries");
    
    const response = await fetch('/api/GenerateStarStories', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            parsedData: window.AppState.parsedData,
            interactionType: interactionType,
            customPrompt: customPrompt || ''
        })
    });
    
    if (!response.ok) {
        throw new Error(`Failed to generate stories: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Stories generation result:", result.success, "Stories:", result.stories ? result.stories.length : 0);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to generate stories');
    }
    
    // Validate that we received actual stories
    if (!Array.isArray(result.stories) || result.stories.length === 0) {
        throw new Error('No stories were generated');
    }
    
    // Validate each story
    result.stories.forEach((story, index) => {
        if (!isValidStory(story)) {
            console.warn(`Story at index ${index} is invalid:`, story);
        }
    });
    
    // Store the generated stories in application state
    window.AppState.generatedStories = result.stories;
    window.AppState.currentStoryIndex = 0;
    
    return result.stories;
}

/**
 * Get audience label text based on interaction type
 * @param {string} interactionType - The type of interaction
 * @returns {string} - Descriptive text for the audience
 */
function getAudienceLabelText(interactionType) {
    switch(interactionType) {
        case 'colleague':
            return 'Stories tailored for sharing with colleagues';
        case 'client':
            return 'Stories tailored for potential clients';
        case 'employer':
            return 'Stories tailored for job interviews and career advancement';
        case 'custom':
            return 'Custom stories based on your specifications';
        case 'top5':
            return 'Top 5 stories for interview preparation';
        case 'leadership':
            return 'Stories focused on leadership & management skills';
        case 'technical':
            return 'Stories highlighting technical achievements';
        case 'sales':
            return 'Stories showcasing sales and client success';
        default:
            return 'Stories tailored for your chosen audience';
    }
}

/**
 * Process the current story for display
 * @returns {Object} - The current story object
 */
function getCurrentStory() {
    if (!window.AppState.generatedStories || window.AppState.generatedStories.length === 0) {
        return null;
    }
    
    return window.AppState.generatedStories[window.AppState.currentStoryIndex];
}

/**
 * Navigate to the previous story
 * @returns {boolean} - Whether navigation was successful
 */
function previousStory() {
    if (window.AppState.currentStoryIndex > 0) {
        window.AppState.currentStoryIndex--;
        return true;
    }
    return false;
}

/**
 * Navigate to the next story
 * @returns {boolean} - Whether navigation was successful
 */
function nextStory() {
    if (window.AppState.currentStoryIndex < window.AppState.generatedStories.length - 1) {
        window.AppState.currentStoryIndex++;
        return true;
    }
    return false;
}