import React from 'react';
import { renderMarkdown } from './Markdown';

interface SelectedClaimResultProps {
  selectedText: string;
  streamText: string;
  isVerifying: boolean;
  onDismiss: () => void;
}

export const SelectedClaimResult: React.FC<SelectedClaimResultProps> = ({
  selectedText,
  streamText,
  isVerifying,
  onDismiss,
}) => {
  if (!selectedText) return null;

  return (
    <div className="v-selected-claim">
      <button className="v-selected-claim-dismiss" onClick={onDismiss}>×</button>

      <h3 className="v-selected-claim-header">Selected Claim Verification</h3>

      <div className="v-selected-claim-quote">"{selectedText}"</div>

      {isVerifying && !streamText && (
        <div className="v-selected-claim-verifying">
          <div className="v-dot-spinner">
            <div className="v-dot" />
            <div className="v-dot" />
            <div className="v-dot" />
          </div>
          Vouching for this claim...
        </div>
      )}

      {streamText && (
        <div className="v-selected-claim-result">
          <div className="v-selected-claim-explanation">
            {renderMarkdown(streamText)}
          </div>
          {isVerifying && (
            <span className="v-typing-cursor" />
          )}
        </div>
      )}
    </div>
  );
};