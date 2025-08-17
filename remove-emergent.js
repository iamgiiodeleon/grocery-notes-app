const fs = require('fs');
const path = require('path');

// Function to remove Emergent branding from HTML
function removeEmergentBranding(htmlContent) {
  // Remove the Emergent badge
  let cleaned = htmlContent.replace(
    /<a id="emergent-badge"[^>]*>.*?<\/a>/s,
    ''
  );
  
  // Remove the Emergent description
  cleaned = cleaned.replace(
    /<meta name="description" content="A product of emergent\.sh"\/>/,
    '<meta name="description" content="Voice-powered grocery list application" />'
  );
  
  // Change the title
  cleaned = cleaned.replace(
    /<title>Emergent \| Fullstack App<\/title>/,
    '<title>Grocery Notes App</title>'
  );
  
  // Remove PostHog analytics script
  cleaned = cleaned.replace(
    /<script>!function\(e,t\)\{[\s\S]*?posthog\.init[\s\S]*?\}<\/script>/,
    ''
  );
  
  return cleaned;
}

// Function to process all HTML files in the build directory
function processBuildDirectory() {
  const buildDir = path.join(__dirname, 'frontend', 'build');
  
  if (!fs.existsSync(buildDir)) {
    console.log('Build directory not found. Please run npm run build first.');
    return;
  }
  
  const htmlFile = path.join(buildDir, 'index.html');
  
  if (fs.existsSync(htmlFile)) {
    console.log('Processing index.html...');
    
    let content = fs.readFileSync(htmlFile, 'utf8');
    const cleanedContent = removeEmergentBranding(content);
    
    fs.writeFileSync(htmlFile, cleanedContent, 'utf8');
    console.log('✅ Emergent branding removed from index.html');
  } else {
    console.log('index.html not found in build directory');
  }
}

// Run the script
processBuildDirectory();
