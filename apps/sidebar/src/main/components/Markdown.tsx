import React from 'react';

export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line → spacer
    if (!trimmed) {
      elements.push(<div key={i} style={{ height: 6 }} />);
      continue;
    }

    // Heading (### / ## / #)
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizes: Record<number, string> = { 1: '1rem', 2: '0.92rem', 3: '0.85rem' };
      elements.push(
        <div
          key={i}
          style={{
            fontWeight: 900,
            fontSize: sizes[level] || '0.85rem',
            marginTop: 8,
            marginBottom: 4,
            color: '#1a1a1a',
          }}
        >
          {inlineFormat(headingMatch[2])}
        </div>
      );
      continue;
    }

    // Bullet points (- or * or •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginLeft: 4, marginBottom: 2 }}>
          <span style={{ color: '#dc2626', fontWeight: 900, flexShrink: 0 }}>•</span>
          <span>{inlineFormat(bulletMatch[1])}</span>
        </div>
      );
      continue;
    }

    // Numbered list (1. 2. etc)
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginLeft: 4, marginBottom: 2 }}>
          <span style={{ color: '#dc2626', fontWeight: 900, flexShrink: 0 }}>{numMatch[1]}.</span>
          <span>{inlineFormat(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <div key={i} style={{ marginBottom: 2 }}>
        {inlineFormat(trimmed)}
      </div>
    );
  }

  return <>{elements}</>;
}

/** Process inline formatting: **bold**, *italic* */
function inlineFormat(text: string): React.ReactNode {
  // Split by bold (**...**) and italic (*...*)
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[2]) {
      // Bold
      parts.push(
        <strong key={match.index} style={{ fontWeight: 900 }}>
          {match[2]}
        </strong>
      );
    } else if (match[4]) {
      // Italic
      parts.push(
        <em key={match.index}>{match[4]}</em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}