# Windows Teleprompter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Windows EXE version of the offline Chinese/English teleprompter.

**Architecture:** Use Electron for Windows desktop windows and global shortcuts, React for the main page and floating teleprompter UI, and small shared TypeScript modules for language detection, sentence splitting, settings, and prompt progression. Use a local speech-recognition adapter boundary so the UI can work before sherpa-onnx is wired in.

**Tech Stack:** Electron, React, TypeScript, Vite, Vitest, electron-builder, sherpa-onnx runtime integration in a later task.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `tsconfig.json`: TypeScript config.
- `vite.config.ts`: Vite config for renderer.
- `vitest.config.ts`: unit test config.
- `electron/main.ts`: Electron app lifecycle, main window, floating window, IPC, shortcuts.
- `electron/preload.ts`: safe renderer API.
- `src/main.tsx`: React entry.
- `src/App.tsx`: main app shell.
- `src/FloatingPrompt.tsx`: floating window renderer.
- `src/styles.css`: app and floating window styles.
- `src/core/language.ts`: script language detection.
- `src/core/sentences.ts`: sentence splitting.
- `src/core/promptState.ts`: current sentence state.
- `src/core/settings.ts`: default settings and validation.
- `src/core/storage.ts`: local storage helpers.
- `src/core/speech.ts`: speech recognizer interface and disabled adapter.
- `src/i18n.ts`: UI copy for Chinese, English, Japanese.
- `src/types.ts`: shared types.
- `tests/*.test.ts`: unit tests.
- `.gitignore`: GitHub-ready ignores.
- `README.md`: project overview, setup, model notes, build commands.
- `models/.gitkeep`: keeps the local model directory without committing model binaries.

---

### Task 1: Project Skeleton

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `models/.gitkeep`
- Create: `README.md`

- [ ] **Step 1: Create package metadata**

Add `package.json`:

```json
{
  "name": "windows-teleprompter",
  "version": "0.1.0",
  "private": true,
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "electron": "electron .",
    "test": "vitest run",
    "build": "tsc && vite build",
    "package": "electron-builder --win"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "electron": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "electron-builder": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  },
  "build": {
    "appId": "com.local.windows-teleprompter",
    "productName": "Teleprompter",
    "files": [
      "dist/**",
      "dist-electron/**",
      "package.json"
    ],
    "directories": {
      "output": "release"
    },
    "win": {
      "target": "nsis"
    }
  }
}
```

- [ ] **Step 2: Create TypeScript and Vite configs**

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "electron", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

Add `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
});
```

Add `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
```

- [ ] **Step 3: Add GitHub hygiene files**

Add `.gitignore`:

```gitignore
node_modules/
dist/
dist-electron/
release/
.vite/
*.log
models/*
!models/.gitkeep
user-data/
.superpowers/
```

Add `models/.gitkeep` as an empty file.

Add `README.md`:

```md
# Teleprompter

Windows desktop teleprompter with a translucent floating prompt window, manual sentence shortcuts, and offline Chinese/English speech-following support.

## Features

- Windows EXE desktop app
- Script management and history
- Always-on-top translucent floating prompt window
- Configurable previous/next sentence shortcuts
- Offline Chinese/English recognition design using sherpa-onnx
- Chinese, English, and Japanese UI

## Development

```bash
npm install
npm test
npm run dev
```

In another terminal:

```bash
npm run electron
```

## Models

Model binaries are not committed. Put local sherpa-onnx models under `models/`.

## Build

```bash
npm run build
npm run package
```
```

- [ ] **Step 4: Run install and tests**

Run:

```bash
npm install
npm test
```

Expected:

```text
No test files found
```

Vitest may exit non-zero when no tests exist. Continue to Task 2.

---

### Task 2: Shared Types and Language Detection

**Files:**
- Create: `src/types.ts`
- Create: `src/core/language.ts`
- Create: `tests/language.test.ts`

- [ ] **Step 1: Write failing language tests**

Add `tests/language.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { detectScriptLanguage } from '../src/core/language';

describe('detectScriptLanguage', () => {
  it('detects Chinese scripts', () => {
    expect(detectScriptLanguage('大家好，今天我们来介绍这个产品。')).toBe('zh');
  });

  it('detects English scripts', () => {
    expect(detectScriptLanguage('Hello everyone. Today we introduce this product.')).toBe('en');
  });

  it('returns unknown for ambiguous scripts', () => {
    expect(detectScriptLanguage('2026 - 01 - 01')).toBe('unknown');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- tests/language.test.ts
```

