# Azure STAR Generator

The **Azure STAR Generator** is a professional storytelling tool designed to help users craft compelling STAR (Situation, Task, Action, Result) stories. It leverages Azure OpenAI services to generate structured and impactful narratives based on user-provided feedback data.

## Features

- **Azure Functions**: Serverless architecture for handling HTTP requests and processing data.
- **Azure OpenAI Integration**: Uses GPT-4o-mini for generating STAR stories.
- **CSV Data Processing**: Upload feedback data in CSV format for story generation.
- **Customizable Prompts**: Tailor the storytelling process with interaction-specific and custom prompts.
- **Azure Blob Storage**: Stores sample data and other assets for seamless integration.

---

## Project Structure

### Codebase Overview

### Key Components

1. **Azure Functions**:
   - Entry points for HTTP triggers.
   - Located in `src/functions/`.

2. **Prompt Builder**:
   - Constructs prompts for Azure OpenAI based on user input.
   - Located in `src/services/promptBuilder.js`.

3. **Response Processor**:
   - Parses and validates AI-generated responses.
   - Located in `src/services/responseProcessor.js`.

4. **Frontend Templates**:
   - User interface for uploading CSV files and interacting with the generator.
   - Located in `src/templates/`.

5. **Azure OpenAI Integration**:
   - Handles communication with Azure OpenAI for generating STAR stories.
   - Located in `src/dao/openAIDao.js`.

---

## Prerequisites

### Tools and Services

- **Azure Account**: Required for deploying Azure Functions and using Azure OpenAI.
- **Node.js**: Version 20 or higher.
- **Azure Functions Core Tools**: For local development and deployment.

### Environment Variables

Set the following environment variables for the application:

- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI endpoint URL.
- `AZURE_OPENAI_KEY`: API key for Azure OpenAI.
- `OPENAI_API_VERSION`: API version for Azure OpenAI.
- `CHAT_MODEL_DEPLOYMENT_NAME`: Deployment name for the GPT-4o-mini model.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/azure-star-generator.git
cd azure-star-generator
```

### 2. Install Dependencies

Navigate to the Azure Functions directory and install dependencies:

```bash
cd code/Functions/azure-star-generator-node-v1
npm install
```

### 3. Run Locally

Start the Azure Functions runtime locally:

```bash
func start
```

Access the application at `http://localhost:7071`.

### 4. Deploy to Azure

Deploy the Azure Function to your Azure account:

```bash
func azure functionapp publish <YourFunctionAppName>
```

---

## Usage

### Upload Feedback Data:

- Use the web interface to upload a CSV file containing feedback data.
- Alternatively, enable the sample data toggle to use preloaded data.

### Generate STAR Stories:

- Select an interaction type (e.g., `top5`, `leadership`, `technical`).
- Optionally, provide custom instructions to tailor the output.

### View and Copy Stories:

- Generated stories are displayed in the UI.
- Use the "Copy Story" button to copy stories to your clipboard.

---

## Roadmap

- **Infrastructure as Code (IaC)**:
  - Automate Azure resource provisioning using tools like Bicep or Terraform.
- **Enhanced AI Models**:
  - Upgrade to more advanced GPT models as they become available.
- **Improved UI**:
  - Add drag-and-drop functionality for CSV uploads.
  - Provide real-time feedback on token usage.

---

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to suggest improvements.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Acknowledgments

- **Azure OpenAI**: For providing the GPT-4o-mini model.
- **Azure Functions**: For enabling serverless architecture.
- **Bootstrap**: For frontend styling.

## AI Tools Used

The Azure STAR Generator leverages the following AI tools:

1. **Claude 3.7 with GitHub Context**: Provides contextual assistance with GitHub repositories context.
2. **Claude 3.7 npm CLI Command Line**: Full in context agentic programming.
3. **GitHub Copilot**: Assists in code generation and development tasks. With new github agent.
4. **Chat GPT-4o**: For functional context
