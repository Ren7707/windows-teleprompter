import type { AppSettings } from './settings';
import type { PromptSession } from '../types';
import { detectScriptLanguage } from './language';
import { splitSentences } from './sentences';

export interface PromptSessionInput {
  title: string;
  body: string;
  settings: AppSettings;
}

export interface PromptSessionFromLinesInput extends PromptSessionInput {
  lines: string[];
}

export function createPromptSession(input: PromptSessionInput): PromptSession {
  return {
    title: input.title.trim() || 'Untitled',
    body: input.body,
    language: detectScriptLanguage(input.body),
    sentences: splitSentences(input.body)
  };
}

export function createPromptSessionFromLines(input: PromptSessionFromLinesInput): PromptSession {
  const lines = input.lines.map((line) => line.trim()).filter(Boolean);

  return {
    title: input.title.trim() || 'Untitled',
    body: input.body,
    language: detectScriptLanguage(input.body || lines.join('\n')),
    sentences: lines.map((text, index) => ({ id: String(index), text }))
  };
}
