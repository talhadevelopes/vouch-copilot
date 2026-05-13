/** Shared types for the Vouch extension */
export type VerificationResult = {
  claim: string;
  verdict: 'supported' | 'contradicted' | 'unverified';
  explanation: string;
  sources: string[];
  loading?: boolean;
};

export type AnalysisResult = {
  biasDirection: 'left' | 'right' | 'center' | 'unknown';
  biasScore: number;
  manipulativeLanguage: { sentence: string; reason: string }[];
  opinionAsFact: { sentence: string; reason: string }[];
  overallTone: string;
};

export type PageData = {
  title: string;
  textContent: string;
  url: string;
  wordCount: number;
  isArticle: boolean;
};

export type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'vouch';
  sourceSentence?: string | null;
  timestamp: number;
};

export type Tab = 'facts' | 'bias' | 'chat' | 'claim' | 'history';

export type StreamTokenEvent = {
  type: "token";
  text: string;
};

export type StreamFinalEvent = {
  type: "final";
  text?: string;
  answer?: string;
  sourceSentence?: string | null;
};

export type StreamEvent = StreamTokenEvent | StreamFinalEvent;