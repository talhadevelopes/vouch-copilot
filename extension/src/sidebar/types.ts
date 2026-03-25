export type VerificationResult = {
  claim: string;
  verdict: 'supported' | 'contradicted' | 'unverified';
  explanation: string;
  sources: string[];
  loading?: boolean;
}

export type AnalysisResult = {
  biasDirection: 'left' | 'right' | 'center' | 'unknown';
  biasScore: number;
  manipulativeLanguage: { sentence: string; reason: string }[];
  opinionAsFact: { sentence: string; reason: string }[];
  overallTone: string;
}
