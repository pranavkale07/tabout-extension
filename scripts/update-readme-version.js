#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read version from package.json
const { version } = require('../package.json');

// Read README.md
const readmePath = path.join(__dirname, '..', 'README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Replace any existing version in Chrome Web Store badge with new version
readmeContent = readmeContent.replace(
  /\[!\[Chrome Web Store\]\(https:\/\/img\.shields\.io\/badge\/Chrome%20Web%20Store-v[^)]+\)\]/,
  `[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-v${version}-green)]`
);

// Write back to README.md
fs.writeFileSync(readmePath, readmeContent);

console.log(`✅ Updated README.md version to v${version}`);

