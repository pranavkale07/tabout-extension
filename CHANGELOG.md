# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-11-27

### Added
- Support for LeetCode.cn (China) endpoint
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

