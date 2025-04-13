const { AzureKeyCredential } = require("@azure/core-auth");
const { DefaultAzureCredential, getBearerTokenProvider } = require("@azure/identity");

const { AzureOpenAI } = require("openai");

const { app } = require('@azure/functions');

// 👇 Use this with the latest SDK
// const AzureOpenAI = require("openai");

// const { AzureKeyCredential } = require("@azure/core-auth");


const credential = new DefaultAzureCredential();
const scope = "https://cognitiveservices.azure.com/.default";
const azureADTokenProvider = getBearerTokenProvider(credential, scope);


// const deployment = "Your deployment name";
// const apiVersion = "2024-10-21";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const apiVersion = process.env.OPENAI_API_VERSION;
const deployment = process.env.CHAT_MODEL_DEPLOYMENT_NAME;

const client = new AzureOpenAI({ azureADTokenProvider, deployment, apiVersion });

app.http('GenerateStarStories', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processing star stories generation request`);

        try {
            const requestBody = await request.json();
            const { parsedData, interactionType, customPrompt } = requestBody;

            if (!parsedData || !Array.isArray(parsedData)) {
                context.log.warn('Invalid request: Parsed CSV data is required as an array.');
                return {
                    status: 400,
                    jsonBody: { 
                        success: false, 
                        error: 'Parsed CSV data is required as an array' 
                    }
                };
            }

            context.log('Parsed request body:', { parsedData, interactionType, customPrompt });

            // Generate STAR stories using Azure OpenAI
            context.log('Calling generateStoriesWithAI... with deployment ' + deployment);;
            const generatedStories = await generateStoriesWithAI(parsedData, interactionType, customPrompt, context);
            context.log('Successfully generated stories:', generatedStories);

            return {
                jsonBody: { 
                    success: true, 
                    stories: generatedStories 
                }
            };
        } catch (error) {
            context.log('Error generating stories:', error);
            return {
                status: 500,
                jsonBody: { 
                    success: false, 
                    error: 'Failed to generate stories: ' + error.message 
                }
            };
        } finally {
            context.log(`FINALLY: Http function completed processing request`);
        }
    }
});

// Function to generate stories using Azure OpenAI
async function generateStoriesWithAI(parsedData, interactionType, customPrompt, context) {
    const prompt = buildPrompt(parsedData, interactionType, customPrompt);

    // Log the generated prompt
    context.log('Generated prompt for Azure OpenAI:', prompt);

    // Estimate token count for the prompt
    const tokenCount = estimateTokenCount(prompt);
    context.log(`Estimated token count for prompt: ${tokenCount}`);

    // Log before calling Azure OpenAI
    context.log('Sending request to Azure OpenAI...');
    let response;
    try {
        // Correct method to call Azure OpenAI chat completions
        response = await client.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant helping me craft professional stories about myself." },
                { role: "user", content: prompt }
            ],
            model: deployment
        });
    } catch (error) {
        context.log('Error while calling Azure OpenAI:', error);
        throw new Error('Failed to get a response from Azure OpenAI');
    }

    // Log the raw response from Azure OpenAI
    if (!response || !response.choices || response.choices.length === 0) {
        context.log('Invalid or empty response from Azure OpenAI:', response);
        throw new Error('Invalid response from Azure OpenAI');
    }
    context.log('Response from Azure OpenAI:', response);

    const completion = response.choices?.[0]?.message;
    if (!completion) {
        context.log('No response text received from Azure OpenAI.');
        throw new Error("No response from Azure OpenAI");
    }

    // Log the parsed completion
    context.log('Parsed completion from Azure OpenAI:', completion);

    // Parse the AI response into structured stories
    return parseAIResponse(completion);
}

// Helper function to build the prompt for Azure OpenAI
function buildPrompt(parsedData, interactionType, customPrompt) {
    const basePrompt = `You are an expert in crafting STAR (Situation, Task, Action, Result) stories. Based on the following feedback data, generate professional STAR stories tailored for the "${interactionType}" audience.`;

    const feedbackExamples = parsedData.slice(0, 3).map(entry => {
        return `Feedback: ${entry['Actual Feedback'] || 'N/A'}\nTags: ${entry['Tags'] || 'N/A'}\nProject: ${entry['Project / Context'] || 'N/A'}`;
    }).join("\n\n");

    const customPromptText = customPrompt ? `\n\nAdditional context: ${customPrompt}` : "";

    return `${basePrompt}\n\n${feedbackExamples}${customPromptText}`;
}

// Helper function to parse AI response into structured stories
function parseAIResponse(responseText) {
    const stories = responseText.split("\n\n").map(storyText => {
        const [situation, task, action, result] = storyText.split("\n").map(line => line.split(":")[1]?.trim() || "");
        return { situation, task, action, result };
    });

    return stories.filter(story => story.situation && story.task && story.action && story.result);
}

// Helper function to estimate token count
function estimateTokenCount(text) {
    // Approximation: 1 token is roughly 4 characters in English text
    return Math.ceil(text.length / 4);
}

module.exports = app;