export const LEGACY_IMPORT_MARKER = '.legacy-imported-documents-migrated';

export function getDocumentResetState(defaultTitle: string, defaultBody: string) {
  return {
    title: defaultTitle,
    body: defaultBody,
    selectedDocumentId: null,
    isImportedPreview: false,
    microphoneStatus: ''
  };
}
