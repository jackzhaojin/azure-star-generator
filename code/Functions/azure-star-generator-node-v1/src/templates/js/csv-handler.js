/**
 * CSV handling module for the STAR Story Generator
 * Handles CSV file reading and processing
 */

/**
 * Read a CSV file and store its content in the application state
 * @param {File} file - The CSV file to read
 * @returns {Promise} - Promise resolving when file is read
 */
function readCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            window.AppState.csvData = e.target.result;
            console.log("CSV file loaded successfully", e.target.result.substring(0, 100) + "...");
            resolve(e.target.result);
        };
        
        reader.onerror = function(e) {
            console.error("Error reading file:", e);
            window.AppState.csvData = null;
            reject(new Error("Failed to read the CSV file."));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Set up drag and drop handlers for the file upload area
 */
function setupDragDropHandlers() {
    const fileUploadArea = document.querySelector('.file-upload-label');
    if (!fileUploadArea) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when file is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    fileUploadArea.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        fileUploadArea.style.backgroundColor = '#e9ecef';
        fileUploadArea.style.borderColor = 'var(--azure-blue)';
    }
    
    function unhighlight() {
        fileUploadArea.style.backgroundColor = '';
        fileUploadArea.style.borderColor = '';
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        
        if (file && file.type === 'text/csv' || file.name.endsWith('.csv')) {
            // Update the file input element to reflect the dropped file
            elements.csvFileInput.files = dt.files;
            
            // Update UI and process the file
            updateFileInfo(file.name + " (Your File)");
            readCSVFile(file).catch(error => showError(error.message));
            
            // Uncheck sample data toggle when a file is dropped
            elements.useSampleDataToggle.checked = false;
        } else {
            showError('Please upload a CSV file.');
        }
    }
}

/**
 * Load sample CSV data from the Azure Blob Storage
 * @returns {Promise} - Promise resolving when sample data is loaded
 */
async function loadSampleCSV() {
    try {
        // URL to the sample CSV file
        const sampleCsvUrl = 'https://jack2025storyrgbfb2.blob.core.windows.net/public/samplecsv.csv';
        
        console.log("Loading sample CSV from:", sampleCsvUrl);
        
        // Fetch the sample CSV
        const response = await fetch(sampleCsvUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to load sample CSV: ${response.status} ${response.statusText}`);
        }
        
        // Get the CSV data as text
        const csvData = await response.text();
        
        // Update UI and app state
        updateFileInfo('Sample CSV (UX Designer Feedback)');
        window.AppState.csvData = csvData;
        
        // Make sure the sample data toggle is checked
        if (elements.useSampleDataToggle) {
            elements.useSampleDataToggle.checked = true;
        }
        
        console.log("Sample CSV loaded successfully", csvData.substring(0, 100) + "...");
        
        return csvData;
    } catch (error) {
        console.error("Error loading sample CSV:", error);
        throw new Error("Failed to load sample CSV data: " + error.message);
    }
}

/**
 * Process CSV data via API
 * @returns {Promise} - Promise resolving to parsed CSV data
 */
async function processCSVData() {
    if (!window.AppState.csvData) {
        // Check if sample data should be used
        if (elements.useSampleDataToggle && elements.useSampleDataToggle.checked) {
            try {
                await loadSampleCSV();
            } catch (error) {
                throw new Error('No CSV data available for processing and failed to load sample: ' + error.message);
            }
        } else {
            throw new Error('No CSV data available for processing. Please upload a CSV file or enable sample data.');
        }
    }
    
    console.log("Sending CSV data for processing...");
    const response = await fetch('/api/ProcessCsvData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            csvData: window.AppState.csvData
        })
    });
    
    if (!response.ok) {
        throw new Error(`Failed to process CSV data: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("CSV processing result:", result.success, "Entries:", result.data ? result.data.length : 0);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to process CSV data');
    }
    
    // Validate the parsed data
    if (!Array.isArray(result.data) || result.data.length === 0) {
        throw new Error('CSV parsing failed to return valid data');
    }
    
    // Store the parsed data in application state
    window.AppState.parsedData = result.data;
    return result.data;
}

/**
 * Validates that the CSV file has the necessary columns
 * @param {Array} parsedData - The parsed CSV data
 * @returns {boolean} - Whether the CSV is valid
 */
function validateCSVFormat(parsedData) {
    if (!parsedData || !parsedData.length) {
        return false;
    }
    
    // Check for first row having the required columns
    const firstRow = parsedData[0];
    
    // Required columns (at least some of these should be present)
    const requiredColumns = [
        'Date', 'Source', 'Name', 'Project / Context',
        'Feedback Type', 'Tags', 'Star Impact (1-5)', 'Actual Feedback'
    ];
    
    // Count how many required columns are present
    const presentColumns = requiredColumns.filter(column => 
        firstRow.hasOwnProperty(column) && firstRow[column] !== undefined
    );
    
    // Consider valid if at least 3 of the required columns are present
    return presentColumns.length >= 3;
}

/**
 * Update the UI file info element
 * @param {string} fileName - The name of the selected file
 */
function updateFileInfo(fileName) {
    const fileInfo = getElement('fileInfo');
    if (fileInfo) {
        fileInfo.textContent = fileName || 'No file selected - Sample data will be used';
    }
}