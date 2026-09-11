# 9JA AI - Deployment Steps

## Prerequisites
Your Firebase project is configured: `jatalk-1274b`

## Important: Set Production Secrets First

Before deploying, you need to configure your API keys in Firebase Secret Manager (production environment):

```powershell
# Set the GROQ_KEY secret in Firebase
firebase functions:secrets:set GROQ_KEY

# When prompted, paste your API key (don't commit it!)
# Your actual key is in your local .env file
```

**Optional secrets** (if you want to enable additional providers):
```powershell
firebase functions:secrets:set GROK_KEY
firebase functions:secrets:set OPENROUTER_KEY  
firebase functions:secrets:set TAVILY_KEY
firebase functions:secrets:set GEMINI_KEY
```

## Deployment Commands

### Option 1: Full Deployment (Hosting + Functions)

```powershell
# 1. Build the frontend
npm run build

# 2. Build the backend
cd functions
npm run build
cd ..

# 3. Deploy everything
firebase deploy
```

### Option 2: Deploy Only Functions (Backend)

```powershell
# Build functions
cd functions
npm run build
cd ..

# Deploy only functions
firebase deploy --only functions
```

### Option 3: Deploy Only Hosting (Frontend)

```powershell
# Build frontend
npm run build

# Deploy only hosting
firebase deploy --only hosting
```

### Option 4: Quick Deploy (uses package.json script)

```powershell
npm run deploy
```

This runs: `npm run build && firebase deploy`

## After Deployment

1. Your app will be live at: **https://9jai.web.app**
2. API endpoints will be available via Firebase Functions
3. Test the chat to verify Groq provider is working

## Verify Secrets Are Configured

```powershell
# List all configured secrets
firebase functions:secrets:access GROQ_KEY
```

## Git Push (Optional - for version control)

If you want to push changes to your git repository:

```powershell
# Stage all changes (excluding .env files - they're gitignored)
git add .

# Commit
git commit -m "Fixed provider fallback mode with new Groq API key configuration"

# Push to remote
git push origin master
```

## Troubleshooting

### If deployment fails with "Secret GROQ_KEY not found"
Run: `firebase functions:secrets:set GROQ_KEY` and paste your API key

### If you see "insufficient permissions"
Run: `firebase login` to re-authenticate

### If build fails
1. Delete `node_modules` and reinstall: `npm install`
2. Clear dist: `rm -rf dist`
3. Retry: `npm run build`

## Important Notes

- ✅ `.env` files are **gitignored** and won't be committed
- ✅ Production uses Firebase Secret Manager for API keys
- ✅ Local development uses `functions/.env` file
- ✅ Never commit API keys to git
