import { describe, expect, it } from 'vitest';
import { splitSentences } from '../src/core/sentences';

describe('splitSentences', () => {
  it('splits Chinese sentence-ending punctuation and removes ordinary trailing punctuation', () => {
    expect(splitSentences('\u7b2c\u4e00\u53e5\u3002\u7b2c\u4e8c\u53e5\uff01\u7b2c\u4e09\u53e5\uff1f').map((s) => s.text)).toEqual([
      '\u7b2c\u4e00\u53e5',
      '\u7b2c\u4e8c\u53e5\uff01',
      '\u7b2c\u4e09\u53e5\uff1f'
    ]);
  });

  it('splits English sentence-ending punctuation and keeps tone punctuation', () => {
    expect(splitSentences('First sentence. Second sentence! Third sentence?').map((s) => s.text)).toEqual([
      'First sentence',
      'Second sentence!',
      'Third sentence?'
    ]);
  });

  it('chunks long Chinese sentences into lyric-style lines', () => {
    const lines = splitSentences(
      '\u300a\u53e4\u8700\u56de\u54cd\uff1a\u751f\u6001\u6587\u660e\u4e09\u91cd\u5883\u300b\u662f\u4e00\u7ec4\u57fa\u4e8e AIGC \u6280\u672f\u521b\u4f5c\u7684\u7cfb\u5217\u6982\u5ff5\u827a\u672f\u4f5c\u54c1\uff0c\u4ee5\u4e09\u661f\u5806\u9752\u94dc\u9762\u5177\u4e3a\u6838\u5fc3\u6587\u5316\u7b26\u53f7\uff0c\u901a\u8fc7\u9ec4\u6c99\u63a9\u8fc7\u5f80\u3001\u51b0\u5c01\u7167\u4eca\u6614\u3001\u7eff\u610f\u7eed\u65b0\u751f\u4e09\u91cd\u751f\u6001\u573a\u666f\uff0c\u6784\u5efa\u8de8\u8d8a\u65f6\u95f4\u4e0e\u7a7a\u95f4\u7684\u6587\u660e\u53d9\u4e8b\u3002'
    ).map((s) => s.text);

    expect(lines.length).toBeGreaterThan(4);
    expect(Math.max(...lines.map((line) => line.length))).toBeLessThanOrEqual(26);
  });

  it('keeps imported paragraph lines within a readable semantic limit', () => {
    const lines = splitSentences(
      '\u672c\u7cfb\u5217\u4ee5\u4e8c\u5341\u56db\u8282\u6c14\u4e2d\u7684\u6625\u5206\u3001\u6e05\u660e\u3001\u8c37\u96e8\u4e3a\u4e3b\u9898\uff0c\u91c7\u7528\u6e05\u65b0\u56fd\u98ce\u63d2\u753b\u5f62\u5f0f\uff0c\u5c55\u73b0\u6625\u65e5\u8282\u6c14\u7684\u7269\u5019\u4e4b\u7f8e\u4e0e\u6c11\u4fd7\u610f\u8da3\u3002\u4f5c\u54c1\u5c06\u6625\u5206\u7684\u6625\u5377\u4e0e\u5f52\u71d5\u3001\u6e05\u660e\u7684\u9752\u56e2\u4e0e\u6620\u5c71\u7ea2\u3001\u8c37\u96e8\u7684\u65b0\u8336\u4e0e\u8336\u5c71\u7b49\u5143\u7d20\u878d\u5165\u5c71\u6c34\u573a\u666f\uff0c\u4ee5\u660e\u5feb\u7684\u6696\u8c03\u4e0e\u7ec6\u817b\u7ebf\u6761\uff0c\u52fe\u52d2\u51fa\u6625\u65e5\u751f\u673a\u76ce\u7136\u7684\u666f\u8c61\u3002'
    ).map((s) => s.text);

    expect(lines).toEqual([
      '\u672c\u7cfb\u5217\u4ee5\u4e8c\u5341\u56db\u8282\u6c14\u4e2d\u7684\u6625\u5206\u3001\u6e05\u660e\u3001\u8c37\u96e8\u4e3a\u4e3b\u9898',
      '\u91c7\u7528\u6e05\u65b0\u56fd\u98ce\u63d2\u753b\u5f62\u5f0f',
      '\u5c55\u73b0\u6625\u65e5\u8282\u6c14\u7684\u7269\u5019\u4e4b\u7f8e\u4e0e\u6c11\u4fd7\u610f\u8da3',
      '\u4f5c\u54c1\u5c06\u6625\u5206\u7684\u6625\u5377\u4e0e\u5f52\u71d5\u3001\u6e05\u660e\u7684\u9752\u56e2\u4e0e\u6620\u5c71\u7ea2',
      '\u8c37\u96e8\u7684\u65b0\u8336\u4e0e\u8336\u5c71\u7b49\u5143\u7d20\u878d\u5165\u5c71\u6c34\u573a\u666f',
      '\u4ee5\u660e\u5feb\u7684\u6696\u8c03\u4e0e\u7ec6\u817b\u7ebf\u6761\uff0c\u52fe\u52d2\u51fa\u6625\u65e5\u751f\u673a\u76ce\u7136\u7684\u666f\u8c61'
    ]);
    expect(Math.max(...lines.map((line) => line.length))).toBeLessThanOrEqual(26);
  });

  it('combines comma-separated quoted phrases until the line limit is reached', () => {
    const lines = splitSentences(
      '\u901a\u8fc7\u201c\u9ec4\u6c99\u63a9\u8fc7\u5f80\u201d\u201c\u51b0\u5c01\u7167\u4eca\u6614\u201d\u201c\u7eff\u610f\u7eed\u65b0\u751f\u201d\u4e09\u91cd\u751f\u6001\u573a\u666f\uff0c\u6784\u5efa\u6587\u660e\u53d9\u4e8b\u3002'
    ).map((s) => s.text);

    expect(lines).toEqual([
      '\u901a\u8fc7\u201c\u9ec4\u6c99\u63a9\u8fc7\u5f80\u201d\u201c\u51b0\u5c01\u7167\u4eca\u6614\u201d',
      '\u201c\u7eff\u610f\u7eed\u65b0\u751f\u201d\u4e09\u91cd\u751f\u6001\u573a\u666f',
      '\u6784\u5efa\u6587\u660e\u53d9\u4e8b'
    ]);
  });

  it('keeps punctuation inside a merged prompt line', () => {
    expect(splitSentences('\u901a\u8fc7\u201c\u9ec4\u6c99\u63a9\u8fc7\u5f80\u201d\u201c\u51b0\u5c01\u7167\u4eca\u6614\u201d\u3002').map((s) => s.text)).toEqual([
      '\u901a\u8fc7\u201c\u9ec4\u6c99\u63a9\u8fc7\u5f80\u201d\u201c\u51b0\u5c01\u7167\u4eca\u6614\u201d'
    ]);
  });

  it('keeps book titles as a standalone line', () => {
    expect(
      splitSentences(
        '\u300a\u53e4\u8700\u56de\u54cd\uff1a\u751f\u6001\u6587\u660e\u4e09\u91cd\u5883\u300b\u662f\u4e00\u7ec4\u57fa\u4e8e AIGC \u6280\u672f\u521b\u4f5c\u7684\u7cfb\u5217\u6982\u5ff5\u827a\u672f\u4f5c\u54c1\u3002'
      ).map((s) => s.text)
    ).toEqual([
      '\u300a\u53e4\u8700\u56de\u54cd\uff1a\u751f\u6001\u6587\u660e\u4e09\u91cd\u5883\u300b',
      '\u662f\u4e00\u7ec4\u57fa\u4e8e AIGC \u6280\u672f\u521b\u4f5c\u7684\u7cfb\u5217\u6982\u5ff5\u827a\u672f\u4f5c\u54c1'
    ]);
  });

  it('does not split a single trailing character into its own line', () => {
    const lines = splitSentences('\u662f\u4e00\u7ec4\u57fa\u4e8e AIGC \u6280\u672f\u521b\u4f5c\u7684\u7cfb\u5217\u6982\u5ff5\u827a\u672f\u4f5c\u54c1').map((s) => s.text);

    expect(lines).toEqual(['\u662f\u4e00\u7ec4\u57fa\u4e8e AIGC \u6280\u672f\u521b\u4f5c\u7684\u7cfb\u5217\u6982\u5ff5\u827a\u672f\u4f5c\u54c1']);
    expect(lines.at(-1)).not.toBe('\u54c1');
  });

  it('joins soft line breaks from imported documents before splitting', () => {
    const lines = splitSentences('\u662f\u4e00\u7ec4\u57fa\u4e8e AIGC \u6280\u672f\u521b\u4f5c\u7684\u7cfb\u5217\u6982\u5ff5\n\u827a\u672f\u4f5c\n\u54c1\n\u4ee5\u4e09\u661f\u5806\u9752\u94dc\u9762\u5177\u4e3a\u6838\u5fc3\u6587\u5316\u7b26\u53f7').map((s) => s.text);

    expect(lines).not.toContain('\u827a\u672f\u4f5c');
    expect(lines).not.toContain('\u54c1');
    expect(lines.join('')).toContain('\u827a\u672f\u4f5c\u54c1');
  });

  it('keeps book titles intact even when a source line break appears inside the title', () => {
    const lines = splitSentences('\u7b2c\u4e09\u5e45\u300a\u7eff\u610f\u7eed\u65b0\n\u751f\u300b\n\u63cf\u7ed8\u81ea\u7136\u91cd\u65b0\u8986\u76d6\u9057\u5740').map((s) => s.text);

    expect(lines).toContain('\u300a\u7eff\u610f\u7eed\u65b0\u751f\u300b');
    expect(lines).not.toContain('\u751f\u300b');
  });

  it('combines Chinese section numbers with the following heading', () => {
    expect(splitSentences('\u4e00\n\u4f5c\u54c1\u7b80\u4ecb').map((s) => s.text)).toEqual(['\u4e00 \u4f5c\u54c1\u7b80\u4ecb']);
  });
});
