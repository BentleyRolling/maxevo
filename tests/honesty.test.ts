import { describe, it, expect } from 'vitest';
import { unifyVoice } from '../src/orchestrator/unify.js';

describe('Honesty Mode Tests', () => {
  it('should remove hype words when honesty mode is enabled', () => {
    const text = "This is an incredible and amazing solution that's a real game-changer!";
    const result = unifyVoice(text, { honesty: true });
    
    expect(result).not.toContain('incredible');
    expect(result).not.toContain('amazing');
    expect(result).not.toContain('game-changer');
  });

  it('should remove hedge words when honesty mode is enabled', () => {
    const text = "This might be a good solution, perhaps you could consider it.";
    const result = unifyVoice(text, { honesty: true });
    
    expect(result).not.toContain('might');
    expect(result).not.toContain('perhaps');
  });

  it('should preserve text when honesty mode is disabled', () => {
    const text = "This is an incredible solution that might work well.";
    const result = unifyVoice(text, { honesty: false });
    
    expect(result).toContain('incredible');
    expect(result).toContain('might');
  });

  it('should normalize whitespace', () => {
    const text = "Test\r\n\n\n\nMultiple   newlines";
    const result = unifyVoice(text, { honesty: false });
    
    expect(result).not.toContain('\r\n');
    expect(result).not.toMatch(/\n{3,}/);
  });
});