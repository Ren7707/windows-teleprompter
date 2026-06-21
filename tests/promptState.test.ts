import { describe, expect, it } from 'vitest';
import { createPromptState, nextSentence, previousSentence } from '../src/core/promptState';

const sentences = [
  { id: '0', text: '第一句。' },
  { id: '1', text: '第二句。' }
];

describe('prompt state', () => {
  it('starts at the first sentence', () => {
    expect(createPromptState(sentences).currentIndex).toBe(0);
  });

  it('moves to next and stops at the end', () => {
    const first = createPromptState(sentences);
    const second = nextSentence(first);
    expect(second.currentIndex).toBe(1);
    expect(nextSentence(second).currentIndex).toBe(1);
  });

  it('moves to previous and stops at the start', () => {
    const second = { sentences, currentIndex: 1 };
    expect(previousSentence(second).currentIndex).toBe(0);
    expect(previousSentence(createPromptState(sentences)).currentIndex).toBe(0);
  });
});
