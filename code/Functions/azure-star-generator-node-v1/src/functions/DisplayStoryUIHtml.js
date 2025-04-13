const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

// Read the HTML template with inline CSS and JS
let htmlTemplate;

try {
    // Using path.resolve to ensure proper path resolution in Azure environment
    const templatesDir = path.resolve(__dirname, '../templates');
    
    htmlTemplate = fs.readFileSync(path.join(templatesDir, 'index.html'), 'utf8');
    console.log('Successfully loaded HTML template');
} catch (error) {
    console.error('Error loading HTML template:', error);
    // Fallback HTML in case the file cannot be read
    htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>STAR Story Generator</title>
        <style>
            body { font-family: sans-serif; margin: 20px; }
        </style>
    </head>
    <body>
        <h1>STAR Story Generator</h1>
        <p>Error loading the application. Please try again later.</p>
    </body>
    </html>`;
}

app.http('DisplayStoryUIHtml', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        // Handle POST requests (STAR story generation)
        if (request.method === 'POST') {
            try {
                const requestBody = await request.json();
                const { csvData, interactionType, customPrompt } = requestBody;
                
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
                
                // Generate STAR stories based on the interaction type
                const generatedStories = generateStoriesForCategory(parsedData, interactionType, customPrompt);
                
                return {
                    jsonBody: { 
                        success: true, 
                        stories: generatedStories 
                    }
                };
            } catch (error) {
                context.log.error('Error processing request:', error);
                return {
                    status: 500,
                    jsonBody: { 
                        success: false, 
                        error: 'Failed to process request: ' + error.message 
                    }
                };
            }
        }
        
        // GET requests - return the HTML page with inline CSS and JS
        return {
            body: htmlTemplate,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store' // Prevents caching to make development easier
            }
        };
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
            values.forEach((value, index) => {
                if (index < headers.length) {
                    row[headers[index]] = value.trim();
                }
            });
            results.push(row);
        }
    }
    
    return results;
}

// Main function to generate stories based on selection
function generateStoriesForCategory(csvData, interactionType, customPrompt) {
    // Sort data by impact rating (if available)
    const sortedData = [...csvData].sort((a, b) => {
        const impactA = parseInt(a['Star Impact (1-5)']) || 0;
        const impactB = parseInt(b['Star Impact (1-5)']) || 0;
        return impactB - impactA; // Sort descending
    });
    
    // Generate stories based on selected category
    switch(interactionType) {
        case 'top10':
            return generateTop10Stories(sortedData);
        case 'leadership':
            return generateLeadershipStories(sortedData);
        case 'technical':
            return generateTechnicalStories(sortedData);
        case 'sales':
            return generateSalesStories(sortedData);
        case 'colleague':
            return generateColleagueStories(sortedData, 5);
        case 'client':
            return generateClientStories(sortedData, 5);
        case 'employer':
            return generateEmployerStories(sortedData, 5);
        case 'custom':
            return generateCustomStories(sortedData, 5, customPrompt);
        default:
            return generateGeneralStories(sortedData, 5);
    }
}

// Generate top 10 stories for interview preparation
function generateTop10Stories(data) {
    // Take top 10 based on impact rating
    const stories = [];
    const count = 10;
    
    for (let i = 0; i < Math.min(count, data.length); i++) {
        const entry = data[i];
        const project = entry['Project / Context'] || 'a significant project';
        const feedback = entry['Actual Feedback'] || '';
        const tags = (entry['Tags'] || '').split(',');
        const skill = tags[0] || 'professional skills';
        
        stories.push({
            situation: `While working on ${project}, I was faced with a challenging situation that required me to demonstrate ${skill}. ${feedback.substring(0, 60)}...`,
            task: `My responsibility was to deliver results by overcoming specific obstacles and ensuring the project's success. This required me to utilize my expertise in ${tags.join(', ')} effectively.`,
            action: `I took initiative by analyzing the situation thoroughly, developing a strategic approach, and implementing a solution that addressed key stakeholder requirements. Specifically, I ${feedback.substring(60, 120)}...`,
            result: `As a result of my efforts, the project was completed successfully with measurable outcomes. This experience demonstrated my ability to handle complex situations and deliver results, which I believe makes me well-prepared for similar challenges in the future.`
        });
    }
    
    return stories;
}

