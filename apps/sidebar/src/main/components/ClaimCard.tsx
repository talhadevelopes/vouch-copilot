import React from 'react';
import type { VerificationResult } from '../utils/types';
import { highlightOnPage } from '../utils/highlight';

interface ClaimCardProps {
  result: VerificationResult;
}

const getVerdictColor = (verdict: string) => {
  switch (verdict) {
    case 'supported': return '#4caf50';
    case 'contradicted': return '#dc2626';
    case 'unverified': return '#ff9800';
    default: return '#9e9e9e';
  }
};

export const ClaimCard: React.FC<ClaimCardProps> = ({ result }) => {
  if (result.loading) {
    return (
      <div className="v-claim-card-skeleton">
        <div className="v-claim-card-skeleton-line" />
        <div className="v-claim-card-skeleton-line-sm" />
      </div>
    );
  }

  const color = getVerdictColor(result.verdict);
  const verdictIcon = result.verdict === 'supported' ? '✓' : result.verdict === 'contradicted' ? '✕' : '!';

  return (
    <div className="v-claim-card">
      <div className="v-claim-card-body">
        <div
          className="v-verdict-icon"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {verdictIcon}
        </div>

        <div style={{ flex: 1 }}>
          <p
            className="v-claim-text"
            onClick={() => highlightOnPage(result.claim)}
            title="Highlight this claim on the page"
          >
            {result.claim}
          </p>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <span
              className="v-badge"
              style={{
                color: color,
                background: `${color}1A`,
                border: `1px solid ${color}26`,
              }}
            >
              {result.verdict}
            </span>
          </div>

          <p className="v-claim-explanation">{result.explanation}</p>
        </div>
      </div>

      {result.sources.length > 0 && (
        <div className="v-sources">
          <p className="v-sources-label">Sources</p>
          <div className="v-sources-list">
            {result.sources.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="v-source-link"
              >
                {new URL(url).hostname}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