Expected: FAIL because `src/core/language.ts` does not exist.

- [ ] **Step 3: Add minimal implementation**

Add `src/types.ts`:

```ts
export type ScriptLanguage = 'zh' | 'en' | 'ja' | 'unknown';

export interface PromptSentence {
  id: string;
  text: string;
}
```

Add `src/core/language.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
npm test -- tests/language.test.ts
```

Expected: PASS.

---

### Task 3: Sentence Splitting

**Files:**
- Create: `src/core/sentences.ts`
- Create: `tests/sentences.test.ts`

- [ ] **Step 1: Write failing sentence tests**

Add `tests/sentences.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { splitSentences } from '../src/core/sentences';

describe('splitSentences', () => {
  it('splits Chinese punctuation', () => {
    expect(splitSentences('第一句。第二句！第三句？').map((s) => s.text)).toEqual([
      '第一句。',
      '第二句！',
      '第三句？'
    ]);
  });

  it('splits English punctuation', () => {
    expect(splitSentences('First sentence. Second sentence! Third sentence?').map((s) => s.text)).toEqual([
      'First sentence.',
      'Second sentence!',
      'Third sentence?'
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- tests/sentences.test.ts
```

Expected: FAIL because `src/core/sentences.ts` does not exist.

- [ ] **Step 3: Add minimal implementation**

Add `src/core/sentences.ts`:

```ts
import type { PromptSentence } from '../types';

export function splitSentences(text: string): PromptSentence[] {
  return text
    .replace(/\s+/g, ' ')
    .match(/[^。！？.!?]+[。！？.!?]?/g)
    ?.map((part, index) => ({
      id: String(index),
      text: part.trim()
    }))
    .filter((sentence) => sentence.text.length > 0) ?? [];
}
```

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
npm test -- tests/sentences.test.ts
```

Expected: PASS.

---

### Task 4: Prompt State

**Files:**
- Create: `src/core/promptState.ts`
- Create: `tests/promptState.test.ts`

- [ ] **Step 1: Write failing prompt state tests**

Add `tests/promptState.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createPromptState, nextSentence, previousSentence } from '../src/core/promptState';

const sentences = [
  { id: '0', text: '第一句。' },
  { id: '1', text: '第二句。' }
];

