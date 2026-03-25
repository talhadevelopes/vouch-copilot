import React from 'react';
import type { VerificationResult } from '../types';

interface SelectedClaimResultProps {
  result: VerificationResult | null;
  selectedText: string;
  isVerifying: boolean;
  onDismiss: () => void;
}

const getVerdictColor = (verdict: string) => {
  switch (verdict) {
    case 'supported': return '#4caf50';
    case 'contradicted': return '#dc2626';
    case 'unverified': return '#ff9800';
    default: return '#9e9e9e';
  }
};

export const SelectedClaimResult: React.FC<SelectedClaimResultProps> = ({ result, selectedText, isVerifying, onDismiss }) => {
  if (!selectedText) return null;

  return (
    <div style={{
      background: '#FFFFFF',
      border: '2px solid #dc2626',
      borderRadius: '12px',
      padding: '15px',
      marginBottom: '20px',
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
      position: 'relative',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <button 
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          color: '#BBB',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0 5px',
          fontWeight: 800
        }}
      >
        ×
      </button>

      <h3 style={{ fontSize: '0.75rem', color: '#dc2626', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px', fontWeight: 800 }}>
        SELECTED CLAIM VERIFICATION
      </h3>

      <div style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#555', marginBottom: '15px', borderLeft: '3px solid #E0E0E0', paddingLeft: '10px', lineHeight: '1.4' }}>
        "{selectedText}"
      </div>

      {isVerifying ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            <div style={{ width: '4px', height: '4px', background: '#dc2626', borderRadius: '50%', animation: 'bounce 1s infinite' }}></div>
            <div style={{ width: '4px', height: '4px', background: '#dc2626', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }}></div>
            <div style={{ width: '4px', height: '4px', background: '#dc2626', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }}></div>
          </div>
          Vouching for this claim...
        </div>
      ) : result ? (
        <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{
              fontSize: '0.7rem',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontWeight: 800,
              color: '#fff',
              background: getVerdictColor(result.verdict),
              padding: '4px 10px',
              borderRadius: '6px'
            }}>
              {result.verdict}
            </span>
          </div>
          
          <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#1A1A1A', lineHeight: '1.5', fontWeight: 600 }}>
            {result.explanation}
          </p>

          {result.sources.length > 0 && (
            <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '10px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.65rem', fontWeight: 800, color: '#BBB', letterSpacing: '0.5px' }}>SOURCES</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {result.sources.map((url, i) => (
                  <a 
                    key={i} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      fontSize: '0.65rem',
                      color: '#1A1A1A',
                      fontWeight: 700,
                      textDecoration: 'none',
                      background: '#F5F5F5',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      border: '1px solid #E0E0E0'
                    }}
                  >
                    {new URL(url).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};
