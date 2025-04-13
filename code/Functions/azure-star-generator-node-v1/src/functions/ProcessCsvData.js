const { app } = require('@azure/functions');

app.http('ProcessCsvData', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed CSV data request`);

        try {
            const requestBody = await request.json();
            const { csvData } = requestBody;
            
            if (!csvData) {
                return {
                    status: 400,
                    jsonBody: { 
                        success: false, 
                        error: 'CSV data is required' 
                    }
                };
            }
            
            // Parse the CSV data
            const parsedData = parseCSV(csvData);
            
            return {
                jsonBody: { 
                    success: true, 
                    data: parsedData 
                }
            };
        } catch (error) {
            context.log.error('Error processing CSV data:', error);
            return {
                status: 500,
                jsonBody: { 
                    success: false, 
                    error: 'Failed to process CSV data: ' + error.message 
                }
            };
        }
    }
});

// Function to parse CSV data
function parseCSV(csvData) {
    // Simple CSV parser with improved handling for real-world CSV data
    const lines = csvData.split('\n');
    
    // Extract headers from the first line
    const headers = lines[0].split(',').map(header => header.trim());
    
    const results = [];
    
    // Track current row data
    let currentRow = null;
    let isValidRow = false;
    
    // Process each line starting from line 1 (after headers)
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = lines[i].split(',');
        
        // Check if this is a complete row with all expected columns
        if (values.length >= headers.length && values[0].trim() !== '') {
            // If we were processing a previous row, add it to results
            if (currentRow !== null && isValidRow) {
                results.push(currentRow);
            }
            
            // Start a new row
            currentRow = {};
            isValidRow = true;
            
            // Process each column
            for (let j = 0; j < headers.length; j++) {
                const header = headers[j];
                let value = values[j] ? values[j].trim() : '';
                
                // Handle quoted values that might span multiple lines
                if (value.startsWith('"') && !value.endsWith('"') && value.length > 1) {
                    // Value starts with a quote but doesn't end with one
                    let quotedValue = value;
                    let k = j + 1;
                    
                    // Continue reading until we find the closing quote
                    while (k < values.length) {
                        quotedValue += ',' + values[k];
                        if (values[k].endsWith('"')) {
                            break;
                        }
                        k++;
                    }
                    
                    // If we found a closing quote, use the complete value
                    if (k < values.length) {
                        value = quotedValue.slice(1, -1); // Remove quotes
                        j = k; // Skip the processed columns
                    }
                } else if (value.startsWith('"') && value.endsWith('"') && value.length > 1) {
                    // Simple quoted value
                    value = value.slice(1, -1); // Remove quotes
                }
                
                currentRow[header] = value;
            }
        } else if (currentRow !== null) {
            // This is likely a continuation of data from the previous row
            // For simplicity, we'll append this to the Actual Feedback field if it exists
            if (currentRow['Actual Feedback']) {
                currentRow['Actual Feedback'] += ' ' + lines[i].trim();
            }
        }
    }
    
    // Add the last row if it exists
    if (currentRow !== null && isValidRow) {
        results.push(currentRow);
    }
    
    return results;
}

module.exports = app;