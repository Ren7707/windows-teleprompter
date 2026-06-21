function normalize(text: string) {
  return text.toLowerCase().replace(/[\s，。！？、；；,.!?“”"'‘’]/g, '');
}

export function shouldAdvance(recognized: string, currentSentence: string, nextSentence: string) {
  const heard = normalize(recognized);
  const current = normalize(currentSentence);
  const next = normalize(nextSentence);

  if (!heard) return false;
  if (isNearCurrentSentenceEnd(heard, current)) return true;
  if (!next) return false;
  return next.includes(heard) || heard.includes(next.slice(0, Math.min(8, next.length)));
}

function isNearCurrentSentenceEnd(heard: string, current: string) {
  if (!current) return false;

  const tailSize = Math.min(5, Math.max(2, Math.ceil(current.length * 0.2)));
  if (heard.includes(current.slice(-tailSize))) return true;

  const progress = orderedProgress(heard, current);
  return progress.coverage >= 0.58 && progress.position >= 0.8;
}

function orderedProgress(heard: string, target: string) {
  let searchFrom = 0;
  let matched = 0;
  let lastIndex = -1;

  for (const char of heard) {
    const index = target.indexOf(char, searchFrom);
    if (index === -1) continue;
    matched += 1;
    lastIndex = index;
    searchFrom = index + 1;
  }

  return {
    coverage: matched / target.length,
    position: (lastIndex + 1) / target.length
  };
}
