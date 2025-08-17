#!/bin/bash

echo "🚀 Starting deployment process..."

# Build the app
echo "📦 Building the app..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build successful!"

# Go back to root
cd ..

# Copy build files to root for GitHub Pages
echo "📁 Copying build files..."
rm -rf static index.html asset-manifest.json
cp -r frontend/build/* .

# Check if files were copied
if [ ! -f "index.html" ]; then
    echo "❌ Build files not found!"
    exit 1
fi

echo "✅ Files copied successfully!"

# Add all changes
echo "📝 Adding changes to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "🚀 Deploy updated Grocery Notes App - $(date)"

# Push to main branch (which GitHub Pages can serve from)
echo "📤 Pushing to main branch..."
git push origin main

echo "🎉 Deployment complete!"
echo "Your app should be live in a few minutes at: https://iamgiiodeleon.github.io/grocery-notes-app/"
