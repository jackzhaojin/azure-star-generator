# CICD Setup — Azure Functions Deploy via GitHub Actions

This repo has two GitHub Actions workflows:
- `.github/workflows/ci.yml` — runs on every PR and push to main. Builds and runs tests. Already works out of the box.
- `.github/workflows/deploy.yml` — runs on push to main when Function code changes. Deploys to Azure. **Requires one-time setup before it will succeed.**

This document is the one-time setup checklist for `deploy.yml`.

## Prerequisites
- An Azure subscription where the Function App already exists
- Owner-level access to the GitHub repo (to add secrets) and Contributor-level access to the Azure subscription (to create App Registrations)
- The `az` CLI installed locally (for Azure AD setup)
- The `gh` CLI installed locally (optional but easier than the GitHub web UI for secrets)

## Step 1 — Function App Name (already configured)

The deploy workflow is wired to Function App `azure-star-generator-node-v1` in resource group `Jack-2025-Story-RG` (default host `azure-star-generator-node-v1.azurewebsites.net`).

If you ever need to retarget a different Function App, update `AZURE_FUNCTIONAPP_NAME` in `.github/workflows/deploy.yml` to the new resource name. The name is the subdomain in the function's URL: `https://<APP_NAME>.azurewebsites.net`.

## Step 2 — Create an Azure AD App Registration

An App Registration represents your GitHub Actions workflow in Azure AD.

### Using Azure CLI:

```bash
# Login to Azure
az login

# Create the App Registration
az ad app create --display-name "GitHub Actions — azure-star-generator"
```

