# LeetCode Tabout Extension

A Chrome extension that adds "tab out" functionality to LeetCode's code editor, with an extensible architecture for future platform additions.

## Features

- **LeetCode Support**: Works specifically with LeetCode's Monaco Editor
- **Smart Detection**: Automatically detects Monaco Editor, CodeMirror, and other editors
- **Configurable**: Per-site enable/disable and custom bracket pairs
- **Language Aware**: Context-specific bracket pairs (generics in Java/C++, template literals in JS)

## Supported Sites

- ✅ **LeetCode** (leetcode.com) - Monaco Editor

*The extensible architecture allows for easy addition of new coding platforms in the future.*

## Development

### Setup
```bash
npm install
```

### Build
```bash
# Development build
npm run build:dev

# Production build
npm run build

# Watch mode (rebuilds on changes)
npm run build:watch
```

### Load Extension
1. Run `npm run build`
2. Open Chrome Extensions page (`chrome://extensions/`)
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder

## How It Works

1. **Content Script** runs on matching pages and injects the page script
2. **Page Script** runs in page context to access editor APIs (Monaco, CodeMirror)
3. **Site Handlers** implement editor-specific tabout logic
4. **Core Engine** provides universal tabout decision logic
5. **Options Page** allows users to configure settings

## License

MIT
