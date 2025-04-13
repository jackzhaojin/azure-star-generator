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
 * Process CSV data via API
 * @returns {Promise} - Promise resolving to parsed CSV data
 */
async function processCSVData() {
    if (!window.AppState.csvData) {
        throw new Error('No CSV data available for processing.');
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
        fileInfo.textContent = fileName || 'No file selected';
    }
}