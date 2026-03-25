function normalizeForMatch(input: string) {
  // Lowercase + remove punctuation-ish chars + collapse whitespace.
  return (input || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function countTokenOverlap(aNorm: string, bNorm: string) {
  const aTokens = aNorm.split(' ').filter(Boolean);
  const bSet = new Set(bNorm.split(' ').filter(Boolean));
  if (aTokens.length === 0) return 0;

  let overlap = 0;
  for (const t of aTokens) {
    if (bSet.has(t)) overlap++;
  }
  return overlap / Math.max(aTokens.length, 1);
}

export function highlightText(textToHighlight: string) {
  if (!textToHighlight) return;

  const targetNorm = normalizeForMatch(textToHighlight);
  if (!targetNorm) return;

  const targetTokens = targetNorm.split(' ').filter(Boolean);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);

  let bestNode: Text | null = null;
  let bestScore = -1;
  let bestStart = -1;
  let bestEnd = -1;

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const content = textNode.textContent || '';
    const contentNorm = normalizeForMatch(content);
    if (!contentNorm) continue;

    let score = 0;

    if (contentNorm.includes(targetNorm)) {
      // Strong match: exact-ish normalized content appears in this node.
      score = 1_000 + targetNorm.length;
    } else {
      score = countTokenOverlap(targetNorm, contentNorm);
    }

    if (score <= bestScore) continue;

    // Choose an approximate window inside this text node:
    // find the first occurrence of any normalized token.
    const lowerContent = content.toLowerCase();
    let startIndex = -1;
    for (const tok of targetTokens) {
      if (!tok) continue;
      const idx = lowerContent.indexOf(tok);
      if (idx !== -1) {
        startIndex = idx;
        break;
      }
    }

    // If token-based matching fails (punctuation differences), fallback to a coarse guess.
    if (startIndex === -1) startIndex = Math.max(0, content.length / 2 - textToHighlight.length / 2);

    const endIndex = Math.min(content.length, startIndex + textToHighlight.length);

    bestNode = textNode;
    bestScore = score;
    bestStart = startIndex;
    bestEnd = endIndex;
  }

  if (!bestNode || bestStart < 0 || bestEnd <= bestStart) return;

  const range = document.createRange();
  range.setStart(bestNode, bestStart);
  range.setEnd(bestNode, bestEnd);

  const span = document.createElement('span');
  span.dataset.vouchHighlight = 'true';
  span.style.backgroundColor = 'rgba(255, 255, 0, 0.6)';
  span.style.borderRadius = '2px';
  span.style.padding = '2px 0';
  span.style.transition = 'opacity 1s ease-out';
  span.style.boxShadow = '0 0 10px rgba(255, 255, 0, 0.4)';
  span.style.opacity = '1';

  try {
    range.surroundContents(span);
  } catch (e) {
    console.warn('Vouch: Could not highlight across complex DOM structure', e);
    return;
  }

  // Scroll to the highlight.
  span.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Fade out and remove after 5 seconds.
  setTimeout(() => {
    span.style.opacity = '0';
    setTimeout(() => {
      const parent = span.parentNode;
      if (!parent) return;

      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
      parent.normalize(); // Clean up text nodes
    }, 1000);
  }, 5000);
}
