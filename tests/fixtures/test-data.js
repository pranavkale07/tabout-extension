// Test data for tabout-engine tests
export const BRACKET_TEST_CASES = [
  // Basic brackets
  { input: 'a()', cursor: 2, expected: 3, description: 'Basic parentheses' },
  { input: 'a[]', cursor: 2, expected: 3, description: 'Basic square brackets' },
  { input: 'a{}', cursor: 2, expected: 3, description: 'Basic curly braces' },
  
  // Quotes
  { input: 'a""', cursor: 2, expected: 3, description: 'Basic double quotes' },
  { input: "a''", cursor: 2, expected: 3, description: 'Basic single quotes' },
  
  // Nested brackets
  { input: '((', cursor: 1, expected: null, description: 'Nested parentheses - inner' },
  { input: '((', cursor: 2, expected: 3, description: 'Nested parentheses - outer' },
  { input: '([', cursor: 1, expected: null, description: 'Mixed nested brackets - inner' },
  { input: '([', cursor: 2, expected: 3, description: 'Mixed nested brackets - outer' },
  
  // Edge cases
  { input: '', cursor: 0, expected: null, description: 'Empty string' },
  { input: ' ', cursor: 0, expected: null, description: 'Whitespace only' },
  { input: 'a', cursor: 0, expected: null, description: 'Single character' },
  { input: 'ab', cursor: 1, expected: null, description: 'Two characters' },
  
  // Special characters
  { input: 'a;', cursor: 1, expected: null, description: 'Semicolon' },
  { input: 'a,', cursor: 1, expected: null, description: 'Comma' },
  
  // Complex scenarios
  { input: 'func()', cursor: 5, expected: 6, description: 'Function call' },
  { input: 'arr[]', cursor: 4, expected: 5, description: 'Array access' },
  { input: 'obj{}', cursor: 4, expected: 5, description: 'Object literal' },
  { input: 'str""', cursor: 4, expected: 5, description: 'String literal' },
  
  // Whitespace scenarios
  { input: '( )', cursor: 2, expected: null, description: 'Parentheses with space' },
  { input: '[ ]', cursor: 2, expected: null, description: 'Brackets with space' },
  { input: '{ }', cursor: 2, expected: null, description: 'Braces with space' },
  { input: '" "', cursor: 2, expected: null, description: 'Quotes with space' },
  
  // Invalid cases
  { input: '(', cursor: 0, expected: null, description: 'Single opening parenthesis' },
  { input: ')', cursor: 0, expected: null, description: 'Single closing parenthesis' },
  { input: '[', cursor: 0, expected: null, description: 'Single opening bracket' },
  { input: ']', cursor: 0, expected: null, description: 'Single closing bracket' },
  { input: '{', cursor: 0, expected: null, description: 'Single opening brace' },
  { input: '}', cursor: 0, expected: null, description: 'Single closing brace' },
  { input: '"', cursor: 0, expected: null, description: 'Single opening quote' },
  { input: '"', cursor: 1, expected: null, description: 'Single closing quote' }
];

// Test data for storage tests
export const STORAGE_TEST_CASES = [
  {
    description: 'Default settings',
    input: {},
    expected: {
      enabled: true,
      siteEnabled: {
        'leetcode.com': true
      },
      customPairs: {},
      debugMode: false
    }
  },
  {
    description: 'Custom settings',
    input: {
      enabled: false,
      siteEnabled: {
        'leetcode.com': false
      }
    },
    expected: {
      enabled: false,
      siteEnabled: {
        'leetcode.com': false
      },
      customPairs: {},
      debugMode: false
    }
  }
];

// Test data for sites tests
export const SITES_TEST_CASES = [
  {
    description: 'Exact domain match',
    hostname: 'leetcode.com',
    expected: true
  },
  {
    description: 'Subdomain match',
    hostname: 'www.leetcode.com',
    expected: true
  },
  {
    description: 'Deep subdomain match',
    hostname: 'contest.leetcode.com',
    expected: true
  },
  {
    description: 'No match',
    hostname: 'example.com',
    expected: false
  },
  {
    description: 'Invalid hostname',
    hostname: '',
    expected: false
  }
];
