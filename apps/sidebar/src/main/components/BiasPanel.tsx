import React from 'react';
import type { AnalysisResult } from '../utils/types';
import { highlightOnPage } from '../utils/highlight';

interface BiasPanelProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

export const BiasPanel: React.FC<BiasPanelProps> = ({ analysis, isAnalyzing }) => {
  if (isAnalyzing && !analysis) {
    return (
      <div className="v-card-outlined" style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '0.85rem' }}>
        Analyzing language and bias...
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div style={{ paddingBottom: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="v-bias-score-card">
        <div className="v-bias-score-content">
          <div className="v-bias-score-label">Bias Score</div>
          <div className="v-bias-score-value">
            <span className="v-bias-score-num">{analysis.biasScore}</span>
            <span className="v-bias-score-denom">/ 100</span>
          </div>
          <div className="v-bias-tone">{analysis.overallTone}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <h4 className="v-section-label">Dominant Tone</h4>
          <div className="v-tone-chip">{analysis.overallTone}</div>
        </div>

        <div>
          <h4 className="v-section-label">Manipulation Techniques</h4>
          {analysis.manipulativeLanguage.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analysis.manipulativeLanguage.map((item, i) => (
                <div
                  key={i}
                  className="v-bias-tag-clickable"
                  onClick={() => highlightOnPage(item.sentence)}
                  title="Click to highlight on page"
                >
                  <p className="v-bias-tag-sentence">"{item.sentence}"</p>
                  <p className="v-bias-tag-reason">{item.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="v-tone-chip" style={{ color: '#6b7280' }}>
              No manipulation techniques detected.
            </div>
          )}
        </div>
      </div>

      {analysis.opinionAsFact.length > 0 && (
        <div>
          <h3 className="v-section-label">Opinions as Facts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analysis.opinionAsFact.map((item, i) => (
              <div
                key={i}
                className="v-opinion-card"
                onClick={() => highlightOnPage(item.sentence)}
                style={{ cursor: 'pointer' }}
                title="Click to highlight on page"
              >
                <p className="v-opinion-sentence">"{item.sentence}"</p>
                <p className="v-opinion-reason">{item.reason.toUpperCase()}</p>
                <p className="v-highlight-hint">Click to highlight on page</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
