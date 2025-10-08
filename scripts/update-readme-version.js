#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Read README.md
const readmePath = path.join(__dirname, '..', 'README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Replace version placeholder with actual version
readmeContent = readmeContent.replace(/\{\{VERSION\}\}/g, version);

// Write back to README.md
fs.writeFileSync(readmePath, readmeContent);

console.log(`✅ Updated README.md version to v${version}`);

