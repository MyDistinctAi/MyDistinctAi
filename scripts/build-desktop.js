#!/usr/bin/env node

/**
 * Desktop-only static build script
 * 
 * Builds only the /desktop-app/* pages as static HTML.
 * Temporarily excludes API routes and dashboard to enable static export.
 * The desktop pages use Tauri commands directly - no server needed!
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building desktop app (static export - no server needed)...\n');

// Paths - exclude everything except desktop-app
const srcAppDir = path.join(__dirname, '../src/app');
const tempDir = path.join(__dirname, '../.desktop-build-temp');

// List of directories to exclude (everything except desktop-app)
const excludeDirs = ['api', 'dashboard', 'auth', 'login', 'register', 'reset-password', 
                     'docs', 'pricing', 'models', 'test-desktop', 'desktop-settings', 
                     'desktop', 'xray', '(auth)', '(dashboard)'];

// Files to exclude
const excludeFiles = ['page.tsx', 'layout.tsx'];

try {
  // Step 1: Temporarily hide all non-desktop routes
  console.log('📦 Step 1: Excluding non-desktop routes from build...');
  
  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Move all excluded directories to temp
  let excludedCount = 0;
  for (const dir of excludeDirs) {
    const srcPath = path.join(srcAppDir, dir);
    const backupPath = path.join(tempDir, 'dirs', dir);
    
    if (fs.existsSync(srcPath)) {
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      fs.renameSync(srcPath, backupPath);
      excludedCount++;
    }
  }
  
  // Move excluded files to temp
  for (const file of excludeFiles) {
    const srcPath = path.join(srcAppDir, file);
    const backupPath = path.join(tempDir, 'files', file);
    
    if (fs.existsSync(srcPath)) {
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      fs.renameSync(srcPath, backupPath);
      excludedCount++;
    }
  }
  
  console.log(`   ✓ ${excludedCount} items excluded (keeping only /desktop-app)`);

  // Step 2: Build Next.js with static export
  console.log('\n📦 Step 2: Building Next.js static export...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, TAURI_BUILD: 'true' }
  });
  console.log('   ✓ Static export complete\n');

  // Step 3: Restore directories
  console.log('📦 Step 3: Restoring excluded directories...');
  
  let restoredCount = 0;
  for (const dir of excludeDirs) {
    const srcPath = path.join(srcAppDir, dir);
    const backupPath = path.join(tempDir, 'dirs', dir);
    
    if (fs.existsSync(backupPath)) {
      if (fs.existsSync(srcPath)) {
        fs.rmSync(srcPath, { recursive: true, force: true });
      }
      fs.renameSync(backupPath, srcPath);
      restoredCount++;
    }
  }
  
  for (const file of excludeFiles) {
    const srcPath = path.join(srcAppDir, file);
    const backupPath = path.join(tempDir, 'files', file);
    
    if (fs.existsSync(backupPath)) {
      if (fs.existsSync(srcPath)) {
        fs.rmSync(srcPath, { recursive: true, force: true });
      }
      fs.renameSync(backupPath, srcPath);
      restoredCount++;
    }
  }
  
  console.log(`   ✓ ${restoredCount} items restored`);

  // Step 4: Create root index.html redirect
  console.log('\n📦 Step 4: Creating root index.html...');
  const rootIndexPath = path.join(__dirname, '../out/index.html');
  const rootIndexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=/desktop-app/index.html">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyDistinctAI - Redirecting...</title>
    <script>
        window.location.href = '/desktop-app/index.html';
    </script>
</head>
<body>
    <p>Redirecting to MyDistinctAI Desktop...</p>
</body>
</html>`;
  
  fs.writeFileSync(rootIndexPath, rootIndexContent);
  console.log('   ✓ Root index.html created');

  // Step 5: Clean up temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('\n✅ Desktop app build complete!\n');
  console.log('📁 Static files location: out/\n');
  console.log('✨ The app is 100% offline - no server needed!');
  console.log('   Desktop pages use Tauri commands directly.\n');

} catch (error) {
  // Always restore directories even if build fails
  console.error('\n❌ Build failed:', error.message);
  
  for (const dir of excludeDirs) {
    const srcPath = path.join(srcAppDir, dir);
    const backupPath = path.join(tempDir, 'dirs', dir);
    
    if (fs.existsSync(backupPath)) {
      if (fs.existsSync(srcPath)) {
        fs.rmSync(srcPath, { recursive: true, force: true });
      }
      fs.renameSync(backupPath, srcPath);
    }
  }
  
  for (const file of excludeFiles) {
    const srcPath = path.join(srcAppDir, file);
    const backupPath = path.join(tempDir, 'files', file);
    
    if (fs.existsSync(backupPath)) {
      if (fs.existsSync(srcPath)) {
        fs.rmSync(srcPath, { recursive: true, force: true });
      }
      fs.renameSync(backupPath, srcPath);
    }
  }
  
  process.exit(1);
}