Copy the `appId` from the output — this is your **Client ID** (you'll need it in Step 4).

### Using Azure Portal:

1. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
2. Name: `GitHub Actions — azure-star-generator`
3. Supported account types: **Accounts in this organizational directory only**
4. Redirect URI: Leave blank
5. Click **Register**
6. Copy the **Application (client) ID** from the Overview page

## Step 3 — Add a Federated Credential

The federated credential tells Azure to trust GitHub's identity tokens for your specific repo and branch.

### Using Azure CLI:

First, get the App Registration's object ID:

```bash
APP_ID="<paste-your-client-id-here>"
az ad app show --id $APP_ID --query id -o tsv
```

Then create the federated credential (replace `<object-id>` with the output above):

```bash
az ad app federated-credential create \
  --id <object-id> \
  --parameters '{
    "name": "GitHubActions-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:jackzhaojin/azure-star-generator:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### Using Azure Portal:

1. In your App Registration, go to **Certificates & secrets** → **Federated credentials** → **Add credential**
2. Federated credential scenario: **GitHub Actions deploying Azure resources**
3. Organization: `jackzhaojin`
4. Repository: `azure-star-generator`
5. Entity type: **Branch**
6. GitHub branch name: `main`
7. Name: `GitHubActions-main`
8. Click **Add**

**Critical:** The subject MUST exactly match `repo:jackzhaojin/azure-star-generator:ref:refs/heads/main` (case-sensitive). If it doesn't, OIDC authentication will fail.

## Step 4 — Grant the App Registration Access to Your Function App

The App Registration needs permission to deploy to your Function App.

### Get your Function App's resource ID:

```bash
FUNCTION_APP_NAME="<your-function-app-name>"
RESOURCE_GROUP="<your-resource-group-name>"

az functionapp show \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query id -o tsv
```

Copy the output (it looks like `/subscriptions/{guid}/resourceGroups/{name}/providers/Microsoft.Web/sites/{app-name}`).

### Assign the Contributor role:

```bash
APP_ID="<paste-your-client-id-here>"
SCOPE="<paste-function-app-resource-id-here>"

az role assignment create \
  --assignee $APP_ID \
  --role Contributor \
  --scope $SCOPE
```

### Using Azure Portal:

1. Navigate to your **Function App** → **Access control (IAM)** → **Add role assignment**
2. Role: **Contributor**
3. Assign access to: **User, group, or service principal**
4. Select members: Search for `GitHub Actions — azure-star-generator` (the App Registration you created)
5. Click **Review + assign**

## Step 5 — Add Three GitHub Secrets

You need to add these three values to your GitHub repo's secrets:
- `AZUREAPPSERVICE_CLIENTID` — the Application (client) ID from Step 2
- `AZUREAPPSERVICE_TENANTID` — your Azure AD tenant ID
- `AZUREAPPSERVICE_SUBSCRIPTIONID` — your Azure subscription ID

### Get the Tenant ID and Subscription ID:

```bash
az account show --query '{tenantId:tenantId, subscriptionId:id}' -o json
```

### Add the secrets using GitHub CLI:

```bash
# Set these variables first
CLIENT_ID="<paste-client-id>"
TENANT_ID="<paste-tenant-id>"
SUBSCRIPTION_ID="<paste-subscription-id>"

# Add the secrets
gh secret set AZUREAPPSERVICE_CLIENTID --body "$CLIENT_ID"
gh secret set AZUREAPPSERVICE_TENANTID --body "$TENANT_ID"
gh secret set AZUREAPPSERVICE_SUBSCRIPTIONID --body "$SUBSCRIPTION_ID"
```

### Using GitHub Web UI:

1. Navigate to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. Add three secrets:
   - Name: `AZUREAPPSERVICE_CLIENTID` → Value: `<client-id>`
   - Name: `AZUREAPPSERVICE_TENANTID` → Value: `<tenant-id>`
   - Name: `AZUREAPPSERVICE_SUBSCRIPTIONID` → Value: `<subscription-id>`

## Step 6 — Trigger the First Deploy

Once all secrets are added and the Function App name is set in `deploy.yml`, trigger a deployment:

### Option A: Push a change to the Functions code

```bash
# Make any small change under code/Functions/azure-star-generator-node-v1/
# Then commit and push
git add .
git commit -m "ci: trigger first deploy"
git push origin main
```

### Option B: Manually trigger the workflow

```bash
gh workflow run deploy.yml
```

Watch the workflow run:

```bash
gh run watch
```

Or view it in the GitHub UI: `https://github.com/jackzhaojin/azure-star-generator/actions`

## Step 7 — Verify the Deployment

After the workflow completes successfully:

1. **Check Azure Portal:**
   - Navigate to your Function App → **Deployment Center**
   - You should see the latest deployment from GitHub Actions

2. **Test the function endpoint:**
   ```bash
   curl https://<your-app-name>.azurewebsites.net/api/your-function-name
   ```

3. **Check function logs in Azure:**
   - Function App → **Log stream** (to see real-time logs)

## Troubleshooting

### `Error: AADSTS70021: No matching federated identity record found`

**Cause:** The federated credential's Subject doesn't match the workflow's repo+branch.

**Fix:** Verify the federated credential exactly matches:
- Issuer: `https://token.actions.githubusercontent.com`
- Subject: `repo:jackzhaojin/azure-star-generator:ref:refs/heads/main` (case-sensitive)
- Audience: `api://AzureADTokenExchange`

The workflow MUST run on the `main` branch. If you're testing from another branch, you'll need a separate federated credential for that branch.

### `Error: Resource not found` from functions-action

**Cause:** The `app-name` in `deploy.yml` doesn't match an actual Function App in the linked subscription, OR the App Registration doesn't have access to that resource.

**Fix:**
1. Verify `AZURE_FUNCTIONAPP_NAME` in `deploy.yml` matches the actual Function App name in Azure Portal
2. Verify the App Registration has Contributor role on the Function App (repeat Step 4)
3. Verify the Subscription ID secret matches the subscription where the Function App lives

### `Error: Login failed with Error: Unable to get OIDC token`

**Cause:** Missing `permissions: id-token: write` on the deploy job, OR GitHub Actions OIDC is disabled for your organization.

**Fix:**
1. Verify `.github/workflows/deploy.yml` line 31 has `id-token: write`
2. If using GitHub Enterprise, verify OIDC is enabled in organization settings

### Package size too large (> 100 MB)

**Cause:** The zip includes unnecessary files (e.g., development dependencies, large binaries).

**Fix:**
1. Verify `.funcignore` is excluding unnecessary files
2. Consider using `npm ci --production` in the build step to exclude devDependencies
3. Check for large files: `cd code/Functions/azure-star-generator-node-v1 && du -sh * | sort -h`

### Deploy succeeds but function returns 500 errors

**Cause:** Missing environment variables in Azure Function App settings.

**Fix:**
1. Navigate to Function App → **Configuration** → **Application settings**
2. Add these required variables (from README):
   - `AZURE_OPENAI_ENDPOINT`
   - `AZURE_OPENAI_KEY`
   - `OPENAI_API_VERSION`
   - `CHAT_MODEL_DEPLOYMENT_NAME`
3. Click **Save** and restart the Function App

### Auth errors persist after all setup

**Fix:** Test the App Registration locally:

```bash
# Login using the App Registration
az login --service-principal \
  --username $CLIENT_ID \
  --tenant $TENANT_ID \
  --federated-token $(curl -s \
    -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
    "$ACTIONS_ID_TOKEN_REQUEST_URL" | jq -r .value)

# Try listing function app settings (should succeed if role assignment is correct)
az functionapp config appsettings list \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

If the above fails, the issue is with the Azure-side setup (federated credential or role assignment).

## Alternative Auth Modes (Not Recommended)

### Publish Profile (simpler but less secure)

Instead of OIDC, you can use a publish profile:

1. Azure Portal → Function App → **Get publish profile** (downloads an XML file)
2. Copy the entire file contents
3. Add as a single GitHub secret: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
4. Modify `.github/workflows/deploy.yml`:
   - Remove the `Login to Azure (OIDC)` step
   - Change the `Deploy to Azure Functions` step to:
     ```yaml
     - name: Deploy to Azure Functions
       uses: Azure/functions-action@v1
       with:
         app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
         slot-name: Production
         package: release
         publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
     ```

**Tradeoff:** Simpler setup, but the publish profile is a long-lived credential that must be rotated manually. OIDC is more secure and recommended for production.

### Service Principal with Secret (Legacy — Not Recommended)

The old `az ad sp create-for-rbac --sdk-auth` pattern is deprecated. Use OIDC instead.

## Next Steps

Once the deploy workflow is green:
- Consider adding **environment protection rules** in GitHub (Settings → Environments → production → Required reviewers) to require manual approval before production deploys
- Set up **Application Insights** in Azure for monitoring and alerting
- Add **Playwright tests** or API smoke tests to the CI workflow before enabling auto-deploy
- Configure **branch protection** on `main` to require CI to pass before merging PRs
