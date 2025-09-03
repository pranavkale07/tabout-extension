import { MessageBus, MESSAGE_TYPES } from '../../src/shared/utils/messaging.js';

describe('messaging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MessageBus', () => {
    test('should have static methods', () => {
      expect(MessageBus.sendToPage).toBeDefined();
      expect(MessageBus.sendToContent).toBeDefined();
      expect(MessageBus.onMessageFromPage).toBeDefined();
      expect(MessageBus.onMessageFromContent).toBeDefined();
      expect(MessageBus.isValidMessage).toBeDefined();
      expect(MessageBus.testCommunication).toBeDefined();
    });

    test('should send message to page', () => {
      // Clear previous calls
      window.postMessage.mockClear();
      
      MessageBus.sendToPage('TEST_TYPE', { test: 'data' });
      
      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TEST_TYPE',
          payload: { test: 'data' },
          source: 'tabout-extension',
          origin: expect.any(String),
          timestamp: expect.any(Number)
        }),
        expect.any(String)
      );
    });

    test('should send message to content', () => {
      // Clear previous calls
      window.postMessage.mockClear();
      
      MessageBus.sendToContent('TEST_TYPE', { test: 'data' });
      
      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TEST_TYPE',
          payload: { test: 'data' },
          source: 'tabout-page',
          origin: expect.any(String),
          timestamp: expect.any(Number)
        }),
        expect.any(String)
      );
    });

    test('should validate valid messages', () => {
      const validMessage = {
        type: MESSAGE_TYPES.PING,
        source: 'tabout-extension',
        timestamp: Date.now(),
        payload: {}
      };
      
      expect(MessageBus.isValidMessage(validMessage)).toBe(true);
    });

    test('should reject invalid messages', () => {
      const invalidMessage = {
        type: 'INVALID_TYPE',
        source: 'tabout-extension',
        timestamp: Date.now()
      };
      
      expect(MessageBus.isValidMessage(invalidMessage)).toBe(false);
    });

    test('should reject old messages', () => {
      const oldMessage = {
        type: MESSAGE_TYPES.PING,
        source: 'tabout-extension',
        timestamp: Date.now() - 60000, // 1 minute ago
        payload: {}
      };
      
      expect(MessageBus.isValidMessage(oldMessage)).toBe(false);
    });
  });

  describe('MESSAGE_TYPES', () => {
    test('should have required message types', () => {
      expect(MESSAGE_TYPES).toHaveProperty('SET_ENABLED');
      expect(MESSAGE_TYPES).toHaveProperty('SET_DEBUG_MODE');
      expect(MESSAGE_TYPES).toHaveProperty('EDITOR_DETECTED');
      expect(MESSAGE_TYPES).toHaveProperty('TABOUT_APPLIED');
      expect(MESSAGE_TYPES).toHaveProperty('PING');
      expect(MESSAGE_TYPES).toHaveProperty('PONG');
    });

    test('should have unique message type values', () => {
      const values = Object.values(MESSAGE_TYPES);
      const uniqueValues = [...new Set(values)];
      
      expect(values.length).toBe(uniqueValues.length);
    });

    test('should have string message type values', () => {
      Object.values(MESSAGE_TYPES).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

});
