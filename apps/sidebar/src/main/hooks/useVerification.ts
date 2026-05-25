import { useState, useRef } from 'react';
import { verifyPage, analyzePage, scanFullPage, authFetch } from '../../lib/api';
import type { VerificationResult, AnalysisResult } from '../utils/types';

export function useVerification() {
  const [claims, setClaims] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verifyEnabled, setVerifyEnabled] = useState(false);
  const verifyEnabledRef = useRef(false);

  const startFullScan = async (
    content: string,
    url: string,
    title: string,
    loadId: number,
    pageLoadIdRef: React.MutableRefObject<number>,
    existingHistory?: ChatMessage[]
  ) => {
    setIsVerifying(true);
    setIsAnalyzing(true);
    setClaims([]);
    setAnalysis(null);

    try {
      const { data } = await scanFullPage(content, url);

      if (pageLoadIdRef.current !== loadId) return null;

      const { claims: scanClaims, analysis: scanAnalysis } = data;

      setClaims(scanClaims || []);
      setAnalysis(scanAnalysis || null);

      // Sync to dashboard with the full rich data
      let remoteId: string | undefined;
      try {
        const syncRes = await authFetch('/dashboard/analysis', {
          method: 'POST',
          body: JSON.stringify({
            inputUrl: url,
            pageTitle: title,
            aiResponse: scanAnalysis?.overallTone,
            proof: scanAnalysis?.overallTone, // Using overallTone as proof if no specific manipulative lang is found
            biasScore: scanAnalysis?.biasScore,
            claimsData: scanClaims,
            biasData: scanAnalysis,
            chatHistory: existingHistory?.map(m => ({ sender: m.sender === 'vouch' ? 'assistant' : m.sender, text: m.text }))
          }),
        });
        
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          remoteId = syncData?.data?.item?.id;
        }
      } catch (err) {
        console.error('Failed to sync extension scan to dashboard:', err);
      }

      return { claims: scanClaims, analysis: scanAnalysis, remoteId };
    } catch (error) {
      console.error('Full scan failed:', error);
      return null;
    } finally {
      if (pageLoadIdRef.current === loadId) {
        setIsVerifying(false);
        setIsAnalyzing(false);
      }
    }
  };


  const startVerification = async (content: string, url: string, loadId: number, pageLoadIdRef: React.MutableRefObject<number>) => {
    setIsVerifying(true);
    setClaims([]);

    try {
      const { data } = await verifyPage(content, url);
      let parsedResults: VerificationResult[] = [];
      
      if (typeof data === 'string') {
        // Handle Newline-Delimited JSON (NDJSON)
        parsedResults = data
          .split('\n')
          .filter((l) => l.trim())
          .map((l) => {
            try {
              return JSON.parse(l) as VerificationResult;
            } catch (e) {
              console.warn("Failed to parse verification line:", l);
              return null;
            }
          })
          .filter((r): r is VerificationResult => r !== null);
      } else if (Array.isArray(data)) {
        parsedResults = data as VerificationResult[];
      } else if (data && typeof data === 'object' && 'claim' in data) {
        // Handle single object response
        parsedResults = [data as VerificationResult];
      }

      if (pageLoadIdRef.current !== loadId) return;
      
      const validClaims = parsedResults.filter((r) => r && r.claim);
      console.log("Verified claims:", validClaims);
      setClaims(validClaims);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      if (pageLoadIdRef.current === loadId) setIsVerifying(false);
    }
  };

  const startAnalysis = async (content: string, url: string, loadId: number, pageLoadIdRef: React.MutableRefObject<number>) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const { data } = await analyzePage(content, url);
      if (pageLoadIdRef.current !== loadId) return;
      setAnalysis(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      if (pageLoadIdRef.current === loadId) setIsAnalyzing(false);
    }
  };

  const handleVerifyToggle = () => {
    const newValue = !verifyEnabled;
    setVerifyEnabled(newValue);
    verifyEnabledRef.current = newValue;
    chrome.storage.sync.set({ verifyEnabled: newValue });
  };

  const reset = () => {
    setClaims([]);
    setIsVerifying(false);
    setAnalysis(null);
    setIsAnalyzing(false);
  };

  return {
    claims,
    isVerifying,
    analysis,
    isAnalyzing,
    verifyEnabled,
    setVerifyEnabled,
    verifyEnabledRef,
    startVerification,
    startAnalysis,
    handleVerifyToggle,
    reset,
    startFullScan,
  };
}