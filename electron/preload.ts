import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('teleprompter', {
  openFloatingWindow: (payload: unknown) => ipcRenderer.invoke('floating:open', payload),
  closeFloatingWindow: () => ipcRenderer.invoke('floating:close'),
  getPromptPayload: () => ipcRenderer.invoke('prompt:get'),
  testMicrophone: () => ipcRenderer.invoke('microphone:test'),
  importDocument: () => ipcRenderer.invoke('documents:import'),
  listDocuments: () => ipcRenderer.invoke('documents:list'),
  loadDocument: (id: string) => ipcRenderer.invoke('documents:load', id),
  renameDocument: (id: string, title: string) => ipcRenderer.invoke('documents:rename', id, title),
  deleteDocument: (id: string) => ipcRenderer.invoke('documents:delete', id),
  updateShortcuts: (shortcuts: unknown) => ipcRenderer.invoke('shortcuts:update', shortcuts),
  controlWindow: (action: 'minimize' | 'maximize' | 'close') => ipcRenderer.invoke('window:control', action),
  onPrevious: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('prompt:previous', listener);
    return () => ipcRenderer.removeListener('prompt:previous', listener);
  },
  onNext: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('prompt:next', listener);
    return () => ipcRenderer.removeListener('prompt:next', listener);
  },
  onSpeechText: (callback: (text: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, text: string) => callback(text);
    ipcRenderer.on('speech:text', listener);
    return () => ipcRenderer.removeListener('speech:text', listener);
  },
  onSpeechError: (callback: (message: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => callback(message);
    ipcRenderer.on('speech:error', listener);
    return () => ipcRenderer.removeListener('speech:error', listener);
  }
});
