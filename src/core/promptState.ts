import type { PromptSentence } from '../types';

export interface PromptState {
  sentences: PromptSentence[];
  currentIndex: number;
}

export function createPromptState(sentences: PromptSentence[]): PromptState {
  return { sentences, currentIndex: 0 };
}

export function nextSentence(state: PromptState): PromptState {
  return {
    ...state,
    currentIndex: Math.min(state.currentIndex + 1, Math.max(state.sentences.length - 1, 0))
  };
}

export function previousSentence(state: PromptState): PromptState {
  return {
    ...state,
    currentIndex: Math.max(state.currentIndex - 1, 0)
  };
}
