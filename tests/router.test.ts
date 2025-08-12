import { describe, it, expect } from 'vitest';
import { pickModelForRole, estimateUSD } from '../src/orchestrator/router.js';

describe('Router Tests', () => {
  it('should pick cheapest model for role', () => {
    const bulkModel = pickModelForRole('bulk_low_risk');
    expect(bulkModel).toBe('openai:gpt-4o-mini');
    
    const coderModel = pickModelForRole('coder_executor');
    expect(coderModel).toBe('anthropic:claude-3.5-sonnet');
    
    const qcModel = pickModelForRole('cheap_qc');
    expect(qcModel).toBe('anthropic:claude-3.5-haiku');
  });

  it('should estimate costs correctly', () => {
    const cost = estimateUSD('openai:gpt-4o-mini', 1000, 500);
    expect(cost).toBeCloseTo(0.45); // (1000/1000)*0.15 + (500/1000)*0.60 = 0.15 + 0.3 = 0.45
  });

  it('should throw for unknown role', () => {
    expect(() => pickModelForRole('unknown_role' as any)).toThrow();
  });

  it('should throw for unknown model', () => {
    expect(() => estimateUSD('unknown:model', 100, 100)).toThrow();
  });
});