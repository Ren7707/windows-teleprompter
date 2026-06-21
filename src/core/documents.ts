export type DocumentKind = 'txt' | 'docx' | 'pdf' | 'unsupported';

export function getDocumentKind(fileName: string): DocumentKind {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.txt')) return 'txt';
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.pdf')) return 'pdf';
  return 'unsupported';
}

export function makeImportedFileName(fileName: string, timestamp: number) {
  const kind = getDocumentKind(fileName);
  const extension = kind === 'unsupported' ? 'txt' : kind;
  const base = sanitizeDocumentTitle(fileName.replace(/\.[^.]+$/, ''));

  return `${timestamp}-${base || 'document'}.${extension}`;
}

export function makeRenamedImportedFileName(currentId: string, title: string) {
  const kind = getDocumentKind(currentId);
  const extension = kind === 'unsupported' ? 'txt' : kind;
  const timestamp = currentId.match(/^\d+/)?.[0] ?? String(Date.now());
  const base = sanitizeDocumentTitle(title);

  return `${timestamp}-${base || 'document'}.${extension}`;
}

function sanitizeDocumentTitle(title: string) {
  return title
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s-]+|[.\s-]+$/g, '');
}
