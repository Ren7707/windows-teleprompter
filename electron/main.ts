import { app, BrowserWindow, Menu, dialog, globalShortcut, ipcMain } from 'electron';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { LEGACY_IMPORT_MARKER } from '../src/core/documentDeletion';
import { getDocumentKind, makeImportedFileName, makeRenamedImportedFileName } from '../src/core/documents';
import { defaultSettings, type AppSettings } from '../src/core/settings';
import { createSherpaRecognizer, type SpeechRecognizer } from '../src/core/speech';

let mainWindow: BrowserWindow | null = null;
let floatingWindow: BrowserWindow | null = null;
let promptPayload: unknown = null;
let speechRecognizer: SpeechRecognizer | null = null;
let floatingBoundsSaveTimer: ReturnType<typeof setTimeout> | null = null;

const isDev = !app.isPackaged;
const FLOATING_MIN_WIDTH = 520;
const FLOATING_MIN_HEIGHT = 220;

function rendererUrl(windowName?: string) {
  if (isDev) {
    return `http://127.0.0.1:5173${windowName ? `?window=${windowName}` : ''}`;
  }

  const file = path.join(app.getAppPath(), 'dist/index.html');
  return `${pathToFileURL(file).toString()}${windowName ? `?window=${windowName}` : ''}`;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
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

  const bounds = loadFloatingWindowBounds();
  floatingWindow = new BrowserWindow({
    x: bounds?.x,
    y: bounds?.y,
    width: Math.max(bounds?.width ?? 900, FLOATING_MIN_WIDTH),
    height: Math.max(bounds?.height ?? 260, FLOATING_MIN_HEIGHT),
    minWidth: FLOATING_MIN_WIDTH,
    minHeight: FLOATING_MIN_HEIGHT,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    alwaysOnTop: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  floatingWindow.on('closed', () => {
    void stopSpeech();
    floatingWindow = null;
  });
  floatingWindow.on('close', () => saveFloatingWindowBounds());
  floatingWindow.on('move', () => scheduleFloatingWindowBoundsSave());
  floatingWindow.on('resize', () => scheduleFloatingWindowBoundsSave());

  void floatingWindow.loadURL(rendererUrl('floating'));
  void startSpeechIfEnabled();
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createMainWindow();
  registerPromptShortcuts(defaultSettings.shortcuts);
});

ipcMain.handle('floating:open', (_event, payload: unknown) => {
  promptPayload = payload;
  createFloatingWindow();
});

ipcMain.handle('floating:close', () => {
  floatingWindow?.close();
});

ipcMain.handle('window:control', (_event, action: 'minimize' | 'maximize' | 'close') => {
  if (!mainWindow) return;
  if (action === 'minimize') mainWindow.minimize();
  if (action === 'maximize') {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
  if (action === 'close') mainWindow.close();
});

ipcMain.handle('prompt:get', () => promptPayload);

ipcMain.handle('microphone:test', () => {
  try {
    const cpal = loadNodeModule<{
      getDefaultInputDevice(): { name?: string; deviceId: string };
      getDefaultInputConfig(deviceId: string): { sampleRate: number; channels: number; sampleFormat: string };
    }>('node-cpal');
    const device = cpal.getDefaultInputDevice();
    const config = cpal.getDefaultInputConfig(device.deviceId);
    return {
      ok: true,
      message: `${device.name ?? 'Default microphone'} · ${config.sampleRate} Hz · ${config.channels} ch · ${config.sampleFormat}`
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
});

ipcMain.handle('shortcuts:update', (_event, shortcuts: AppSettings['shortcuts']) => {
  registerPromptShortcuts(shortcuts);
});

ipcMain.handle('documents:import', async () => {
  const dialogOptions: Electron.OpenDialogOptions = {
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['txt', 'docx', 'pdf'] }
    ]
  };
  const result = mainWindow ? await dialog.showOpenDialog(mainWindow, dialogOptions) : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || !result.filePaths[0]) return null;

  const source = result.filePaths[0];
  const kind = getDocumentKind(source);
  if (kind === 'unsupported') {
    throw new Error('Only TXT, DOCX, and PDF files are supported.');
  }

  const importedDir = await ensureImportedDocumentsDir();
  const importedName = makeImportedFileName(path.basename(source), Date.now());
  const target = path.join(importedDir, importedName);
  await fs.copyFile(source, target);

  return loadImportedDocument(target);
});

ipcMain.handle('documents:list', async () => {
  const importedDir = await ensureImportedDocumentsDir();
  const entries = await fs.readdir(importedDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && getDocumentKind(entry.name) !== 'unsupported')
    .map((entry) => ({
      id: entry.name,
      title: entry.name.replace(/^\d+-/, '').replace(/\.[^.]+$/, ''),
      kind: getDocumentKind(entry.name)
    }));
});

ipcMain.handle('documents:load', async (_event, id: string) => {
  const file = path.join(await ensureImportedDocumentsDir(), path.basename(id));
  return loadImportedDocument(file);
});

ipcMain.handle('documents:rename', async (_event, id: string, title: string) => {
  const importedDir = await ensureImportedDocumentsDir();
  const source = path.join(importedDir, path.basename(id));
  const targetName = makeRenamedImportedFileName(path.basename(id), title);
  if (targetName === path.basename(source)) return loadImportedDocument(source);

  const target = await getAvailableDocumentPath(importedDir, targetName);

  await fs.rename(source, target);
  return loadImportedDocument(target);
});

ipcMain.handle('documents:delete', async (_event, id: string) => {
  const importedDir = await ensureImportedDocumentsDir();
  const file = path.join(importedDir, path.basename(id));
  try {
    await fs.unlink(file);
  } catch (error) {
    if (!isFileNotFoundError(error)) throw error;
  }
  return true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  void stopSpeech();
});

function registerPromptShortcuts(shortcuts: AppSettings['shortcuts']) {
  globalShortcut.unregisterAll();

  registerShortcut(shortcuts.previous, () => {
    floatingWindow?.webContents.send('prompt:previous');
  });
  registerShortcut(shortcuts.next, () => {
    floatingWindow?.webContents.send('prompt:next');
  });
}

function registerShortcut(accelerator: string, callback: () => void) {
  try {
    if (accelerator.trim()) globalShortcut.register(accelerator, callback);
  } catch {
    // Invalid user-entered accelerators are ignored until corrected.
  }
}

function scheduleFloatingWindowBoundsSave() {
  if (floatingBoundsSaveTimer) clearTimeout(floatingBoundsSaveTimer);
  floatingBoundsSaveTimer = setTimeout(saveFloatingWindowBounds, 250);
}

function saveFloatingWindowBounds() {
  if (!floatingWindow) return;
  const bounds = floatingWindow.getBounds();
  if (bounds.width < FLOATING_MIN_WIDTH || bounds.height < FLOATING_MIN_HEIGHT) return;

  try {
    fsSync.mkdirSync(app.getPath('userData'), { recursive: true });
    fsSync.writeFileSync(getFloatingWindowBoundsFile(), JSON.stringify(bounds), 'utf8');
  } catch {
    // Bounds persistence is best-effort only.
  }
}

function loadFloatingWindowBounds() {
  try {
    const raw = fsSync.readFileSync(getFloatingWindowBoundsFile(), 'utf8');
    const bounds = JSON.parse(raw) as Electron.Rectangle;
    if (!isValidBounds(bounds)) return null;
    return bounds;
  } catch {
    return null;
  }
}

function isValidBounds(bounds: Partial<Electron.Rectangle>) {
  return (
    Number.isFinite(bounds.x) &&
    Number.isFinite(bounds.y) &&
    Number.isFinite(bounds.width) &&
    Number.isFinite(bounds.height) &&
    Number(bounds.width) >= FLOATING_MIN_WIDTH &&
    Number(bounds.height) >= FLOATING_MIN_HEIGHT
  );
}

function getFloatingWindowBoundsFile() {
  return path.join(app.getPath('userData'), 'floating-window-bounds.json');
}

async function startSpeechIfEnabled() {
  await stopSpeech();

  if (!isPromptPayload(promptPayload)) return;
  if (!promptPayload.settings.speechEnabled) return;
  if (promptPayload.session.language !== 'zh' && promptPayload.session.language !== 'en') return;

  speechRecognizer = createSherpaRecognizer();

  try {
    await speechRecognizer.start({
      language: promptPayload.session.language,
      onText: (text) => {
        floatingWindow?.webContents.send('speech:text', text);
      }
    });
  } catch (error) {
    floatingWindow?.webContents.send('speech:error', error instanceof Error ? error.message : String(error));
    speechRecognizer = null;
  }
}

async function stopSpeech() {
  if (!speechRecognizer) return;
  const recognizer = speechRecognizer;
  speechRecognizer = null;
  await recognizer.stop();
}

function isPromptPayload(value: unknown): value is {
  session: { language: 'zh' | 'en'; sentences: unknown[] };
  settings: { speechEnabled: boolean };
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'session' in value &&
    'settings' in value &&
    typeof (value as { settings?: { speechEnabled?: unknown } }).settings?.speechEnabled === 'boolean'
  );
}

