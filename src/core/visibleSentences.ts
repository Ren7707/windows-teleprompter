import type { PromptSentence } from '../types';

export function getVisibleSentences(sentences: PromptSentence[], currentIndex: number) {
  return [
    sentences[currentIndex - 1] ?? createEmptySentence('previous'),
    sentences[currentIndex] ?? createEmptySentence('current'),
    sentences[currentIndex + 1] ?? createEmptySentence('next')
  ];
}

function createEmptySentence(id: string): PromptSentence {
  return { id: `empty-${id}`, text: '' };
}
