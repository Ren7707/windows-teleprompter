import { describe, expect, it } from 'vitest';
import { defaultSettings, normalizeSettings } from '../src/core/settings';

describe('settings', () => {
  it('has previous and next shortcuts only', () => {
    expect(Object.keys(defaultSettings.shortcuts)).toEqual(['previous', 'next']);
  });

  it('uses return and skip shortcut labels', () => {
    expect(defaultSettings.shortcutLabels.previous).toBe('返回上一句');
    expect(defaultSettings.shortcutLabels.next).toBe('跳过当前句');
  });

  it('clamps opacity', () => {
    expect(normalizeSettings({ ...defaultSettings, opacity: 2 }).opacity).toBe(1);
    expect(normalizeSettings({ ...defaultSettings, opacity: -1 }).opacity).toBe(0.2);
  });

  it('merges partial persisted settings with defaults', () => {
    const settings = normalizeSettings({ opacity: 0.5, shortcuts: { next: 'Alt+Down' } });

    expect(settings.opacity).toBe(0.5);
    expect(settings.shortcuts.previous).toBe(defaultSettings.shortcuts.previous);
    expect(settings.shortcuts.next).toBe('Alt+Down');
  });
});
