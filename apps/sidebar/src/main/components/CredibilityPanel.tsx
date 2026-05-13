import React from 'react';
import { ClaimCard } from './ClaimCard';
import type { VerificationResult } from '../utils/types';

interface CredibilityPanelProps {
  claims: VerificationResult[];
  isVerifying: boolean;
}

export const CredibilityPanel: React.FC<CredibilityPanelProps> = ({ claims, isVerifying }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="v-credibility-header">
        <h3 className="v-credibility-title">Factual Claims</h3>
        {isVerifying && (
          <div className="v-dot-spinner">
            <div className="v-dot" />
            <div className="v-dot" />
            <div className="v-dot" />
          </div>
        )}
      </div>

      {claims.length === 0 && isVerifying && (
        <div className="v-card-outlined" style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '0.85rem' }}>
          Searching for factual claims...
        </div>
      )}

      {claims.length === 0 && !isVerifying && (
        <div className="v-card-outlined" style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '0.85rem' }}>
          No specific claims detected to verify.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {claims.map((claim, index) => (
          <ClaimCard key={index} result={claim} />
        ))}

        {isVerifying && (claims.length === 0 || claims.length < 4) && (
          <ClaimCard result={{ claim: '', verdict: 'unverified', explanation: '', sources: [], loading: true }} />
        )}
      </div>
    </div>
  );
};
