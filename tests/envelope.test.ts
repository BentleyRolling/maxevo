import { describe, it, expect } from 'vitest';
import { ChatRequestZ } from '../src/schemas/zod.js';

describe('ChatResponse Envelope Tests', () => {
  it('should validate correct chat request', () => {
    const validRequest = {
      messages: [{ role: 'user', content: 'Hello' }],
      genius_mode: false,
      qc_mode: 'off',
      honesty_mode: true,
      view_mode: 'chat'
    };
    
    const result = ChatRequestZ.parse(validRequest);
    expect(result).toEqual(validRequest);
  });

  it('should apply defaults for optional fields', () => {
    const minimalRequest = {
      messages: [{ role: 'user', content: 'Hello' }]
    };
    
    const result = ChatRequestZ.parse(minimalRequest);
    expect(result.genius_mode).toBe(false);
    expect(result.qc_mode).toBe('off');
    expect(result.honesty_mode).toBe(false);
    expect(result.view_mode).toBe('chat');
  });

  it('should reject invalid message roles', () => {
    const invalidRequest = {
      messages: [{ role: 'invalid', content: 'Hello' }]
    };
    
    expect(() => ChatRequestZ.parse(invalidRequest)).toThrow();
  });

  it('should reject empty message content', () => {
    const invalidRequest = {
      messages: [{ role: 'user', content: '' }]
    };
    
    expect(() => ChatRequestZ.parse(invalidRequest)).toThrow();
  });

  it('should reject invalid qc_mode values', () => {
    const invalidRequest = {
      messages: [{ role: 'user', content: 'Hello' }],
      qc_mode: 'invalid'
    };
    
    expect(() => ChatRequestZ.parse(invalidRequest)).toThrow();
  });
});