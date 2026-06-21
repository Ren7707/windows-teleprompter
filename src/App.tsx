import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { detectScriptLanguage } from './core/language';
import { splitSentences } from './core/sentences';
import { defaultSettings, normalizeSettings, type AppSettings } from './core/settings';
import { loadJson, saveJson } from './core/storage';
import { createPromptSession, createPromptSessionFromLines } from './core/promptSession';
import { DEFAULT_TEST_SCRIPT } from './core/testScript';
import { getDocumentResetState } from './core/documentDeletion';

const SETTINGS_KEY = 'teleprompter.settings';
const sample = '大家好，欢迎使用提词器。请把你的文稿放在这里。开始后，悬浮窗会高亮当前句子。';

const labels = {
  zh: {
    appSubtitle: 'Windows teleprompter',
    appTitle: '提词器',
    importDocument: '导入文档',
    history: '历史文档',
    emptyHistory: '还没有导入文档。',
    rename: '改名',
    delete: '删除',
    renamePrompt: '重命名文档',
    deleteConfirm: (title: string) => `删除导入文档“${title}”？原始文件不会被删除。`,
    currentScript: '当前文稿',
    editorTitle: '编辑与预览',
    sentenceCount: '句',
    titleLabel: '文稿标题',
    bodyLabel: '文稿正文',
    startHint: '启动后仅显示当前句和后两句。',
    start: '启动提词',
    settingsEyebrow: 'Settings',
    settingsTitle: '功能设置',
    uiLanguage: '界面语言',
    speechEnabled: '语音识别翻页',
    opacity: '透明度',
    fontSize: '字号',
    fontColor: '字体',
    highlightColor: '高亮',
    testTitle: '测试与快捷键',
    fillTest: '填入测试稿',
    testMicrophone: '测试麦克风',
    micUnsupported: '当前环境不支持麦克风测试',
    previewTitle: '实时预览',
    currentLine: '当前句',
    nextLine: '下一句',
    minimize: '最小化',
    maximize: '最大化',
    close: '关闭'
  },
  en: {
    appSubtitle: 'Windows teleprompter',
    appTitle: 'Teleprompter',
    importDocument: 'Import document',
    history: 'History',
    emptyHistory: 'No imported documents yet.',
    rename: 'Rename',
    delete: 'Delete',
    renamePrompt: 'Rename document',
    deleteConfirm: (title: string) => `Delete imported document "${title}"? The original file will not be deleted.`,
    currentScript: 'Current script',
    editorTitle: 'Editor & preview',
    sentenceCount: 'lines',
    titleLabel: 'Script title',
    bodyLabel: 'Script body',
    startHint: 'The floating window shows the current line and the next two lines.',
    start: 'Start prompt',
    settingsEyebrow: 'Settings',
    settingsTitle: 'Controls',
    uiLanguage: 'UI language',
    speechEnabled: 'Speech auto-advance',
    opacity: 'Opacity',
    fontSize: 'Font size',
    fontColor: 'Text',
    highlightColor: 'Highlight',
    testTitle: 'Test & shortcuts',
    fillTest: 'Use test script',
    testMicrophone: 'Test mic',
    micUnsupported: 'Microphone test is not available in this environment',
    previewTitle: 'Live preview',
    currentLine: 'Current line',
    nextLine: 'Next line',
    minimize: 'Minimize',
    maximize: 'Maximize',
    close: 'Close'
  },
  ja: {
    appSubtitle: 'Windows teleprompter',
    appTitle: 'プロンプター',
    importDocument: '文書を読み込む',
    history: '履歴',
    emptyHistory: '読み込んだ文書はまだありません。',
    rename: '名前変更',
    delete: '削除',
    renamePrompt: '文書名を変更',
    deleteConfirm: (title: string) => `読み込んだ文書「${title}」を削除しますか？元ファイルは削除されません。`,
    currentScript: '現在の原稿',
    editorTitle: '編集とプレビュー',
    sentenceCount: '行',
    titleLabel: '原稿タイトル',
    bodyLabel: '原稿本文',
    startHint: '開始後は現在行と次の2行だけを表示します。',
    start: '開始',
    settingsEyebrow: 'Settings',
    settingsTitle: '機能設定',
    uiLanguage: '表示言語',
    speechEnabled: '音声で自動送り',
    opacity: '透明度',
    fontSize: '文字サイズ',
    fontColor: '文字',
    highlightColor: 'ハイライト',
    testTitle: 'テストとショートカット',
    fillTest: 'テスト原稿',
    testMicrophone: 'マイクテスト',
    micUnsupported: 'この環境ではマイクテストを利用できません',
    previewTitle: 'ライブプレビュー',
    currentLine: '現在行',
    nextLine: '次の行',
    minimize: '最小化',
    maximize: '最大化',
    close: '閉じる'
  }
} as const;