// Generate leadership & management focused stories
function generateLeadershipStories(data) {
    const stories = [];
    const count = 5;
    
    // Filter for leadership/management related entries
    const leadershipEntries = data.filter(entry => {
        const tags = (entry['Tags'] || '').toLowerCase();
        const feedback = (entry['Actual Feedback'] || '').toLowerCase();
        const project = (entry['Project / Context'] || '').toLowerCase();
        
        return tags.includes('lead') || 
               tags.includes('manage') || 
               tags.includes('team') ||
               tags.includes('direct') ||
               feedback.includes('lead') || 
               feedback.includes('manage') ||
               feedback.includes('team') ||
               project.includes('lead') ||
               project.includes('manage');
    });
    
    // Use leadership entries if we have enough, otherwise use all data
    const sourceData = leadershipEntries.length >= count ? leadershipEntries : data;
    
    for (let i = 0; i < Math.min(count, sourceData.length); i++) {
        const entry = sourceData[i];
        const project = entry['Project / Context'] || 'a team project';
        const feedback = entry['Actual Feedback'] || '';
        const tags = (entry['Tags'] || '').split(',');
        
        stories.push({
            situation: `While leading ${project}, I encountered a situation that required strong leadership and management skills. ${feedback.substring(0, 60)}...`,
            task: `I was responsible for guiding the team through challenging circumstances while ensuring we met our objectives and deadlines. This required me to demonstrate ${tags[0] || 'leadership'} capabilities.`,
            action: `I approached this by first ensuring everyone understood our goals clearly, then delegating responsibilities based on team members' strengths. I established a structured communication framework, provided ongoing support and feedback, and stepped in directly when needed to resolve critical issues. Specifically, I ${feedback.substring(60, 120)}...`,
            result: `Through effective leadership, the team successfully delivered the project with excellent results. Team members reported increased engagement and satisfaction, and my management approach was recognized by stakeholders. This experience strengthened my leadership toolkit and provided valuable insights into effective team dynamics.`
        });
    }
    
    return stories;
}

// Generate technical achievement stories
function generateTechnicalStories(data) {
    const stories = [];
    const count = 5;
    
    // Filter for technical achievement entries
    const technicalEntries = data.filter(entry => {
        const tags = (entry['Tags'] || '').toLowerCase();
        const feedback = (entry['Actual Feedback'] || '').toLowerCase();
        const project = (entry['Project / Context'] || '').toLowerCase();
        
        return tags.includes('tech') || 
               tags.includes('develop') ||
               tags.includes('engineer') ||
               tags.includes('code') ||
               tags.includes('software') ||
               tags.includes('architect') ||
               tags.includes('program') ||
               feedback.includes('tech') || 
               feedback.includes('develop') ||
               feedback.includes('solution') ||
               project.includes('tech') ||
               project.includes('develop');
    });
    
    // Use technical entries if we have enough, otherwise use all data
    const sourceData = technicalEntries.length >= count ? technicalEntries : data;
    
    for (let i = 0; i < Math.min(count, sourceData.length); i++) {
        const entry = sourceData[i];
        const project = entry['Project / Context'] || 'a technical project';
        const feedback = entry['Actual Feedback'] || '';
        const tags = (entry['Tags'] || '').split(',');
        const technicalSkill = tags[0] || 'technical expertise';
        
        stories.push({
            situation: `During ${project}, I faced a complex technical challenge that required innovative problem-solving. ${feedback.substring(0, 60)}...`,
            task: `I needed to develop a solution that would address specific technical requirements while ensuring performance, scalability, and maintainability. This required leveraging my expertise in ${technicalSkill}.`,
            action: `I approached this methodically by first researching potential approaches, then designing a technical solution that balanced immediate needs with long-term considerations. I implemented the solution using best practices and conducted thorough testing. Specifically, I ${feedback.substring(60, 120)}...`,
            result: `The solution successfully met all technical requirements and delivered measurable improvements in system performance and reliability. My approach was documented and adopted as a best practice for similar challenges. This experience deepened my technical skills and demonstrated my ability to solve complex problems.`
        });
    }
    
    return stories;
}

