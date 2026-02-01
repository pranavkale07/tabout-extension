/**
 * Smart Jump Points - A unique feature for tabbing through code markers
 * Perfect for LeetCode templates and competitive programming
 */

/**
 * Default jump point markers that users can tab through
 * These are common patterns in competitive programming and code templates
 */
export const DEFAULT_JUMP_MARKERS = [
  '// TODO',
  '// FIXME',
  '// FILL',
  '// COMPLETE',
  '@JUMP@',
  '___',  // Blank placeholder
  'null', // Common placeholder value
];

/**
 * Jump point configuration
 */
export const JUMP_POINT_CONFIG = {
  enabled: true,
  caseSensitive: false,
  highlightDuration: 500, // ms to highlight jump point after jumping
  wrapAround: true, // Jump to first point when reaching the end
  customMarkers: [], // User-defined custom markers
  skipSingleCharMarkers: false, // Whether to skip single char markers like _
};

/**
 * Predefined templates with jump points for common LeetCode patterns
 */
export const JUMP_TEMPLATES = {
  twoPointer: `// Two pointer template
int left = 0, right = ___-1;
while (left < right) {
    // TODO: Add logic
    if (___) {
        left++;
    } else {
        right--;
    }
}`,
  
  slidingWindow: `// Sliding window template  
int left = 0, right = 0;
while (right < ___) {
    // TODO: Expand window
    
    while (___) {
        // TODO: Shrink window
        left++;
    }
    right++;
}`,

  dfs: `// DFS template
void dfs(int node, /* TODO: add params */) {
    if (/* TODO: base case */) return;
    
    // TODO: Process node
    
    for (auto neighbor : ___) {
        dfs(neighbor);
    }
}`,

  binarySearch: `// Binary search template
int left = 0, right = ___-1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (/* TODO: condition */) {
        return mid;
    } else if (___) {
        right = mid - 1;
    } else {
        left = mid + 1;
    }
}`
};
