import { describe, expect, it } from 'vitest';
import { loadJson, saveJson } from '../src/core/storage';

describe('storage helpers', () => {
  it('round trips JSON in memory storage', () => {
    const storage = new Map<string, string>();
    saveJson(storage, 'settings', { opacity: 0.5 });
    expect(loadJson(storage, 'settings', { opacity: 1 })).toEqual({ opacity: 0.5 });
  });
});
