import { useEffect, useState } from 'react';
import { createPromptState, nextSentence, previousSentence } from './core/promptState';
import { defaultSettings, type AppSettings } from './core/settings';
import { shouldAdvance } from './core/matching';
import { getVisibleSentences } from './core/visibleSentences';
import type { PromptSession } from './types';

interface FloatingPayload {
  session: PromptSession;
  settings: AppSettings;
}

const fallbackSession: PromptSession = {
  title: 'Preview',
  body: '',
  language: 'zh',
  sentences: [
    { id: '0', text: '大家好，欢迎使用提词器' },
    { id: '1', text: '当前朗读句子会高亮显示' },
    { id: '2', text: '下一句会自动滚动到可见位置' }
  ]
};

export function FloatingPrompt() {
  const [payload, setPayload] = useState<FloatingPayload>({ session: fallbackSession, settings: defaultSettings });
  const [state, setState] = useState(() => createPromptState(fallbackSession.sentences));
  const [speechError, setSpeechError] = useState('');

  useEffect(() => {
    const removePrevious = window.teleprompter?.onPrevious(() => setState((current) => previousSentence(current)));
    const removeNext = window.teleprompter?.onNext(() => setState((current) => nextSentence(current)));
    const removeSpeechText = window.teleprompter?.onSpeechText((text) => {
      setSpeechError('');
      setState((current) => {
        const currentSentence = current.sentences[current.currentIndex]?.text;
        const next = current.sentences[current.currentIndex + 1]?.text;
        if (!currentSentence || !next) return current;
        return shouldAdvance(text, currentSentence, next) ? nextSentence(current) : current;
      });
    });
    const removeSpeechError = window.teleprompter?.onSpeechError((message) => setSpeechError(message));

    return () => {
      removePrevious?.();
      removeNext?.();
      removeSpeechText?.();
      removeSpeechError?.();
    };
  }, []);

  useEffect(() => {
    void window.teleprompter?.getPromptPayload().then((value) => {
      if (!isFloatingPayload(value)) return;
      setPayload(value);
      setState(createPromptState(value.session.sentences));
    });
  }, []);

  const style = {
    backgroundColor: `rgb(18 18 16 / ${payload.settings.opacity})`,
    color: payload.settings.fontColor,
    fontSize: `${payload.settings.fontSize}px`
  };
  const visibleSentences = getVisibleSentences(state.sentences, state.currentIndex);

  return (
    <main className="floating-window" style={style}>
      <button className="floating-close" onClick={() => void window.teleprompter?.closeFloatingWindow()} aria-label="停止提词">
        ×
      </button>
      {speechError ? <div className="speech-error">{speechError}</div> : null}
      {visibleSentences.map((sentence, index) => (
        <p
          key={sentence.id}
          className={index === 1 ? 'active-line' : ''}
          style={index === 1 ? { color: payload.settings.highlightColor } : undefined}
        >
          {sentence.text}
        </p>
      ))}
    </main>
  );
}

function isFloatingPayload(value: unknown): value is FloatingPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'session' in value &&
    'settings' in value &&
    Array.isArray((value as FloatingPayload).session.sentences)
  );
}
