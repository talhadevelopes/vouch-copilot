import React from 'react';
import { ClaimCard } from './ClaimCard';
import type { VerificationResult } from '../types';

interface CredibilityPanelProps {
  claims: VerificationResult[];
  isVerifying: boolean;
}

export const CredibilityPanel: React.FC<CredibilityPanelProps> = ({ claims, isVerifying }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3
          style={{
            fontSize: '12px',
            fontWeight: 900,
            color: '#6b7280',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Factual Claims
        </h3>
        {isVerifying && (
          <div style={{ display: 'flex', gap: '3px' }}>
            <div style={{ width: '4px', height: '4px', background: '#dc2626', borderRadius: '50%', animation: 'bounce 1s infinite' }}></div>
            <div style={{ width: '4px', height: '4px', background: '#dc2626', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }}></div>
            <div style={{ width: '4px', height: '4px', background: '#dc2626', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }}></div>
          </div>
        )}
      </div>
      
      {claims.length === 0 && isVerifying && (
        <div style={{ color: '#888', fontStyle: 'italic', padding: '20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0', fontSize: '0.85rem' }}>
          Searching for factual claims...
        </div>
      )}

      {claims.length === 0 && !isVerifying && (
        <div style={{ color: '#888', fontStyle: 'italic', padding: '20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0', fontSize: '0.85rem' }}>
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

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};
