export type ScriptLanguage = 'zh' | 'en' | 'ja' | 'unknown';

export interface PromptSentence {
  id: string;
  text: string;
}

export interface PromptSession {
  title: string;
  body: string;
  language: ScriptLanguage;
  sentences: PromptSentence[];
}
