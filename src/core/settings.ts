export interface AppSettings {
  uiLanguage: 'zh' | 'en' | 'ja';
  speechEnabled: boolean;
  opacity: number;
  fontSize: number;
  fontColor: string;
  highlightColor: string;
  backgroundEffect: 'clear' | 'dim' | 'glass';
  shortcuts: {
    previous: string;
    next: string;
  };
  shortcutLabels: {
    previous: string;
    next: string;
  };
}

export const defaultSettings: AppSettings = {
  uiLanguage: 'zh',
  speechEnabled: true,
  opacity: 0.72,
  fontSize: 36,
  fontColor: '#f7f7f2',
  highlightColor: '#ffe08a',
  backgroundEffect: 'glass',
  shortcuts: {
    previous: 'Alt+Left',
    next: 'Alt+Right'
  },
  shortcutLabels: {
    previous: '返回上一句',
    next: '跳过当前句'
  }
};

export type AppSettingsInput = Partial<Omit<AppSettings, 'shortcuts' | 'shortcutLabels'>> & {
  shortcuts?: Partial<AppSettings['shortcuts']>;
  shortcutLabels?: Partial<AppSettings['shortcutLabels']>;
};

export function normalizeSettings(settings: AppSettingsInput): AppSettings {
  const merged = {
    ...defaultSettings,
    ...settings,
    shortcuts: {
      ...defaultSettings.shortcuts,
      ...settings.shortcuts
    },
    shortcutLabels: defaultSettings.shortcutLabels
  };

  return {
    ...merged,
    opacity: Math.min(1, Math.max(0.2, merged.opacity)),
    fontSize: Math.min(96, Math.max(18, merged.fontSize))
  };
}