// Generate sales and client success stories
function generateSalesStories(data) {
    const stories = [];
    const count = 5;
    
    // Filter for sales and client-related entries
    const salesEntries = data.filter(entry => {
        const tags = (entry['Tags'] || '').toLowerCase();
        const feedback = (entry['Actual Feedback'] || '').toLowerCase();
        const project = (entry['Project / Context'] || '').toLowerCase();
        
        return tags.includes('sales') || 
               tags.includes('client') ||
               tags.includes('customer') ||
               tags.includes('revenue') ||
               tags.includes('business development') ||
               feedback.includes('sales') || 
               feedback.includes('client') ||
               feedback.includes('customer') ||
               feedback.includes('revenue') ||
               project.includes('sales') ||
               project.includes('client');
    });
    
    // Use sales entries if we have enough, otherwise use all data
    const sourceData = salesEntries.length >= count ? salesEntries : data;
    
    for (let i = 0; i < Math.min(count, sourceData.length); i++) {
        const entry = sourceData[i];
        const project = entry['Project / Context'] || 'a client engagement';
        const feedback = entry['Actual Feedback'] || '';
        const tags = (entry['Tags'] || '').split(',');
        
        stories.push({
            situation: `During ${project}, I identified a significant opportunity to deliver value to a client facing substantial business challenges. ${feedback.substring(0, 60)}...`,
            task: `My objective was to develop a compelling solution that would address the client's needs while demonstrating clear ROI and strengthening our relationship with this key account.`,
            action: `I began by deeply understanding the client's business objectives and pain points, then developed a tailored approach that addressed their specific challenges. I collaborated with internal teams to ensure flawless delivery and maintained proactive communication throughout the process. Specifically, I ${feedback.substring(60, 120)}...`,
            result: `This approach resulted in a successful sale and implementation that delivered significant value to the client. The client reported high satisfaction with both the solution and our partnership approach, leading to expanded opportunities and strengthened relationship. The methodology I developed has since been applied to similar client situations with consistent success.`
        });
    }
    
    return stories;
}

// Generate stories for colleagues (emphasizing teamwork and collaboration)
function generateColleagueStories(data, count) {
    const stories = [];
    
    // Filter for teamwork and collaboration focused entries if possible
    const teamworkEntries = data.filter(entry => {
        const tags = (entry['Tags'] || '').toLowerCase();
        const feedback = (entry['Actual Feedback'] || '').toLowerCase();
        return tags.includes('team') || 
               tags.includes('collaborat') || 
               feedback.includes('team') || 
               feedback.includes('collaborat');
    });
    
    // Use teamwork entries if we have enough, otherwise use all data
    const sourceData = teamworkEntries.length >= count ? teamworkEntries : data;
    
    for (let i = 0; i < Math.min(count, sourceData.length); i++) {
        const entry = sourceData[i];
        const project = entry['Project / Context'] || 'a project';
        const feedback = entry['Actual Feedback'] || '';
        const tags = entry['Tags'] || '';
        
        stories.push({
            situation: `While working on ${project}, our team faced a challenge that required collaboration across different roles. ${feedback.substring(0, 60)}...`,
            task: `My specific responsibility within the team was to coordinate with others and ensure we all worked effectively together, focusing on ${tags.split(',')[0] || 'key deliverables'}.`,
            action: `I established clear communication channels for our team, created a shared tracking system, and regularly checked in with team members to remove obstacles. I made sure everyone's expertise was utilized effectively.`,
            result: `Through our combined efforts, we successfully completed the project with strong results. This experience reinforced my belief in the power of effective teamwork and has shaped how I approach collaborative work ever since.`
        });
    }
    
    return stories;
}

// Generate stories for potential clients (emphasizing results and value)
function generateClientStories(data, count) {
    const stories = [];
    
    // Filter for entries with measurable results if possible
    const resultFocusedEntries = data.filter(entry => {
        const feedback = (entry['Actual Feedback'] || '').toLowerCase();
        return feedback.includes('result') || 
               feedback.includes('increase') || 
               feedback.includes('improve') ||
               feedback.includes('success') ||
               feedback.includes('roi') ||
               feedback.includes('saving') ||
               feedback.includes('revenue');
    });
    
    // Use result-focused entries if we have enough, otherwise use all data
    const sourceData = resultFocusedEntries.length >= count ? resultFocusedEntries : data;
    
    for (let i = 0; i < Math.min(count, sourceData.length); i++) {
        const entry = sourceData[i];
        const project = entry['Project / Context'] || 'a client project';
        const feedback = entry['Actual Feedback'] || '';
        const tags = entry['Tags'] || '';
        
        stories.push({
            situation: `In a previous role, I worked with an organization facing challenges similar to yours. Specifically, while working on ${project}, we encountered a situation where ${feedback.substring(0, 60)}...`,
            task: `The client needed someone to take ownership of delivering measurable business results by leveraging expertise in ${tags.split(',')[0] || 'the relevant field'}.`,
            action: `I approached the problem by first thoroughly understanding the client's business objectives, then developing a strategic plan that focused on both quick wins and long-term value. I executed this plan by ${feedback.substring(60, 120)}...`,
            result: `This approach delivered tangible business outcomes for the client, including improved efficiency and cost savings. The methodology I developed has proven successful across multiple client engagements and could be adapted to address your current challenges.`
        });
    }
    
    return stories;
}

