import type { ScriptLanguage } from '../types';

export function detectScriptLanguage(text: string): ScriptLanguage {
  const chinese = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const total = chinese + latin;

  if (total < 4) return 'unknown';
  if (chinese / total >= 0.35) return 'zh';
  if (latin / total >= 0.7) return 'en';
  return 'unknown';
}
