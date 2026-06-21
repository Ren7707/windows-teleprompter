import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../src/core/settings';
import { createPromptSession, createPromptSessionFromLines } from '../src/core/promptSession';

describe('createPromptSession', () => {
  it('creates a session from Chinese script text', () => {
    const session = createPromptSession({
      title: '发布稿',
      body: '第一句。第二句。',
      settings: defaultSettings
    });

    expect(session.language).toBe('zh');
    expect(session.sentences.map((sentence) => sentence.text)).toEqual(['第一句', '第二句']);
    expect(session.title).toBe('发布稿');
  });

  it('creates a session from already split preview lines', () => {
    const session = createPromptSessionFromLines({
      title: 'document',
      body: '原始正文没有标点所以可能很长',
      lines: ['第一行', '第二行', '第三行'],
      settings: defaultSettings
    });

    expect(session.sentences.map((sentence) => sentence.text)).toEqual(['第一行', '第二行', '第三行']);
  });
});