function loadNodeModule<T>(name: string): T {
  return require(name) as T;
}

function getImportedDocumentsDir() {
  return path.join(app.getPath('userData'), 'imported-documents');
}

async function ensureImportedDocumentsDir() {
  const importedDir = getImportedDocumentsDir();
  await fs.mkdir(importedDir, { recursive: true });
  await migrateLegacyImportedDocuments(importedDir);
  return importedDir;
}

async function migrateLegacyImportedDocuments(importedDir: string) {
  const legacyDir = path.join(app.getAppPath(), 'imported-documents');
  if (path.resolve(legacyDir) === path.resolve(importedDir)) return;
  const marker = path.join(importedDir, LEGACY_IMPORT_MARKER);
  if (await pathExists(marker)) return;

  let entries: string[];
  try {
    entries = await fs.readdir(legacyDir);
  } catch {
    await fs.writeFile(marker, '', 'utf8');
    return;
  }

  for (const entry of entries) {
    if (getDocumentKind(entry) === 'unsupported') continue;
    const source = path.join(legacyDir, entry);
    const target = path.join(importedDir, entry);
    if (await pathExists(target)) continue;
    await fs.copyFile(source, target);
  }
  await fs.writeFile(marker, '', 'utf8');
}

async function loadImportedDocument(file: string) {
  const kind = getDocumentKind(file);
  const title = path.basename(file).replace(/^\d+-/, '').replace(/\.[^.]+$/, '');
  const body = await extractDocumentText(file, kind);

  return {
    id: path.basename(file),
    title,
    kind,
    body
  };
}

async function getAvailableDocumentPath(directory: string, fileName: string) {
  const extension = path.extname(fileName);
  const base = path.basename(fileName, extension);
  let candidate = path.join(directory, fileName);
  let suffix = 2;

  while (await pathExists(candidate)) {
    candidate = path.join(directory, `${base}-${suffix}${extension}`);
    suffix += 1;
  }

  return candidate;
}

async function pathExists(file: string) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function isFileNotFoundError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

async function extractDocumentText(file: string, kind: ReturnType<typeof getDocumentKind>) {
  if (kind === 'txt') return fs.readFile(file, 'utf8');
  if (kind === 'docx') {
    const mammoth = loadNodeModule<{ extractRawText(input: { path: string }): Promise<{ value: string }> }>('mammoth');
    return (await mammoth.extractRawText({ path: file })).value;
  }
  if (kind === 'pdf') {
    const { PDFParse } = loadNodeModule<{ PDFParse: new (input: { data: Buffer }) => { getText(): Promise<{ text: string }>; destroy(): Promise<void> } }>('pdf-parse');
    const parser = new PDFParse({ data: await fs.readFile(file) });
    try {
      return (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  }
  throw new Error('Unsupported document type.');
}
