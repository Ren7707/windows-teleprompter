import { describe, expect, it } from 'vitest';
import { getDocumentResetState, LEGACY_IMPORT_MARKER } from '../src/core/documentDeletion';

describe('document deletion state', () => {
  it('clears the active imported document after deleting it', () => {
    expect(getDocumentResetState('Untitled', 'Sample text')).toEqual({
      title: 'Untitled',
      body: 'Sample text',
      selectedDocumentId: null,
      isImportedPreview: false,
      microphoneStatus: ''
    });
  });

  it('uses an unsupported marker file name for one-time legacy migration state', () => {
    expect(LEGACY_IMPORT_MARKER).toBe('.legacy-imported-documents-migrated');
  });
});
