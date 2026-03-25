import React from 'react';
import type { VerificationResult } from '../types';

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
      <div style={{
        background: '#fff',
        border: '1px solid #f3f4f6',
        borderRadius: '16px',
        padding: '16px',
        animation: 'pulse 1.5s infinite ease-in-out'
      }}>
        <div style={{ height: '16px', background: '#f0f0f0', marginBottom: '10px', width: '80%', borderRadius: '4px' }}></div>
        <div style={{ height: '12px', background: '#f0f0f0', width: '40%', borderRadius: '4px' }}></div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  const color = getVerdictColor(result.verdict);
  const verdictIcon = result.verdict === 'supported' ? '✓' : result.verdict === 'contradicted' ? '✕' : '!';

  const highlightThisClaim = async () => {
    if (!result.claim) return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      chrome.runtime.sendMessage({
        type: 'HIGHLIGHT_REQUEST',
        tabId: tab.id,
        text: result.claim,
      });
    } catch (e) {
      console.error('Highlight claim failed:', e);
    }
  };

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #f3f4f6',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '14px',
            backgroundColor: color,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '16px',
            flex: '0 0 auto',
          }}
          aria-hidden="true"
        >
          {verdictIcon}
        </div>

        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: '0 0 8px 0',
              fontWeight: 900,
              fontSize: '14px',
              color: '#1A1A1A',
              lineHeight: '1.4',
              cursor: 'pointer',
            }}
            onClick={highlightThisClaim}
            title="Highlight this claim on the page"
          >
            {result.claim}
          </p>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase' as const,
                fontWeight: 900,
                color: color,
                background: `${color}1A`,
                padding: '3px 8px',
                borderRadius: '999px',
                border: `1px solid ${color}26`,
              }}
            >
              {result.verdict}
            </span>
          </div>

          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
            {result.explanation}
          </p>
        </div>
      </div>

      {result.sources.length > 0 && (
        <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '10px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.7rem', fontWeight: 800, color: '#BBB', letterSpacing: '0.5px' }}>SOURCES</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {result.sources.map((url, i) => (
              <a 
                key={i} 
                href={url} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  fontSize: '0.7rem',
                  color: '#1A1A1A',
                  fontWeight: 700,
                  textDecoration: 'none',
                  background: '#F5F5F5',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  border: '1px solid #E0E0E0',
                  transition: 'all 0.2s'
                }}
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
