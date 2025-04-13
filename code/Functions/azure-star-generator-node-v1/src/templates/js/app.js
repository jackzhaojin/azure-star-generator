/**
 * Main application module for the STAR Story Generator
 * Initializes the application and connects event handlers
 */

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('STAR Story Generator initializing...');
    
    // Initialize UI references
    initUI();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('STAR Story Generator initialized.');
});

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
    // Show custom options when the custom option is selected
    elements.interactionType.addEventListener('change', function() {
        if (this.value === 'custom') {
            elements.customOptions.style.display = 'block';
        } else {
            elements.customOptions.style.display = 'none';
        }
    });
    
    // Update file info when a file is selected
    elements.csvFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            updateFileInfo(file.name);
            readCSVFile(file).catch(error => showError(error.message));
        } else {
            updateFileInfo('No file selected');
            window.AppState.csvData = null;
        }
    });
    
    // Handle form submission
    elements.feedbackForm.addEventListener('submit', handleFormSubmit);
    
    // Navigation - desktop
    elements.prevStoryBtn.addEventListener('click', function() {
        if (previousStory()) {
            updateStoryView();
        }
    });
    
    elements.nextStoryBtn.addEventListener('click', function() {
        if (nextStory()) {
            updateStoryView();
        }
    });
    
    
    // Copy functionality
    elements.copyBtn.addEventListener('click', copyCurrentStoryToClipboard);
    
    // Regenerate functionality
    elements.regenerateBtn.addEventListener('click', confirmRegeneration);
}

/**
 * Confirm and handle story regeneration
 */
function confirmRegeneration() {
    if (confirm('This will regenerate all stories. Continue?')) {
        elements.feedbackForm.dispatchEvent(new Event('submit'));
    }
}

/**
 * Handle form submission for generating stories
 * @param {Event} e - The form submit event
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!window.AppState.csvData) {
        showError('Please upload a CSV file first.');
        return;
    }
    
    // Show loading spinner
    setLoadingState(true);
    
    try {
        // Step 1: Process the CSV data
        await processCSVData();
        
        // Step 2: Generate STAR stories
        const interactionType = elements.interactionType.value;
        const customPrompt = elements.customPrompt.value;
        
        // Update audience labels
        updateAudienceLabels(interactionType);
        
        // Generate stories
        await generateStories(interactionType, customPrompt);
        
        // Show stories in UI
        showStories();
        
    } catch (error) {
        showError(error.message);
        
        // Reset processing state
        window.AppState.parsedData = null;
        window.AppState.generatedStories = [];
    } finally {
        // Hide loading spinner
        setLoadingState(false);
    }
}