describe('prompt state', () => {
  it('starts at the first sentence', () => {
    expect(createPromptState(sentences).currentIndex).toBe(0);
  });

  it('moves to next and stops at the end', () => {
    const first = createPromptState(sentences);
    const second = nextSentence(first);
    expect(second.currentIndex).toBe(1);
    expect(nextSentence(second).currentIndex).toBe(1);
  });

  it('moves to previous and stops at the start', () => {
    const second = { sentences, currentIndex: 1 };
    expect(previousSentence(second).currentIndex).toBe(0);
    expect(previousSentence(createPromptState(sentences)).currentIndex).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- tests/promptState.test.ts
```

Expected: FAIL because `src/core/promptState.ts` does not exist.

- [ ] **Step 3: Add minimal implementation**

Add `src/core/promptState.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
npm test -- tests/promptState.test.ts
```

Expected: PASS.

---

### Task 5: Settings and i18n

**Files:**
- Create: `src/core/settings.ts`
- Create: `src/i18n.ts`
- Create: `tests/settings.test.ts`

- [ ] **Step 1: Write failing settings tests**

Add `tests/settings.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defaultSettings, normalizeSettings } from '../src/core/settings';

describe('settings', () => {
  it('has previous and next shortcuts only', () => {
    expect(Object.keys(defaultSettings.shortcuts)).toEqual(['previous', 'next']);
  });

  it('clamps opacity', () => {
    expect(normalizeSettings({ ...defaultSettings, opacity: 2 }).opacity).toBe(1);
    expect(normalizeSettings({ ...defaultSettings, opacity: -1 }).opacity).toBe(0.2);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- tests/settings.test.ts
```

Expected: FAIL because `src/core/settings.ts` does not exist.

- [ ] **Step 3: Add minimal implementation**

Add `src/core/settings.ts`:

```ts
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
    previous: 'CommandOrControl+Alt+Left',
    next: 'CommandOrControl+Alt+Right'
  }
};

export function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    opacity: Math.min(1, Math.max(0.2, settings.opacity)),
    fontSize: Math.min(96, Math.max(18, settings.fontSize))
  };
}
```

Add `src/i18n.ts`:

```ts
export const copy = {
  zh: {
    appTitle: '提词器',
    scripts: '文稿',
    history: '历史',
    settings: '设置',
    start: '启动提词'
  },
  en: {
    appTitle: 'Teleprompter',
    scripts: 'Scripts',
    history: 'History',
    settings: 'Settings',
    start: 'Start'
  },
  ja: {
    appTitle: 'プロンプター',
    scripts: '原稿',
    history: '履歴',
    settings: '設定',
    start: '開始'
  }
} as const;
```

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
npm test -- tests/settings.test.ts
```

Expected: PASS.

---

### Task 6: Speech Adapter Boundary

**Files:**
- Create: `src/core/speech.ts`
- Create: `tests/speech.test.ts`

- [ ] **Step 1: Write failing speech boundary test**

Add `tests/speech.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createDisabledRecognizer } from '../src/core/speech';

describe('disabled recognizer', () => {
  it('starts and stops without emitting text', async () => {
    const onText = vi.fn();
    const recognizer = createDisabledRecognizer();
    await recognizer.start({ language: 'zh', onText });
    await recognizer.stop();
    expect(onText).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- tests/speech.test.ts
```

Expected: FAIL because `src/core/speech.ts` does not exist.

- [ ] **Step 3: Add minimal implementation**

Add `src/core/speech.ts`:

```ts
import type { ScriptLanguage } from '../types';

export interface SpeechStartOptions {
  language: Exclude<ScriptLanguage, 'unknown'>;
  onText: (text: string) => void;
}

export interface SpeechRecognizer {
  start(options: SpeechStartOptions): Promise<void>;
  stop(): Promise<void>;
}

export function createDisabledRecognizer(): SpeechRecognizer {
  return {
    async start() {},
    async stop() {}
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
npm test -- tests/speech.test.ts
```

Expected: PASS.

---

### Task 7: React Main and Floating Views

**Files:**
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/FloatingPrompt.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Add renderer entry**

Add `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Teleprompter</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Add `src/main.tsx`:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { FloatingPrompt } from './FloatingPrompt';
import './styles.css';

const params = new URLSearchParams(location.search);
const Root = params.get('window') === 'floating' ? FloatingPrompt : App;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
```

- [ ] **Step 2: Add main app UI**

Add `src/App.tsx`:

```tsx
import { useState } from 'react';
import { detectScriptLanguage } from './core/language';
import { splitSentences } from './core/sentences';
import { defaultSettings } from './core/settings';
import { copy } from './i18n';

const sample = '大家好，欢迎使用提词器。请把你的文稿放在这里。';

export function App() {
  const [title, setTitle] = useState('未命名文稿');
  const [body, setBody] = useState(sample);
  const [settings, setSettings] = useState(defaultSettings);
  const text = copy[settings.uiLanguage];
  const language = detectScriptLanguage(body);
  const sentences = splitSentences(body);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <h1>{text.appTitle}</h1>
        <button>{text.scripts}</button>
        <button>{text.history}</button>
        <button>{text.settings}</button>
      </aside>
      <section className="editor">
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea value={body} onChange={(event) => setBody(event.target.value)} />
        <div className="status">Language: {language} · Sentences: {sentences.length}</div>
        <button className="primary">{text.start}</button>
      </section>
      <section className="settings">
        <label>
          UI
          <select
            value={settings.uiLanguage}
            onChange={(event) => setSettings({ ...settings, uiLanguage: event.target.value as 'zh' | 'en' | 'ja' })}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>
        <label>
          Opacity
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.01"
            value={settings.opacity}
            onChange={(event) => setSettings({ ...settings, opacity: Number(event.target.value) })}
          />
        </label>
        <label>
          Font size
          <input
            type="range"
            min="18"
            max="96"
            value={settings.fontSize}
            onChange={(event) => setSettings({ ...settings, fontSize: Number(event.target.value) })}
          />
        </label>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Add floating preview UI**

Add `src/FloatingPrompt.tsx`:

```tsx
const sentences = ['大家好，欢迎使用提词器。', '当前朗读句子会高亮显示。', '下一句会自动滚动到可见位置。'];

export function FloatingPrompt() {
  return (
    <main className="floating-window">
      {sentences.map((sentence, index) => (
        <p key={sentence} className={index === 0 ? 'active-line' : ''}>
          {sentence}
        </p>
      ))}
    </main>
  );
}
```

- [ ] **Step 4: Add styles**

Add `src/styles.css`:

```css
:root {
  color: #20201d;
  background: #f4f1ea;
  font-family: "Microsoft YaHei", "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  display: grid;
  grid-template-columns: 220px minmax(420px, 1fr) 280px;
  min-height: 100vh;
}

.sidebar {
  background: #20201d;
  color: #f7f3e8;
  padding: 24px;
}

.sidebar button {
  display: block;
  width: 100%;
  margin: 10px 0;
  padding: 10px;
}

.editor,
.settings {
  padding: 24px;
}

.editor input,
.editor textarea {
  box-sizing: border-box;
  display: block;
  width: 100%;
  margin-bottom: 14px;
  padding: 12px;
}

.editor textarea {
  min-height: 420px;
  resize: vertical;
}

.settings label {
  display: block;
  margin-bottom: 18px;
}

.primary {
  padding: 12px 18px;
  background: #2b5f5a;
  color: white;
  border: 0;
}

.status {
  margin-bottom: 14px;
  color: #68645c;
}

.floating-window {
  min-height: 100vh;
  padding: 28px;
  background: rgba(18, 18, 16, 0.72);
  color: #f7f7f2;
  font-size: 36px;
  line-height: 1.7;
}

.floating-window p {
  margin: 0 0 16px;
  opacity: 0.45;
}

.floating-window .active-line {
  color: #ffe08a;
  opacity: 1;
}
```

- [ ] **Step 5: Run renderer build**

Run:

```bash
npm run build
```

Expected: build succeeds.

---

### Task 8: Electron Windows and Shortcuts

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Modify: `package.json`

- [ ] **Step 1: Add Electron main process**

Add `electron/main.ts`:

```ts
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import path from 'node:path';

let mainWindow: BrowserWindow | null = null;
let floatingWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function rendererUrl(windowName?: string) {
  if (isDev) {
    return `http://127.0.0.1:5173${windowName ? `?window=${windowName}` : ''}`;
  }
  const file = path.join(__dirname, '../dist/index.html');
  return `file://${file}${windowName ? `?window=${windowName}` : ''}`;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  void mainWindow.loadURL(rendererUrl());
}

function createFloatingWindow() {
  if (floatingWindow) {
    floatingWindow.focus();
    return;
  }

  floatingWindow = new BrowserWindow({
    width: 900,
    height: 260,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  floatingWindow.on('closed', () => {
    floatingWindow = null;
  });

  void floatingWindow.loadURL(rendererUrl('floating'));
}

app.whenReady().then(() => {
  createMainWindow();
  globalShortcut.register('CommandOrControl+Alt+Left', () => {
    floatingWindow?.webContents.send('prompt:previous');
  });
  globalShortcut.register('CommandOrControl+Alt+Right', () => {
    floatingWindow?.webContents.send('prompt:next');
  });
});

ipcMain.handle('floating:open', () => {
  createFloatingWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

Add `electron/preload.ts`:

```ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('teleprompter', {
  openFloatingWindow: () => ipcRenderer.invoke('floating:open'),
  onPrevious: (callback: () => void) => ipcRenderer.on('prompt:previous', callback),
  onNext: (callback: () => void) => ipcRenderer.on('prompt:next', callback)
});
```

- [ ] **Step 2: Add Electron build output script**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "electron": "tsc --outDir dist-electron --module commonjs --noEmit false electron/main.ts electron/preload.ts && electron .",
    "test": "vitest run",
    "build": "tsc && vite build && tsc --outDir dist-electron --module commonjs --noEmit false electron/main.ts electron/preload.ts",
    "package": "electron-builder --win"
  }
}
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: build succeeds.

---

### Task 9: Local Storage

**Files:**
- Create: `src/core/storage.ts`
- Create: `tests/storage.test.ts`

- [ ] **Step 1: Write failing storage test**

Add `tests/storage.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadJson, saveJson } from '../src/core/storage';

describe('storage helpers', () => {
  it('round trips JSON in memory storage', () => {
    const storage = new Map<string, string>();
    saveJson(storage, 'settings', { opacity: 0.5 });
    expect(loadJson(storage, 'settings', { opacity: 1 })).toEqual({ opacity: 0.5 });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- tests/storage.test.ts
```

Expected: FAIL because `src/core/storage.ts` does not exist.

- [ ] **Step 3: Add minimal implementation**

Add `src/core/storage.ts`:

```ts
export interface KeyValueStorage {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

export function loadJson<T>(storage: KeyValueStorage, key: string, fallback: T): T {
  const raw = storage.get(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(storage: KeyValueStorage, key: string, value: unknown) {
  storage.set(key, JSON.stringify(value));
}
```

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
npm test -- tests/storage.test.ts
```

Expected: PASS.

---

### Task 10: Speech Matching

**Files:**
- Create: `src/core/matching.ts`
- Create: `tests/matching.test.ts`

- [ ] **Step 1: Write failing matching test**

Add `tests/matching.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { shouldAdvance } from '../src/core/matching';

describe('shouldAdvance', () => {
  it('advances when recognized text contains the next Chinese sentence core text', () => {
    expect(shouldAdvance('欢迎使用提词器', '大家好，', '欢迎使用提词器。')).toBe(true);
  });

  it('does not advance for unrelated text', () => {
    expect(shouldAdvance('完全不相关', '大家好，', '欢迎使用提词器。')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- tests/matching.test.ts
```

Expected: FAIL because `src/core/matching.ts` does not exist.

- [ ] **Step 3: Add minimal implementation**

Add `src/core/matching.ts`:

```ts
function normalize(text: string) {
  return text.toLowerCase().replace(/[\s，。！？,.!?]/g, '');
}

export function shouldAdvance(recognized: string, currentSentence: string, nextSentence: string) {
  const heard = normalize(recognized);
  const current = normalize(currentSentence);
  const next = normalize(nextSentence);

  if (!heard || !next || heard.includes(current)) return false;
  return next.includes(heard) || heard.includes(next.slice(0, Math.min(8, next.length)));
}
```

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
npm test -- tests/matching.test.ts
```

Expected: PASS.

---

### Task 11: sherpa-onnx Integration Spike

**Files:**
- Modify: `src/core/speech.ts`
- Create: `docs/model-setup.md`

- [ ] **Step 1: Add model setup notes**

Add `docs/model-setup.md`:

```md
# Model Setup

The app expects offline sherpa-onnx models under `models/`.

First model target:

- Chinese-English streaming sherpa-onnx model

The app should keep model binaries outside Git. Download and unpack models manually during development.
```

- [ ] **Step 2: Add a real recognizer factory stub**

Modify `src/core/speech.ts` to export a named factory that can later load sherpa-onnx:

```ts
export function createSherpaRecognizer(): SpeechRecognizer {
  return createDisabledRecognizer();
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test
```

Expected: all tests pass.

---

### Task 12: Package Check

**Files:**
- No new files.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run app manually**

Run terminal 1:

```bash
npm run dev
```

Run terminal 2:

```bash
npm run electron
```

Expected:

- Main window opens first.
- UI language selector works.
- Script text updates sentence count.
- Floating window can open after wiring the button to `openFloatingWindow`.
- Floating window is borderless, translucent, resizable, and always on top.

- [ ] **Step 4: Build Windows installer**

Run:

```bash
npm run package
```

Expected: installer output appears under `release/`.

---

## Plan Self-Review

Spec coverage:

- Windows EXE: covered by Electron and packaging tasks.
- Main page first: covered by Electron main window task.
- Floating window: covered by Electron window and React floating view tasks.
- Script management/history/settings: covered as minimal UI and storage foundations; full polish can be implemented after skeleton.
- Chinese/English offline recognition: covered by speech boundary and sherpa-onnx integration spike.
- Automatic language matching: covered by language detection tests.
- Japanese future support: covered by `ScriptLanguage` and i18n structure.
- GitHub publication: covered by README, `.gitignore`, model exclusion, and model setup docs.

Known follow-up after this plan:

- Replace `createSherpaRecognizer()` stub with the actual sherpa-onnx binding once the chosen model is downloaded locally.
- Wire `openFloatingWindow` button in `App.tsx`.
- Persist scripts and history through Electron IPC rather than browser-only storage.
