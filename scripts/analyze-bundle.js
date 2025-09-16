#!/usr/bin/env node

/**
 * Bundle analysis and optimization script
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing bundle size and performance...\n');

// Build the application with bundle analysis
console.log('📦 Building application...');
try {
  execSync('ANALYZE=true npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Analyze the build output
const buildDir = path.join(process.cwd(), '.next');
const staticDir = path.join(buildDir, 'static');

if (!fs.existsSync(staticDir)) {
  console.error('❌ Build directory not found');
  process.exit(1);
}

console.log('\n📊 Bundle Analysis Results:');
console.log('='.repeat(50));

// Analyze JavaScript bundles
const jsDir = path.join(staticDir, 'chunks');
if (fs.existsSync(jsDir)) {
  const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
  let totalJSSize = 0;

  console.log('\n📄 JavaScript Bundles:');
  jsFiles.forEach(file => {
    const filePath = path.join(jsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalJSSize += stats.size;

    let status = '✅';
    if (stats.size > 500 * 1024) status = '⚠️ '; // > 500KB
    if (stats.size > 1024 * 1024) status = '❌'; // > 1MB

    console.log(`  ${status} ${file}: ${sizeKB} KB`);
  });

  console.log(`\n📊 Total JavaScript: ${(totalJSSize / 1024).toFixed(2)} KB`);
}

// Analyze CSS bundles
const cssDir = path.join(staticDir, 'css');
if (fs.existsSync(cssDir)) {
  const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
  let totalCSSSize = 0;

  console.log('\n🎨 CSS Bundles:');
  cssFiles.forEach(file => {
    const filePath = path.join(cssDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalCSSSize += stats.size;

    let status = '✅';
    if (stats.size > 100 * 1024) status = '⚠️ '; // > 100KB
    if (stats.size > 200 * 1024) status = '❌'; // > 200KB

    console.log(`  ${status} ${file}: ${sizeKB} KB`);
  });

  console.log(`\n📊 Total CSS: ${(totalCSSSize / 1024).toFixed(2)} KB`);
}

// Performance recommendations
console.log('\n💡 Performance Recommendations:');
console.log('='.repeat(50));

const recommendations = [
  '🚀 Use dynamic imports for large components',
  '📦 Implement code splitting at route level',
  '🖼️  Optimize images with next/image',
  '🗜️  Enable gzip compression in production',
  '📱 Implement service worker for caching',
  '⚡ Use React.memo for expensive components',
  '🔄 Implement virtual scrolling for large lists',
  '📊 Monitor Core Web Vitals in production',
];

recommendations.forEach(rec => console.log(`  ${rec}`));

// Check for common performance issues
console.log('\n🔍 Performance Audit:');
console.log('='.repeat(50));

// Check package.json for heavy dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const heavyDeps = ['lodash', 'moment', 'axios', 'jquery', 'bootstrap'];

const foundHeavyDeps = Object.keys(packageJson.dependencies || {}).filter(dep =>
  heavyDeps.some(heavy => dep.includes(heavy))
);

if (foundHeavyDeps.length > 0) {
  console.log('⚠️  Heavy dependencies found:');
  foundHeavyDeps.forEach(dep => {
    console.log(`  - ${dep} (consider lighter alternatives)`);
  });
} else {
  console.log('✅ No heavy dependencies detected');
}

// Check for unused dependencies
console.log('\n🧹 Dependency Analysis:');
try {
  execSync('npx depcheck --json > depcheck-results.json', { stdio: 'pipe' });
  const depcheckResults = JSON.parse(
    fs.readFileSync('depcheck-results.json', 'utf8')
  );

  if (depcheckResults.dependencies.length > 0) {
    console.log('⚠️  Unused dependencies:');
    depcheckResults.dependencies.forEach(dep => {
      console.log(`  - ${dep}`);
    });
  } else {
    console.log('✅ No unused dependencies found');
  }

  // Cleanup
  fs.unlinkSync('depcheck-results.json');
} catch (error) {
  console.log(
    'ℹ️  Install depcheck for dependency analysis: npm install -g depcheck'
  );
}

console.log('\n✨ Bundle analysis complete!');
console.log(
  '📈 Check the bundle analyzer report in your browser for detailed insights.'
);
