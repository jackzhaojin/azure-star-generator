/**
 * Data Access Object for Azure OpenAI interactions
 */
const { AzureKeyCredential } = require("@azure/core-auth");
const { DefaultAzureCredential, getBearerTokenProvider } = require("@azure/identity");
const { AzureOpenAI } = require("openai");

class OpenAIDao {
    constructor() {
        // Initialize authentication
        const credential = new DefaultAzureCredential();
        const scope = "https://cognitiveservices.azure.com/.default";
        const azureADTokenProvider = getBearerTokenProvider(credential, scope);

        // Get configuration from environment variables
        this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        this.apiKey = process.env.AZURE_OPENAI_KEY;
        this.apiVersion = process.env.OPENAI_API_VERSION;
        this.deployment = process.env.CHAT_MODEL_DEPLOYMENT_NAME;

        // Initialize Azure OpenAI client
        this.client = new AzureOpenAI({ 
            azureADTokenProvider, 
            deployment: this.deployment, 
            apiVersion: this.apiVersion 
        });
    }

    /**
     * Generate completion using Azure OpenAI
     * @param {Array} messages - Array of message objects with role and content
     * @param {Object} context - Azure Functions context for logging
     * @returns {Object} - The completion response
     */
    async generateCompletion(messages, context) {
        // Log detailed request information
        context.log('Sending request to Azure OpenAI with deployment:', this.deployment);
        context.log('Request messages to Azure OpenAI:', JSON.stringify(messages, null, 2));
        
        try {
            const response = await this.client.chat.completions.create({
                messages,
                model: this.deployment
            });

            if (!response || !response.choices || response.choices.length === 0) {
                context.log('Invalid or empty response from Azure OpenAI:', JSON.stringify(response, null, 2));
                throw new Error('Invalid response from Azure OpenAI');
            }

            // Log detailed response information
            context.log('Received response from Azure OpenAI:', JSON.stringify({
                id: response.id,
                model: response.model,
                usage: response.usage,
                choicesCount: response.choices.length,
                firstChoiceFinishReason: response.choices[0]?.finish_reason,
                // Include a preview of the content for debugging
                contentPreview: response.choices[0]?.message?.content?.substring(0, 200) + '...'
            }, null, 2));
            
            return response;
        } catch (error) {
            context.log('Error while calling Azure OpenAI:', error);
            
            // Log more detailed error info if available
            if (error.response) {
                context.log('Error response details:', JSON.stringify({
                    status: error.response.status,
                    statusText: error.response.statusText,
                    headers: error.response.headers,
                    data: error.response.data
                }, null, 2));
            }
            
            throw new Error('Failed to get a response from Azure OpenAI: ' + error.message);
        }
    }
}

module.exports = new OpenAIDao();