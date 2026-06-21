import { describe, expect, it } from 'vitest';
import { DEFAULT_TEST_SCRIPT } from '../src/core/testScript';
import { detectScriptLanguage } from '../src/core/language';

describe('DEFAULT_TEST_SCRIPT', () => {
  it('is Chinese and between 100 and 200 characters', () => {
    expect(detectScriptLanguage(DEFAULT_TEST_SCRIPT)).toBe('zh');
    expect(DEFAULT_TEST_SCRIPT.length).toBeGreaterThanOrEqual(100);
    expect(DEFAULT_TEST_SCRIPT.length).toBeLessThanOrEqual(200);
  });
});
