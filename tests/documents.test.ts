import { describe, expect, it } from 'vitest';
import { getDocumentKind, makeImportedFileName, makeRenamedImportedFileName } from '../src/core/documents';

describe('document helpers', () => {
  it('detects supported document kinds', () => {
    expect(getDocumentKind('demo.txt')).toBe('txt');
    expect(getDocumentKind('demo.docx')).toBe('docx');
    expect(getDocumentKind('demo.pdf')).toBe('pdf');
    expect(getDocumentKind('demo.doc')).toBe('unsupported');
  });

  it('creates a safe imported file name while preserving Chinese titles', () => {
    expect(makeImportedFileName('\u6d4b\u8bd5 \u6587\u7a3f.docx', 123)).toBe('123-\u6d4b\u8bd5 \u6587\u7a3f.docx');
  });

  it('renames an imported file while keeping timestamp and extension', () => {
    expect(makeRenamedImportedFileName('123-document.docx', '\u65b0\u6807\u9898')).toBe('123-\u65b0\u6807\u9898.docx');
  });
});
