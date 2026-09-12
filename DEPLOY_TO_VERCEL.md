# Deploy 9JA AI to Vercel (Full Stack)

## What Changed
- **Before**: Frontend on Firebase, Backend on Vercel (complicated, not working)
- **Now**: Everything on Vercel (simple, works perfectly)

## Vercel Setup

### 1. Connect to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo: `thompsonrude-commits/9jai`
3. Vercel will auto-detect the Vite framework

### 2. Configure Build Settings
Vercel should auto-detect these, but verify:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Set Environment Variable
In Vercel project settings → Environment Variables:
- **Key**: `GROQ_API_KEY`
- **Value**: `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`
- **Environment**: Production

### 4. Deploy
Click "Deploy" - Vercel will:
1. Clone from GitHub
2. Run `npm install`
3. Run `npm run build` (creates dist/ folder)
4. Deploy dist/ as static site
5. Deploy api/*.js as serverless functions
6. Give you a live URL like `https://9jai.vercel.app`

## How It Works

### Frontend (Static Site)
- Vercel hosts your built `dist/` folder
- Accessible at `https://your-project.vercel.app`

### Backend (Serverless Functions)
- Vercel runs `api/*.js` files as serverless functions
- Accessible at `https://your-project.vercel.app/api/...`
- Same domain = no CORS issues!

### Routing
The `vercel.json` routes:
- `/api/v1/chat` → `api/chat.js` (backend function)
- `/api/v1/image/generate` → `api/image.js` (backend function)
- `/api/v1/providers` → `api/providers.js` (backend function)
- Everything else → `dist/index.html` (frontend)

## After Deployment

Your app will be live at:
- **URL**: `https://9jai.vercel.app` (or your assigned URL)
- **Frontend**: Same URL, serves React app
- **Backend**: Same URL + `/api/*` paths

Test it:
1. Open `https://9jai.vercel.app`
2. Type a message in chat
3. Should get AI response (not "Local fallback mode")

## Continuous Deployment
Every time you push to `master` branch on GitHub:
- Vercel auto-detects the push
- Rebuilds and redeploys automatically
- Takes 1-2 minutes

## Custom Domain (Optional)
In Vercel dashboard → Domains:
- Add custom domain like `9jai.com`
- Vercel provides free SSL certificate
- Update DNS to point to Vercel

## Cost
- **Vercel Free Tier**:
  - Unlimited deployments
  - 100 GB bandwidth/month
  - Serverless functions included
  - Free SSL
  - Perfect for this project!

## Troubleshooting

### If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify `GROQ_API_KEY` is set in environment variables
3. Make sure `npm run build` works locally

### If "Local fallback mode" still appears:
1. Check Vercel function logs (click on function in dashboard)
2. Verify API key is correct
3. Test endpoint: `https://your-url.vercel.app/api/v1/providers`

## Compared to Firebase

| Feature | Firebase | Vercel |
|---------|----------|--------|
| Frontend hosting | ✅ Free | ✅ Free |
| Backend functions | ❌ Requires billing | ✅ Free tier |
| Auto-deploy from Git | ✅ Yes | ✅ Yes |
| Custom domain | ✅ Free SSL | ✅ Free SSL |
| Setup complexity | Medium | Easy |
| Same-domain API | ❌ Requires proxy | ✅ Built-in |

Vercel is simpler and works with the free tier!
