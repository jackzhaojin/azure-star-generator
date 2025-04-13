/**
 * UI Controller module for the STAR Story Generator
 * Handles UI updates and interactions
 */

// UI Element references - populated on init
let elements = {
    // Forms and inputs
    feedbackForm: null,
    csvFileInput: null,
    interactionType: null,
    customOptions: null,
    customPrompt: null,
    
    // Status elements
    fileInfo: null,
    loadingSpinner: null,
    
    // Container elements
    resultContainer: null,
    resultContainerMobile: null,
    
    // Desktop story elements
    audienceLabel: null,
    currentStorySpan: null,
    totalStoriesSpan: null,
    situationText: null,
    taskText: null,
    actionText: null,
    resultText: null,
    prevStoryBtn: null,
    nextStoryBtn: null,
    copyBtn: null,
    regenerateBtn: null,
    
    // Mobile story elements
    audienceLabelMobile: null,
    currentStorySpanMobile: null, 
    totalStoriesSpanMobile: null,
    prevStoryBtnMobile: null,
    nextStoryBtnMobile: null,
    copyBtnMobile: null,
    regenerateBtnMobile: null
};

/**
 * Initialize UI element references and event listeners
 */
function initUI() {
    // Forms and inputs
    elements.feedbackForm = getElement('feedbackForm');
    elements.csvFileInput = getElement('csvFile');
    elements.interactionType = getElement('interactionType');
    elements.customOptions = getElement('customOptions');
    elements.customPrompt = getElement('customPrompt');
    
    // Status elements
    elements.fileInfo = getElement('fileInfo');
    elements.loadingSpinner = getElement('loadingSpinner');
    
    // Container elements
    elements.resultContainer = getElement('resultContainer');
    elements.resultContainerMobile = getElement('resultContainerMobile');
    
    // Desktop story elements
    elements.audienceLabel = getElement('audienceLabel');
    elements.currentStorySpan = getElement('currentStory');
    elements.totalStoriesSpan = getElement('totalStories');
    elements.situationText = getElement('situationText');
    elements.taskText = getElement('taskText');
    elements.actionText = getElement('actionText');
    elements.resultText = getElement('resultText');
    elements.prevStoryBtn = getElement('prevStory');
    elements.nextStoryBtn = getElement('nextStory');
    elements.copyBtn = getElement('copyBtn');
    elements.regenerateBtn = getElement('regenerateBtn');
    
    // Mobile story elements
    elements.audienceLabelMobile = getElement('audienceLabelMobile');
    elements.currentStorySpanMobile = getElementBySelector('.current-story-mobile');
    elements.totalStoriesSpanMobile = getElementBySelector('.total-stories-mobile');
    elements.prevStoryBtnMobile = getElementBySelector('.prev-story-mobile');
    elements.nextStoryBtnMobile = getElementBySelector('.next-story-mobile');
    elements.copyBtnMobile = getElementBySelector('.copy-btn-mobile');
    elements.regenerateBtnMobile = getElementBySelector('.regenerate-btn-mobile');
}

/**
 * Update story view with current story content
 */
function updateStoryView() {
    const currentStory = getCurrentStory();
    if (!currentStory) return;
    
    // Update desktop view
    elements.situationText.textContent = currentStory.situation;
    elements.taskText.textContent = currentStory.task;
    
    // Handle action items as bullet points if it's an array
    if (Array.isArray(currentStory.action)) {
        const actionHtml = '<ul>' + 
            currentStory.action.map(item => `<li>${item}</li>`).join('') + 
            '</ul>';
        elements.actionText.innerHTML = actionHtml;
    } else {
        elements.actionText.textContent = currentStory.action;
    }
    
    elements.resultText.textContent = currentStory.result;
    
    elements.currentStorySpan.textContent = window.AppState.currentStoryIndex + 1;
    elements.totalStoriesSpan.textContent = window.AppState.generatedStories.length;
    
    // Update navigation buttons - desktop
    elements.prevStoryBtn.disabled = window.AppState.currentStoryIndex === 0;
    elements.nextStoryBtn.disabled = window.AppState.currentStoryIndex === window.AppState.generatedStories.length - 1;
}

/**
 * Show generated stories in the UI
 */
function showStories() {
    // Show result containers - both desktop and mobile
    elements.resultContainer.style.display = 'block';
    
    // Update the story view
    updateStoryView();
    
    // Scroll to the results container
    scrollToElement(elements.resultContainer);
}

/**
 * Update audience labels based on interaction type
 * @param {string} interactionType - The type of interaction
 */
function updateAudienceLabels(interactionType) {
    const labelText = getAudienceLabelText(interactionType);
    elements.audienceLabel.textContent = labelText;
}

/**
 * Show loading state
 * @param {boolean} isLoading - Whether loading is in progress
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        elements.loadingSpinner.style.display = 'block';
    } else {
        elements.loadingSpinner.style.display = 'none';
    }
}

/**
 * Copy the current story to clipboard
 */
async function copyCurrentStoryToClipboard() {
    const currentStory = getCurrentStory();
    if (!currentStory) return;
    
    const storyText = formatStarStory(currentStory);
    
    try {
        await copyToClipboard(storyText);
        
        // Update both desktop and mobile buttons
        const originalText = elements.copyBtn.textContent;
        elements.copyBtn.textContent = 'Copied!';
        
        // Update mobile button if it exists
        if (elements.copyBtnMobile) {
            elements.copyBtnMobile.textContent = 'Copied!';
        }
        
        setTimeout(() => {
            elements.copyBtn.textContent = originalText;
            if (elements.copyBtnMobile) {
                elements.copyBtnMobile.textContent = originalText;
            }
        }, 2000);
    } catch (err) {
        console.error('Could not copy text: ', err);
    }
}