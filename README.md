<div align="center">

![TabOut for LeetCode](src/assets/logos/tabout-icon-128_crp.png)

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-v0.2.0-green)](https://chromewebstore.google.com/detail/tabout-for-leetcode/eecmlpblnpechggegghledjledbkebfp)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox%20Add--ons-v0.2.0-orange)](https://addons.mozilla.org/en-US/firefox/addon/tabout-extension/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**TabOut** adds intelligent "tab‑out" to LeetCode's editor. Forget arrow keys — just hit Tab and fly past ) ] } ' " > , ;



</div>

## Features

- **Smart tab‑out** for `()`, `[]`, `{}`, `' '`, `" "`, `<>`, commas and semicolons
- **🚀 Smart Jump Points** (NEW) - Tab through code markers like `TODO`, `FIXME`, `___` placeholders
- **Quick Templates** - Pre-built LeetCode templates (Two Pointer, Sliding Window, DFS, Binary Search)
- **Multiple cursor** support
- **Works across LeetCode**: problems, contests, playground
- **Lightweight**: no UI clutter, minimal overhead
- **Privacy-focused**: no data collection, local processing only

### 🌟 Smart Jump Points
A unique feature that lets you tab through custom markers in your code - perfect for LeetCode templates and competitive programming!

**How it works:**
1. Add markers like `TODO`, `FIXME`, or `___` in your code
2. Press Tab to jump between markers sequentially
3. Use built-in templates or create custom markers

**Example:**
```cpp
int left = 0, right = ___-1;  // Press Tab → jumps here
while (left < right) {
    // TODO: Add logic              // Press Tab again → jumps here
    if (___) {                      // Press Tab again → jumps here
        left++;
    }
}
```

**Default Markers:** `// TODO`, `// FIXME`, `// FILL`, `// COMPLETE`, `@JUMP@`, `___`, `null`

**Features:**
- ✅ Quick templates for common patterns (Two Pointer, Sliding Window, DFS, Binary Search)
- ✅ Custom markers support
- ✅ Case-sensitive/insensitive search
- ✅ Wrap-around navigation
- ✅ Click-to-copy templates

See [JUMP_POINTS_FEATURE.md](JUMP_POINTS_FEATURE.md) for detailed documentation.

## Installation

### Chrome Web Store (Recommended)
[![Install from Chrome Web Store](https://img.shields.io/badge/Install-Chrome%20Web%20Store-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/tabout-for-leetcode/eecmlpblnpechggegghledjledbkebfp)

### Firefox Add-ons (Recommended)
[![Install from Firefox Add-ons](https://img.shields.io/badge/Install-Firefox%20Add--ons-FF7139?logo=firefoxbrowser&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/tabout-extension/)

### Manual Installation

#### Firefox
1. Clone this repository
2. Run `npm install && npm run build:firefox`
3. Open `about:debugging` -> "This Firefox"
4. Click "Load Temporary Add-on" -> select `dist/firefox/manifest.json`

#### Chrome/Chromium
1. Clone this repository
2. Run `npm install && npm run build`
3. Open `chrome://extensions` → enable Developer mode
4. Click "Load unpacked" → select the `dist/chrome/` folder

### Controls
- **Popup**: Click the extension icon to quickly enable/disable
- **Options**: Right-click extension → Options for advanced settings
  - Configure Smart Jump Points markers
  - Enable/disable jump points feature
  - Add custom markers
  - Copy quick templates

## Privacy & Permissions

### Data Collection
- **No personal data** or problem content is collected or transmitted
- **Local processing only** - all tab-out logic runs in your browser
- **Minimal storage** - only user preferences saved locally via browser storage

### Required Permissions
- **Host (leetcode.com, leetcode.cn)**: Run only on LeetCode pages to access the editor context
- **Scripting**: Inject a small page script to access Monaco APIs
- **Storage**: Save minimal preferences (enable/disable, debug) in browser storage
- **ActiveTab**: Read the active tab's hostname in the popup to display site status (privacy-focused alternative to broad tabs permission)

## Contributing

We welcome contributions! To report bugs, fix issues, or add features, visit the [Issues](https://github.com/pranavkale07/tabout-extension/issues) page. Please review our [Contribution Guide](CONTRIBUTING.md) for setup and contribution instructions.


## Future Enhancements

- **More Platforms**: Support for other coding platforms (GeeksForGeeks, takeuforward, HackerRank, CodeChef, etc.)
- **Custom Delimiters**: User-defined tab-out patterns
- **Keyboard Shortcuts**: Customizable key bindings

## Acknowledgments

Special thanks to:
- [TabOut (VS Code Extension)](https://marketplace.visualstudio.com/items?itemName=albert.TabOut) - The VS Code extension that inspired this project
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - The powerful code editor that powers LeetCode and VS Code
- The open-source community for inspiration and feedback

## License

MIT License - see [LICENSE](LICENSE) file for details.
