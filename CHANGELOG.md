# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-05-16

### Added
- Support for GeeksForGeeks (geeksforgeeks.org) using the Ace editor
- Ace editor integration alongside existing Monaco support

### Changed
- Popup editor status now displays the correct editor name (Monaco/Ace) based on the active site
- Editor presence detection in popup now checks for both Monaco (`.monaco-editor`) and Ace (`.ace_editor`) containers
- Options page renders supported sites dynamically instead of hardcoding LeetCode-only behavior
- Updated documentation and acknowledgments to reflect multi-editor support

## [0.2.1] - 2026-02-04

### Added
- Support for TakeUForward (takeuforward.org) using the Monaco editor

### Changed
- Rebranded extension name from "TabOut for LeetCode" to **TabOut**
- Updated documentation and metadata to describe support for Monaco-based online coding editors (including LeetCode and TakeUForward)
- Corrected stored Monaco `KeyCode` mapping for Tab (`Tab: 2` instead of `3`)
- Hardened popup editor detection to use DOM-only checks without executing in the page's main world

## [0.2.0] - 2025-12-02

### Added
- Firefox support and cross-browser compatibility
  - Added official Firefox support for Firefox 140+ (Manifest V3)
  - Published on [Firefox Add-ons (AMO)](https://addons.mozilla.org/en-US/firefox/addon/tabout-extension/)
  - Integrated `webextension-polyfill` for cross-browser API compatibility
  - Replaced all Chrome-specific APIs with WebExtension standard `browser.*` APIs
  - Added Firefox-specific manifest with Gecko ID and data collection permissions
  - Added Firefox build scripts (`build:firefox`, `build:firefox:dev`)
  - Added `build:all` script to build both Chrome and Firefox versions simultaneously

### Changed
- Updated all tests to use cross-browser `browser` API mocks
- Build system now outputs to separate folders for consistency:
  - Chrome builds → `dist/chrome/`
  - Firefox builds → `dist/firefox/`
  - Both builds can coexist without overwriting each other
- Updated zip command to create separate archives for each browser (`tabout-extension-{version}-chrome.zip` and `tabout-extension-{version}-firefox.zip`)

## [0.1.2] - 2025-11-27

### Added
- Support for leetcode.cn (China) endpoint
  - Added leetcode.cn to site configurations
  - Updated manifest permissions and content script matches
  - Updated storage logic to auto-enable new sites by default
  - Added comprehensive test coverage for new domain
  - Updated UI to display "LeetCode (CN)" option

## [0.1.1] - 2024-10-11

### Changed
- Privacy Enhancement: Replaced `tabs` permission with `activeTab` permission
  - More privacy-friendly, only accesses currently active tab
  - Cleaner installation prompt
  - All features work identically

## [0.1.0] - 2024-09-19

### Added
- Initial release
- Smart tab-out functionality for brackets, quotes, commas, and semicolons
- Support for LeetCode.com (problems, contests, playground)
- Multiple cursor support
- Lightweight and privacy-focused
- Chrome Web Store release