export function App() {
  const [title, setTitle] = useState('未命名文稿');
  const [body, setBody] = useState(sample);
  const [settings, setSettings] = useState(() => loadStoredSettings());
  const [microphoneStatus, setMicrophoneStatus] = useState('');
  const [documents, setDocuments] = useState<ImportedDocumentSummary[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isImportedPreview, setIsImportedPreview] = useState(false);
  const text = labels[settings.uiLanguage];
  const language = detectScriptLanguage(body);
  const sentences = splitSentences(body);
  const previewLines = sentences.map((sentence) => sentence.text);

  useEffect(() => {
    void refreshDocuments();
  }, []);

  useEffect(() => {
    saveStoredSettings(settings);
    void window.teleprompter?.updateShortcuts(settings.shortcuts);
  }, [settings]);

  async function refreshDocuments() {
    const list = await window.teleprompter?.listDocuments();
    setDocuments(list ?? []);
  }

  function applyDocument(document: ImportedDocument) {
    setTitle(document.title);
    setBody(document.body);
    setSelectedDocumentId(document.id);
    setIsImportedPreview(true);
  }

  async function renameDocument(document: ImportedDocumentSummary) {
    const nextTitle = window.prompt(text.renamePrompt, document.title)?.trim();
    if (!nextTitle || nextTitle === document.title) return;

    const renamed = await window.teleprompter?.renameDocument(document.id, nextTitle);
    if (!renamed) return;
    if (selectedDocumentId === document.id) applyDocument(renamed);
    await refreshDocuments();
  }

  async function deleteDocument(document: ImportedDocumentSummary) {
    if (!window.confirm(text.deleteConfirm(document.title))) return;
    const deleted = await window.teleprompter?.deleteDocument(document.id);
    if (!deleted) return;

    setDocuments((current) => current.filter((item) => item.id !== document.id));
    if (selectedDocumentId === document.id) {
      const resetState = getDocumentResetState('未命名文稿', sample);
      setTitle(resetState.title);
      setBody(resetState.body);
      setSelectedDocumentId(resetState.selectedDocumentId);
      setIsImportedPreview(resetState.isImportedPreview);
      setMicrophoneStatus(resetState.microphoneStatus);
    }
    await refreshDocuments();
  }

  return (
    <main className="flex h-screen overflow-hidden bg-transparent text-[var(--foreground)]">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[1.4rem] border border-white/10 bg-[var(--background)]/78 shadow-2xl shadow-black/45 backdrop-blur-2xl">
        <TitleBar text={text} />

        <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(420px,1fr)_330px] gap-4 overflow-hidden p-4 pt-3">
          <aside className="flex min-h-0 flex-col rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)]/82 p-5">
            <div className="mb-6">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">{text.appSubtitle}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{text.appTitle}</h1>
            </div>

            <button
              className="mb-4 flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
              onClick={async () => {
                const document = await window.teleprompter?.importDocument();
                if (document) {
                  applyDocument(document);
                  await refreshDocuments();
                }
              }}
            >
              {text.importDocument}
            </button>

            <div className="min-h-0 border-t border-[var(--border)] pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">{text.history}</h2>
                <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">{documents.length}</span>
              </div>

              <div className="custom-scrollbar max-h-[calc(100vh-280px)] space-y-2 overflow-y-auto pr-1">
                {documents.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
                    {text.emptyHistory}
                  </p>
                ) : (
                  documents.map((document) => (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/35 p-2 transition hover:bg-[var(--secondary)]" key={document.id}>
                      <button
                        className="block w-full truncate rounded-xl px-3 py-2 text-left text-sm font-medium"
                        onClick={async () => {
                          const loaded = await window.teleprompter?.loadDocument(document.id);
                          if (loaded) applyDocument(loaded);
                        }}
                      >
                        {document.title}
                      </button>
                      <div className="mt-1 grid grid-cols-2 gap-1">
                        <button className="rounded-xl px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]" onClick={() => void renameDocument(document)}>
                          {text.rename}
                        </button>
                        <button className="rounded-xl px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--destructive)] hover:text-white" onClick={() => void deleteDocument(document)}>
                          {text.delete}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)]/86 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">{text.currentScript}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">{text.editorTitle}</h2>
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1 text-sm text-[var(--muted-foreground)]">
                {language.toUpperCase()} · {sentences.length} {text.sentenceCount}
              </div>
            </div>

            <input
              className="mb-3 h-12 w-full shrink-0 rounded-2xl border border-[var(--input)] bg-[var(--secondary)]/45 px-4 text-lg font-semibold outline-none ring-[var(--ring)] transition focus:ring-2"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-label={text.titleLabel}
            />
            <textarea
              className="custom-scrollbar h-[clamp(12rem,42vh,19.5rem)] shrink-0 resize-none rounded-[1.75rem] border border-[var(--input)] bg-black/24 p-5 pr-7 leading-8 text-[var(--foreground)] outline-none ring-[var(--ring)] transition placeholder:text-[var(--muted-foreground)] focus:ring-2"
              value={isImportedPreview ? previewLines.join('\n') : body}
              onChange={(event) => {
                setBody(event.target.value);
                setSelectedDocumentId(null);
                setIsImportedPreview(false);
              }}
              aria-label={text.bodyLabel}
            />

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm text-[var(--muted-foreground)]">{text.startHint}</p>
              <button
                className="shrink-0 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-lg shadow-white/5 transition hover:opacity-90"
                onClick={() =>
                  window.teleprompter?.openFloatingWindow({
                    session: isImportedPreview
                      ? createPromptSessionFromLines({ title, body, lines: previewLines, settings })
                      : createPromptSession({ title, body, settings }),
                    settings
                  })
                }
              >
                {text.start}
              </button>
            </div>

            <div
              className="mt-4 h-[8.5rem] shrink-0 overflow-hidden rounded-[1.75rem] border border-white/10 p-5"
              style={{
                backgroundColor: `rgb(18 18 16 / ${settings.opacity})`,
                color: settings.fontColor,
                fontSize: `${Math.max(18, settings.fontSize * 0.38)}px`
              }}
            >
              <p className="mb-2 text-sm text-white/45">{text.previewTitle}</p>
              <p className="mb-3 font-semibold" style={{ color: settings.highlightColor }}>
                {sentences[0]?.text ?? text.currentLine}
              </p>
              <p className="text-current/55">{sentences[1]?.text ?? text.nextLine}</p>
            </div>
          </section>

          <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)]/86 p-5">
              <div className="mb-4 shrink-0">
                <p className="text-sm text-[var(--muted-foreground)]">{text.settingsEyebrow}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">{text.settingsTitle}</h2>
              </div>

              <div className="custom-scrollbar min-h-0 space-y-3 overflow-y-auto pr-1">
                <SettingLabel label={text.uiLanguage}>
                  <select
                    className="h-11 w-full rounded-full border border-[var(--input)] bg-[var(--secondary)] px-4 outline-none"
                    value={settings.uiLanguage}
                    onChange={(event) => setSettings({ ...settings, uiLanguage: event.target.value as 'zh' | 'en' | 'ja' })}
                  >
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                  </select>
                </SettingLabel>

                <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/45 px-4 py-3">
                  <span className="font-medium">{text.speechEnabled}</span>
                  <input type="checkbox" checked={settings.speechEnabled} onChange={(event) => setSettings({ ...settings, speechEnabled: event.target.checked })} />
                </label>

                <SliderSetting label={text.opacity} value={settings.opacity} min="0.2" max="1" step="0.01" onChange={(value) => setSettings({ ...settings, opacity: value })} />
                <SliderSetting label={text.fontSize} value={settings.fontSize} min="18" max="96" onChange={(value) => setSettings({ ...settings, fontSize: value })} />

                <div className="grid grid-cols-2 gap-3">
                  <ColorSetting label={text.fontColor} value={settings.fontColor} onChange={(value) => setSettings({ ...settings, fontColor: value })} />
                  <ColorSetting label={text.highlightColor} value={settings.highlightColor} onChange={(value) => setSettings({ ...settings, highlightColor: value })} />
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)]/86 p-5">
              <h2 className="mb-3 text-lg font-semibold tracking-tight">{text.testTitle}</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-full bg-[var(--secondary)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)]"
                  onClick={() => {
                    setTitle('语音识别测试文稿');
                    setBody(DEFAULT_TEST_SCRIPT);
                    setSelectedDocumentId(null);
                  }}
                >
                  {text.fillTest}
                </button>
                <button
                  className="rounded-full bg-[var(--secondary)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)]"
                  onClick={async () => {
                    const result = await window.teleprompter?.testMicrophone();
                    setMicrophoneStatus(result ? result.message : text.micUnsupported);
                  }}
                >
                  {text.testMicrophone}
                </button>
              </div>

              {microphoneStatus ? (
                <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/45 p-3 text-sm text-[var(--muted-foreground)]">
                  {microphoneStatus}
                </div>
              ) : null}

              <div className="mt-3 space-y-2">
                <ShortcutInput label={settings.shortcutLabels.previous} value={settings.shortcuts.previous} onChange={(value) => setSettings({ ...settings, shortcuts: { ...settings.shortcuts, previous: value } })} />
                <ShortcutInput label={settings.shortcutLabels.next} value={settings.shortcuts.next} onChange={(value) => setSettings({ ...settings, shortcuts: { ...settings.shortcuts, next: value } })} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function TitleBar({ text }: { text: (typeof labels)[keyof typeof labels] }) {
  return (
    <header className="app-titlebar flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-black/18 pl-4">
      <div className="flex items-center gap-3 text-sm text-white/78">
        <div className="grid size-6 place-items-center rounded-lg border border-white/10 bg-white/8">✦</div>
        <span className="font-medium">Teleprompter</span>
      </div>
      <div className="window-controls flex h-full">
        <button aria-label={text.minimize} onClick={() => void window.teleprompter?.controlWindow('minimize')}>−</button>
        <button aria-label={text.maximize} onClick={() => void window.teleprompter?.controlWindow('maximize')}>□</button>
        <button aria-label={text.close} className="close" onClick={() => void window.teleprompter?.controlWindow('close')}>×</button>
      </div>
    </header>
  );
}

function SettingLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}

function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: string;
  max: string;
  step?: string;
  onChange: (value: number) => void;
}) {
  return (
    <SettingLabel label={`${label} · ${value}`}>
      <input className="w-full" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </SettingLabel>
  );
}

function ColorSetting({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <SettingLabel label={label}>
      <input className="h-11 w-full rounded-full border border-[var(--input)] bg-[var(--secondary)] p-1" type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </SettingLabel>
  );
}

function ShortcutInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/45 px-4 py-2.5">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <input className="w-32 rounded-full border border-[var(--input)] bg-black/20 px-3 py-1.5 text-sm outline-none" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function loadStoredSettings() {
  return normalizeSettings(loadJson(getBrowserStorage(), SETTINGS_KEY, defaultSettings));
}

function saveStoredSettings(settings: AppSettings) {
  saveJson(getBrowserStorage(), SETTINGS_KEY, settings);
}

function getBrowserStorage() {
  return {
    get: (key: string) => window.localStorage.getItem(key) ?? undefined,
    set: (key: string, value: string) => window.localStorage.setItem(key, value)
  };
}
