/**
 * Utility functions for the STAR Story Generator application
 */

// Global state object to share data between modules
window.AppState = {
    csvData: null,
    parsedData: null,
    generatedStories: [],
    currentStoryIndex: 0,
    processingError: null
};

/**
 * Helper function to get DOM elements by ID
 * @param {string} id - The element ID
 * @returns {HTMLElement} - The DOM element
 */
function getElement(id) {
    return document.getElementById(id);
}

/**
 * Helper function to get DOM elements by selector
 * @param {string} selector - The CSS selector
 * @returns {HTMLElement} - The first matching DOM element
 */
function getElementBySelector(selector) {
    return document.querySelector(selector);
}

/**
 * Helper function to get all DOM elements matching a selector
 * @param {string} selector - The CSS selector
 * @returns {NodeList} - All matching DOM elements
 */
function getElementsBySelector(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Show an error message to the user
 * @param {string} message - The error message to display
 */
function showError(message) {
    console.error('Error:', message);
    alert('Error: ' + message);
}

/**
 * Copy text to clipboard
 * @param {string} text - The text to copy
 * @returns {Promise} - A promise that resolves when copying is complete
 */
function copyToClipboard(text) {
    return navigator.clipboard.writeText(text)
        .catch(err => {
            console.error('Could not copy text: ', err);
            throw err;
        });
}

/**
 * Format a STAR story for copying
 * @param {Object} story - The story object with situation, task, action, result properties
 * @returns {string} - Formatted story text
 */
function formatStarStory(story) {
    return `SITUATION:
${story.situation}

TASK:
${story.task}

ACTION:
${story.action}

RESULT:
${story.result}`;
}

/**
 * Scroll to an element with smooth behavior
 * @param {HTMLElement} element - The element to scroll to
 */
function scrollToElement(element) {
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Validate that an object is a valid STAR story
 * @param {Object} story - The story object to validate
 * @returns {boolean} - Whether the story is valid
 */
function isValidStory(story) {
    return story && 
           typeof story === 'object' && 
           typeof story.situation === 'string' && 
           typeof story.task === 'string' && 
           typeof story.action === 'string' && 
           typeof story.result === 'string';
}