// Generate stories for potential employers (emphasizing skills and achievements)
function generateEmployerStories(data, count) {
    const stories = [];
    
    // Filter for high-impact entries if possible
    const highImpactEntries = data.filter(entry => {
        const impact = parseInt(entry['Star Impact (1-5)']) || 0;
        return impact >= 4;
    });
    
    // Use high-impact entries if we have enough, otherwise use all data
    const sourceData = highImpactEntries.length >= count ? highImpactEntries : data;
    
    for (let i = 0; i < Math.min(count, sourceData.length); i++) {
        const entry = sourceData[i];
        const project = entry['Project / Context'] || 'a challenging project';
        const feedback = entry['Actual Feedback'] || '';
        const tags = (entry['Tags'] || '').split(',');
        const skill = tags[0] || 'problem-solving';
        
        stories.push({
            situation: `While at ${entry['Source'] || 'my previous company'}, I was assigned to ${project} which presented a significant challenge. ${feedback.substring(0, 60)}...`,
            task: `I was responsible for delivering results under tight deadlines and with limited resources. This required me to demonstrate strong ${skill} skills and take full ownership of the outcomes.`,
            action: `I approached this methodically by breaking down the complex problem, prioritizing critical tasks, and implementing a solution that addressed key stakeholder concerns. I ${feedback.substring(60, 120)}...`,
            result: `As a result of my efforts, the project was completed successfully, delivering measurable value to the organization. This experience strengthened my ${skill} capabilities and demonstrated my ability to handle similar challenges in new environments.`
        });
    }
    
    return stories;
}

// Generate custom stories based on a specific prompt
function generateCustomStories(data, count, customPrompt) {
    const stories = [];
    
    // Default to high-impact entries
    const highImpactEntries = data.filter(entry => {
        const impact = parseInt(entry['Star Impact (1-5)']) || 0;
        return impact >= 3;
    });
    
    const sourceData = highImpactEntries.length >= count ? highImpactEntries : data;
    
    // Look for relevant keywords in the custom prompt
    const promptLower = (customPrompt || '').toLowerCase();
    const relevantEntries = sourceData.filter(entry => {
        const project = (entry['Project / Context'] || '').toLowerCase();
        const feedback = (entry['Actual Feedback'] || '').toLowerCase();
        const tags = (entry['Tags'] || '').toLowerCase();
        
        return promptLower.split(' ').some(word => 
            word.length > 3 && (
                project.includes(word) || 
                feedback.includes(word) || 
                tags.includes(word)
            )
        );
    });
    
    // Use relevant entries if we have enough, otherwise use source data
    const finalData = relevantEntries.length >= count ? relevantEntries : sourceData;
    
    for (let i = 0; i < Math.min(count, finalData.length); i++) {
        const entry = finalData[i];
        const project = entry['Project / Context'] || 'a relevant project';
        const feedback = entry['Actual Feedback'] || '';
        const tags = (entry['Tags'] || '').split(',');
        
        stories.push({
            situation: `In response to your interest in ${customPrompt || 'my professional background'}, I worked on ${project} which presented an opportunity to demonstrate relevant capabilities. ${feedback.substring(0, 60)}...`,
            task: `My objective was to address specific challenges while showcasing my strengths in ${tags[0] || 'relevant skills'} that align with what you're looking for.`,
            action: `I took a customized approach that focused on delivering the most relevant results. This involved ${feedback.substring(60, 120)}...`,
            result: `The outcome was particularly relevant to what you're asking about. Not only did I successfully complete the project, but I also gained insights and experiences that directly apply to the specific context you're interested in.`
        });
    }
    
    return stories;
}

// Generate general stories as a fallback
function generateGeneralStories(data, count) {
    const stories = [];
    
    for (let i = 0; i < Math.min(count, data.length); i++) {
        const entry = data[i];
        const project = entry['Project / Context'] || 'a significant project';
        const feedback = entry['Actual Feedback'] || '';
        const tags = (entry['Tags'] || '').split(',');
        
        stories.push({
            situation: `While working on ${project}, I encountered a situation that required me to apply my ${tags[0] || 'professional'} skills. ${feedback.substring(0, 60)}...`,
            task: `I needed to ensure successful delivery while addressing specific challenges related to ${tags.join(', ') || 'the project requirements'}.`,
            action: `I approached this by analyzing the situation thoroughly, developing a clear plan of action, and executing methodically. Specifically, I ${feedback.substring(60, 120)}...`,
            result: `This approach led to successful outcomes, including ${feedback.substring(120, 180) || 'improved processes and stakeholder satisfaction'}. The experience strengthened my capabilities and prepared me for similar situations in the future.`
        });
    }
    
    return stories;
}

module.exports = app;