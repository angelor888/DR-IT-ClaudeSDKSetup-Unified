#!/usr/bin/env node

/**
 * Script to check for potential secrets in the codebase
 * Run this before committing to ensure no credentials are exposed
 */

const fs = require('fs');
const path = require('path');

// Patterns that might indicate secrets
const secretPatterns = [
  // API Keys
  /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[a-zA-Z0-9\-_.]{20,}/gi,
  
  // Tokens
  /(?:token|bearer)\s*[:=]\s*["']?[a-zA-Z0-9\-_.]{20,}/gi,
  
  // Passwords
  /(?:password|passwd|pwd)\s*[:=]\s*["']?[^\s"']{8,}/gi,
  
  // AWS
  /AKIA[0-9A-Z]{16}/g,
  /(?:aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*["']?[a-zA-Z0-9/+=]{40}/gi,
  
  // Slack
  /xox[baprs]-[0-9a-zA-Z\-]+/g,
  
  // Google
  /AIzaSy[a-zA-Z0-9\-_]{33}/g,
  /[0-9]{12}-[a-z0-9]{32}\.apps\.googleusercontent\.com/g,
  
  // SendGrid
  /SG\.[a-zA-Z0-9\-_.]{22}\.[a-zA-Z0-9\-_.]{43}/g,
  
  // Twilio
  /AC[a-f0-9]{32}/g,
  /SK[a-f0-9]{32}/g,
  
  // Private Keys
  /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
  
  // Generic secrets
  /(?:secret|client[_-]?secret)\s*[:=]\s*["']?[a-zA-Z0-9\-_.]{20,}/gi,
];

// Files and directories to skip
const skipPatterns = [
  /node_modules/,
  /\.git/,
  /\.env$/,
  /\.env\./,
  /dist/,
  /build/,
  /coverage/,
  /\.log$/,
  /package-lock\.json$/,
  /check-secrets\.js$/,
  /\.md$/,
];

let foundSecrets = false;

function checkFile(filePath) {
  // Skip if matches skip pattern
  if (skipPatterns.some(pattern => pattern.test(filePath))) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      secretPatterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          // Check if it's a placeholder or example
          const isExample = /(?:your[_-]?|example|placeholder|dummy|test|fake|mock)/i.test(line);
          const isComment = /^\s*(?:\/\/|#|\/\*|\*)/.test(line);
          
          if (!isExample && !isComment) {
            console.error(`\n🚨 Potential secret found in ${filePath}:${index + 1}`);
            console.error(`   Pattern: ${pattern.source}`);
            console.error(`   Line: ${line.trim()}`);
            foundSecrets = true;
          }
        }
      });
    });
  } catch (error) {
    // Ignore files that can't be read (binary files, etc.)
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip if matches skip pattern
      if (!skipPatterns.some(pattern => pattern.test(filePath))) {
        scanDirectory(filePath);
      }
    } else {
      checkFile(filePath);
    }
  });
}

console.log('🔍 Checking for potential secrets in the codebase...\n');

// Start from project root
const projectRoot = path.join(__dirname, '..');
scanDirectory(projectRoot);

if (foundSecrets) {
  console.error('\n❌ Potential secrets found! Please remove them before committing.\n');
  process.exit(1);
} else {
  console.log('\n✅ No potential secrets found.\n');
  process.exit(0);
}