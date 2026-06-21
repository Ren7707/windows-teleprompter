import type { PromptSentence } from '../types';

const MAX_CJK_PROMPT_LINE_LENGTH = 26;
const MAX_LATIN_PROMPT_LINE_LENGTH = 36;

export function splitSentences(text: string): PromptSentence[] {
  const lines = normalizeImportedLineBreaks(text)
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .flatMap(splitStrongSentences)
    .flatMap((sentence) =>
      splitBookTitleGroups(sentence).flatMap((group) => (isBookTitle(group) ? [group] : splitSemanticPromptLines(group)))
    );

  return lines.map((part, index) => ({
    id: String(index),
    text: part
  }));
}

function normalizeImportedLineBreaks(text: string) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const result: string[] = [];
  let buffer = '';

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const next = lines[index + 1]?.trim() ?? '';

    if (!line) {
      flush();
      continue;
    }

    if (isChineseSectionNumber(line) && next) {
      flush();
      result.push(`${line} ${next}`);
      index += 1;
      continue;
    }

    buffer += line;

    if (shouldKeepHardBreak(buffer, next)) {
      flush();
    }
  }

  flush();
  return result.join('\n');

  function flush() {
    if (!buffer) return;
    result.push(buffer);
    buffer = '';
  }
}

function isChineseSectionNumber(text: string) {
  return /^[一二三四五六七八九十]+$/.test(text);
}

function shouldKeepHardBreak(current: string, next: string) {
  if (!next) return true;
  if (hasOpenBookTitle(current)) return false;
  if (/[\u3002\uff01\uff1f.!?]$/.test(current)) return true;
  if (isBookTitle(current)) return true;
  if (current.length <= 12 && next.length <= 16) return true;
  return false;
}

function hasOpenBookTitle(text: string) {
  return text.lastIndexOf('\u300a') > text.lastIndexOf('\u300b');
}

function splitStrongSentences(text: string) {
  return text.match(/[^\u3002\uff01\uff1f.!?\n]+[\u3002\uff01\uff1f.!?]?/g) ?? [];
}

function splitBookTitleGroups(text: string) {
  const groups: string[] = [];
  let cursor = 0;

  for (const match of text.matchAll(/\u300a[^\u300b]+\u300b/g)) {
    if (match.index === undefined) continue;
    if (match.index > cursor) groups.push(text.slice(cursor, match.index));
    groups.push(match[0]);
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) groups.push(text.slice(cursor));
  return groups.filter((group) => cleanPromptText(group).length > 0);
}

function isBookTitle(text: string) {
  return /^\u300a[^\u300b]+\u300b$/.test(text.trim());
}

function splitSemanticPromptLines(text: string) {
  const part = cleanPromptText(text);
  const maxLength = getPromptLineMaxLength(part);
  if (!part) return [];
  if (part.length <= maxLength) return [part];

  const weakParts = splitWeakParts(part);
  if (weakParts.length > 1) return mergePromptParts(weakParts, maxLength);

  return toPromptLines(part);
}

function splitWeakParts(text: string) {
  return text.match(/[^\uff0c\u3001\uff1b\uff1a,;:]+[\uff0c\u3001\uff1b\uff1a,;:]?/g) ?? [text];
}

function toPromptLines(text: string) {
  const part = cleanPromptText(text);
  const maxLength = getPromptLineMaxLength(part);
  if (!part) return [];
  if (part.length <= maxLength) return [part];

  const quotedGroups = splitAdjacentQuotedGroups(part);
  if (quotedGroups.length > 1) return mergePromptParts(quotedGroups, maxLength);

  return hardWrap(part, maxLength);
}

function splitAdjacentQuotedGroups(text: string) {
  const groups: string[] = [];
  let remaining = text;

  while (true) {
    const boundary = remaining.indexOf('\u201d\u201c');
    if (boundary === -1) break;
    groups.push(remaining.slice(0, boundary + 1));
    remaining = remaining.slice(boundary + 1);
  }

  if (remaining) groups.push(remaining);
  return groups;
}

function mergePromptParts(parts: string[], maxLength: number) {
  const lines: string[] = [];
  let current = '';

  for (const part of parts) {
    if (part.length > maxLength) {
      if (current) {
        pushPromptLine(lines, current);
        current = '';
      }
      lines.push(...toPromptLines(part));
      continue;
    }

    const merged = current + part;
    if (!current || merged.length <= maxLength) {
      current = merged;
    } else {
      pushPromptLine(lines, current);
      current = part;
    }
  }

  if (current) pushPromptLine(lines, current);
  return lines;
}

function pushPromptLine(lines: string[], text: string) {
  const line = cleanPromptText(text);
  if (line) lines.push(line);
}

function hardWrap(text: string, maxLength: number) {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    chunks.push(remaining.slice(0, maxLength));
    remaining = remaining.slice(maxLength);
  }

  if (remaining.length === 1 && chunks.length > 0) {
    const previous = chunks.pop() ?? '';
    chunks.push(previous.slice(0, -1));
    remaining = previous.slice(-1) + remaining;
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

function getPromptLineMaxLength(text: string) {
  return /[\u3400-\u9fff]/.test(text) ? MAX_CJK_PROMPT_LINE_LENGTH : MAX_LATIN_PROMPT_LINE_LENGTH;
}

function cleanPromptText(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\u3002\uff0c\u3001\uff1b\uff1a.,;:]+$/g, '');
}
