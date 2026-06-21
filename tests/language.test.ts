import { describe, expect, it } from 'vitest';
import { detectScriptLanguage } from '../src/core/language';

describe('detectScriptLanguage', () => {
  it('detects Chinese scripts', () => {
    expect(detectScriptLanguage('大家好，今天我们来介绍这个产品。')).toBe('zh');
  });

  it('detects English scripts', () => {
    expect(detectScriptLanguage('Hello everyone. Today we introduce this product.')).toBe('en');
  });

  it('returns unknown for ambiguous scripts', () => {
    expect(detectScriptLanguage('2026 - 01 - 01')).toBe('unknown');
  });
});
