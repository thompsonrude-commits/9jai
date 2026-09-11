# Deploy Backend to Vercel

## Quick Setup

### 1. Install Vercel CLI

```powershell
npm install -g vercel
```

### 2. Login to Vercel

```powershell
vercel login
```

### 3. Deploy

```powershell
vercel --prod
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Your Vercel account
- **Link to existing project?** → No
- **Project name?** → `9jai-backend` (or your choice)
- **Directory?** → `.` (current directory)
- **Build settings?** → No (use defaults)

### 4. Set Environment Variables

After deployment, set your API keys:

```powershell
vercel env add GROQ_KEY
```

Paste when prompted: `your-actual-groq-key-here` (get it from your .env file)

Choose **Production** when asked which environment.

Optional additional keys:
```powershell
vercel env add GROK_KEY
vercel env add OPENROUTER_KEY
vercel env add TAVILY_KEY
```

### 5. Redeploy with Environment Variables

```powershell
vercel --prod
```

---

## Update Frontend to Use Vercel Backend

After deployment, you'll get a URL like: `https://9jai-backend.vercel.app`

Update your frontend environment to point to the new backend:

1. Go to Firebase Console → Hosting → Environment Configuration
2. Add: `VITE_API_BASE_URL=https://your-vercel-url.vercel.app`
3. Redeploy frontend: `firebase deploy --only hosting`

Or update `src/lib/aiProxy.ts` to use the Vercel URL directly.

---

## Advantages of Vercel

✅ **No billing required** - Generous free tier  
✅ **Instant deployments** - No build time  
✅ **Easy environment variables** - Simple CLI  
✅ **Global CDN** - Fast worldwide  
✅ **Automatic HTTPS** - Built-in SSL  
✅ **Zero cold starts** - Better than Firebase functions  

---

## Deploy Frontend to Firebase

```powershell
firebase deploy --only hosting
```

Your setup:
- **Frontend**: https://9jai.web.app (Firebase Hosting)
- **Backend**: https://9jai-backend.vercel.app (Vercel Functions)

Perfect separation! 🚀
