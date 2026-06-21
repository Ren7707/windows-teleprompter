import { describe, expect, it } from 'vitest';
import { shouldAdvance } from '../src/core/matching';

describe('shouldAdvance', () => {
  it('advances when recognized text contains the next Chinese sentence core text', () => {
    expect(shouldAdvance('欢迎使用提词器', '大家好，', '欢迎使用提词器。')).toBe(true);
  });

  it('does not advance for unrelated text', () => {
    expect(shouldAdvance('完全不相关', '大家好，', '欢迎使用提词器。')).toBe(false);
  });

  it('advances near the end of the current sentence', () => {
    expect(shouldAdvance('大家好欢迎使用这款轻量化提词', '大家好，欢迎使用这款轻量化提词器。', '现在我们开始测试。')).toBe(true);
  });

  it('advances when recognition misses a few current sentence characters near the end', () => {
    expect(shouldAdvance('大家好欢迎使用轻量化提词器', '大家好，欢迎使用这款轻量化提词器。', '现在我们开始测试。')).toBe(true);
  });

  it('does not advance when only the beginning of the current sentence is recognized', () => {
    expect(shouldAdvance('大家好欢迎使用', '大家好，欢迎使用这款轻量化提词器。', '现在我们开始测试。')).toBe(false);
  });

  it('advances when a quoted phrase line is completed', () => {
    expect(shouldAdvance('通过黄沙掩过往', '通过“黄沙掩过往”', '“冰封照今昔”')).toBe(true);
  });

  it('advances on a short quoted phrase when recognition misses the final character', () => {
    expect(shouldAdvance('黄沙掩过往冰封照今', '“冰封照今昔”', '“绿意续新生”')).toBe(true);
  });
});
