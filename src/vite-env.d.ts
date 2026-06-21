interface Window {
  teleprompter?: {
    openFloatingWindow: (payload: unknown) => Promise<void>;
    closeFloatingWindow: () => Promise<void>;
    getPromptPayload: () => Promise<unknown>;
    testMicrophone: () => Promise<{ ok: boolean; message: string }>;
    importDocument: () => Promise<ImportedDocument | null>;
    listDocuments: () => Promise<ImportedDocumentSummary[]>;
    loadDocument: (id: string) => Promise<ImportedDocument>;
    renameDocument: (id: string, title: string) => Promise<ImportedDocument>;
    deleteDocument: (id: string) => Promise<boolean>;
    updateShortcuts: (shortcuts: { previous: string; next: string }) => Promise<void>;
    controlWindow: (action: 'minimize' | 'maximize' | 'close') => Promise<void>;
    onPrevious: (callback: () => void) => () => void;
    onNext: (callback: () => void) => () => void;
    onSpeechText: (callback: (text: string) => void) => () => void;
    onSpeechError: (callback: (message: string) => void) => () => void;
  };
}

interface ImportedDocumentSummary {
  id: string;
  title: string;
  kind: 'txt' | 'docx' | 'pdf';
}

interface ImportedDocument extends ImportedDocumentSummary {
  body: string;
}
