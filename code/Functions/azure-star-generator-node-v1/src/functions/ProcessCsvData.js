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
    // Simple CSV parser (in production, you might want to use a library like PapaParse)
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = lines[i].split(',');
        const row = {};
        
        // Handle cases where values might contain commas within quotes
        let tempValues = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (const value of values) {
            if (inQuotes) {
                currentValue += ',' + value;
                if (value.endsWith('"')) {
                    inQuotes = false;
                    tempValues.push(currentValue.slice(1, -1)); // Remove quotes
                    currentValue = '';
                }
            } else if (value.startsWith('"') && !value.endsWith('"')) {
                inQuotes = true;
                currentValue = value;
            } else {
                tempValues.push(value);
            }
        }
        
        // If we're still in quotes, we have an issue with the CSV format
        if (!inQuotes) {
            headers.forEach((header, index) => {
                if (index < values.length) {
                    row[header] = values[index].trim();
                }
            });
            results.push(row);
        }
    }
    
    return results;
}

module.exports = app;