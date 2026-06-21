import { describe, expect, it } from 'vitest';
import { getVisibleSentences } from '../src/core/visibleSentences';

const sentences = [
  { id: '0', text: '第一句' },
  { id: '1', text: '第二句' },
  { id: '2', text: '第三句' },
  { id: '3', text: '第四句' }
];

describe('getVisibleSentences', () => {
  it('returns previous, current, and next sentences', () => {
    expect(getVisibleSentences(sentences, 1).map((sentence) => sentence.text)).toEqual(['第一句', '第二句', '第三句']);
  });

  it('keeps the current sentence in the middle at the start', () => {
    expect(getVisibleSentences(sentences, 0).map((sentence) => sentence.text)).toEqual(['', '第一句', '第二句']);
  });

  it('keeps the current sentence in the middle at the end', () => {
    expect(getVisibleSentences(sentences, 3).map((sentence) => sentence.text)).toEqual(['第三句', '第四句', '']);
  });
});
