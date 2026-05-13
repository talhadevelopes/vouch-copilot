export type ApiEnvelope<T> =
  | {
      status: "success";
      message: string;
      data: T;
    }
  | {
      status: "error";
      message: string;
      error: {
        code: string;
        details?: unknown;
      };
    };

export type User = {
  id: string;
  email: string;
  name: string;
};

export type ClaimResult = {
  claim: string;
  verdict: "supported" | "contradicted" | "unverified";
  explanation: string;
  sources: string[];
};

export type BiasData = {
  biasDirection: "left" | "right" | "center" | "unknown";
  biasScore: number;
  manipulativeLanguage: { sentence: string; reason: string }[];
  opinionAsFact: { sentence: string; reason: string }[];
  overallTone: string;
};

export type VouchEntry = {
  claim: string;
  result: string;
  savedAt: number;
};

export type ChatMessage = {
  sender: "user" | "assistant";
  text: string;
};

export type HistoryItem = {
  id: string;
  inputUrl: string;
  pageTitle: string | null;
  aiResponse: string | null;
  proof: string | null;
  biasScore: number | null;
  shareId: string | null;
  createdAt: string;
  claimsData: ClaimResult[] | null;
  biasData: BiasData | null;
  chatHistory: ChatMessage[] | null;
  vouchHistory: VouchEntry[] | null;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};
