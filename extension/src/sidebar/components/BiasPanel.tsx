import React from 'react';
import type { AnalysisResult } from '../types';

interface BiasPanelProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

export const BiasPanel: React.FC<BiasPanelProps> = ({ analysis, isAnalyzing }) => {
  if (isAnalyzing && !analysis) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0' }}>
        <div style={{ color: '#888', fontStyle: 'italic', fontSize: '0.85rem' }}>Analyzing language and bias...</div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div style={{ paddingBottom: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          padding: '24px',
          borderRadius: '16px',
          backgroundColor: '#dc2626',
          color: '#ffffff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1, fontSize: 80, fontWeight: 900 }}>
          ⚡
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.85 }}>Bias Score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0' }}>
            <span style={{ fontSize: '48px', fontWeight: 900 }}>{analysis.biasScore}</span>
            <span style={{ fontSize: '14px', fontWeight: 900 }}>/ 100</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, lineHeight: 1.4 }}>
            {analysis.overallTone}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <h4 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 8 }}>
            Dominant Tone
          </h4>
          <div style={{ padding: '10px 12px', borderRadius: '12px', background: '#f3f4f6', color: '#374151', fontWeight: 800, fontSize: 13 }}>
            {analysis.overallTone}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 8 }}>
            Manipulation Techniques
          </h4>
          {analysis.manipulativeLanguage.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {analysis.manipulativeLanguage.map((item, i) => (
                <span
                  key={i}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: '#dc26261A',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: 900,
                    border: '1px solid #dc262633',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={item.reason}
                >
                  {item.reason}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ padding: '10px 12px', borderRadius: '12px', background: '#f3f4f6', color: '#6b7280', fontWeight: 700, fontSize: 13 }}>
              No manipulation techniques detected.
            </div>
          )}
        </div>
      </div>

      {analysis.opinionAsFact.length > 0 && (
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Opinions as Facts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analysis.opinionAsFact.map((item, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E0E0E0', borderLeft: '4px solid #ff9800', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: '#1A1A1A', lineHeight: '1.4' }}>"{item.sentence}"</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef6c00', fontWeight: 900 }}>ℹ️ {item.reason.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
