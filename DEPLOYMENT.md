# 🚀 Simple Deployment Guide

## Quick Deploy

Just run this command from the root directory:

```bash
./deploy.sh
```

Or use npm:

```bash
npm run deploy
```

## What This Does

1. ✅ Builds the React app
2. ✅ Copies build files to root directory
3. ✅ Commits and pushes to main branch
4. ✅ GitHub Pages automatically serves from main branch

## Manual Deploy

If you prefer to do it step by step:

```bash
# 1. Build the app
npm run build

# 2. Copy build files to root
cp -r frontend/build/* .

# 3. Commit and push
git add .
git commit -m "🚀 Deploy update"
git push origin main
```

## GitHub Pages Setup

Make sure your GitHub repository settings have:
- **Source**: Deploy from a branch
- **Branch**: `main`
- **Folder**: `/ (root)`

## Troubleshooting

- If build fails: Check `frontend/` directory and run `npm install` there
- If deploy fails: Make sure you have git access and the remote is set up
- If page is blank: Wait 2-5 minutes for GitHub Pages to update

## Development

```bash
# Start development server
npm run dev

# Install dependencies
npm run install-deps
```

That's it! Much simpler than the old gh-pages approach. 🎉
