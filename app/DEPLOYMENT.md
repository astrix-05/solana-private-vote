# Frontend Deployment Guide

## Pre-Deployment Checklist

- [ ] Build completes without errors: `npm run build`
- [ ] Environment variables configured for production
- [ ] Backend relayer deployed and accessible
- [ ] Program deployed to target network (devnet/mainnet)
- [ ] CORS configured in backend for frontend domain

## Environment Variables for Production

Create a `.env.production` file or set these in your hosting platform:

```env
REACT_APP_SOLANA_RPC_URL=https://api.devnet.solana.com
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_API_KEY=your_production_api_key
REACT_APP_PROGRAM_ID=7ZXBjyqFJPNHj3nRdeJmu2JKSnph5BpJ9nwxTTMx7RwJ
```

## Deployment Options

### Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd app
   vercel
   ```

3. **Set Environment Variables:**
   - Go to Vercel dashboard → Project → Settings → Environment Variables
   - Add all `REACT_APP_*` variables
   - Redeploy: `vercel --prod`

4. **Build Settings:**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Build and Deploy:**
   ```bash
   cd app
   npm run build
   netlify deploy --prod --dir=build
   ```

3. **Set Environment Variables:**
   - Go to Netlify dashboard → Site settings → Environment variables
   - Add all `REACT_APP_*` variables
   - Redeploy

4. **Build Settings (via netlify.toml):**
   ```toml
   [build]
     command = "npm run build"
     publish = "build"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Other Platforms

**GitHub Pages:**
- Requires `homepage` field in `package.json`
- Use `gh-pages` package for deployment

**AWS S3 + CloudFront:**
- Build: `npm run build`
- Upload `build/` directory to S3
- Configure CloudFront for SPA routing

## Post-Deployment

1. **Test the deployment:**
   - Verify wallet connection works
   - Test poll creation
   - Test voting flow
   - Verify API calls reach backend

2. **Update README:**
   - Replace `https://your-deployment-url.vercel.app` with actual URL
   - Verify all links work

3. **Monitor:**
   - Check browser console for errors
   - Monitor backend logs for API calls
   - Verify transactions on Solana explorer

## Troubleshooting

**Build fails:**
- Check Node.js version (18+)
- Clear `node_modules` and reinstall
- Check for TypeScript errors

**Environment variables not working:**
- Ensure variables start with `REACT_APP_`
- Rebuild after changing variables
- Check hosting platform's env var configuration

**API calls fail:**
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings in backend
- Verify backend is accessible from frontend domain

**Wallet connection issues:**
- Ensure users have Phantom/Solflare installed
- Verify wallet is on correct network (devnet/mainnet)
- Check `REACT_APP_SOLANA_RPC_URL` matches network

