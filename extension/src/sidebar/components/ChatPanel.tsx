import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'vouch';
  sourceSentence?: string | null;
  timestamp: number;
}

interface ChatPanelProps {
  pageContent: string;
  computeSourceSentence: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ pageContent, computeSourceSentence }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://vouch-server.fly.dev';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      sourceSentence: null,
      timestamp: Date.now(),
    };

    // Send full conversation history (Gemini prompt will include it).
    const historyForBackend = [...messages, userMessage].map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      text: '',
      sender: 'vouch',
      sourceSentence: null,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          pageContent,
          messages: historyForBackend,
          stream: true,
          computeSourceSentence,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.status} ${res.statusText}`);
      }
      if (!res.body) {
        throw new Error('Chat response body is empty (no streaming body).');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      let finalSourceSentence: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by a blank line.
        let eventEnd = buffer.indexOf('\n\n');
        while (eventEnd !== -1) {
          const rawEvent = buffer.slice(0, eventEnd).trim();
          buffer = buffer.slice(eventEnd + 2);
          eventEnd = buffer.indexOf('\n\n');

          if (!rawEvent) continue;

          const lines = rawEvent.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const dataStr = line.slice('data:'.length).trim();
            if (!dataStr) continue;

            let parsed: any;
            try {
              parsed = JSON.parse(dataStr);
            } catch {
              continue;
            }

            if (parsed?.type === 'token' && typeof parsed.text === 'string') {
              const tokenText = parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, text: m.text + tokenText } : m
                )
              );
            }

            if (parsed?.type === 'final') {
              if (
                typeof parsed.sourceSentence === 'string' ||
                parsed.sourceSentence === null
              ) {
                finalSourceSentence = parsed.sourceSentence;
              }

              if (typeof parsed.answer === 'string') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, text: parsed.answer, sourceSentence: finalSourceSentence }
                      : m
                  )
                );
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, sourceSentence: finalSourceSentence }
                      : m
                  )
                );
              }
            }
          }
        }
      }

      // Process any remaining buffered SSE data that may not end with "\n\n".
      const remaining = buffer.trim();
      if (remaining) {
        const lines = remaining.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const dataStr = line.slice('data:'.length).trim();
          if (!dataStr) continue;

          let parsed: any;
          try {
            parsed = JSON.parse(dataStr);
          } catch {
            continue;
          }

          if (parsed?.type === 'token' && typeof parsed.text === 'string') {
            const tokenText = parsed.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, text: m.text + tokenText } : m
              )
            );
          }

          if (parsed?.type === 'final') {
            if (
              typeof parsed.sourceSentence === 'string' ||
              parsed.sourceSentence === null
            ) {
              finalSourceSentence = parsed.sourceSentence;
            }

            if (typeof parsed.answer === 'string') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        text: parsed.answer,
                        sourceSentence: finalSourceSentence,
                      }
                    : m
                )
              );
            }
          }
        }
      }

      if (finalSourceSentence) {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.id) {
          chrome.runtime.sendMessage({
            type: 'HIGHLIGHT_REQUEST',
            tabId: tab.id,
            text: finalSourceSentence,
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorText =
        'Sorry, I encountered an error while processing your request.';
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: errorText } : m)));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '10px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px', fontSize: '0.9rem' }}>
            Ask me anything about the article.
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id}
            style={{ 
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                padding: '12px',
                borderRadius: '16px',
                fontSize: '14px',
                lineHeight: 1.5,
                background: msg.sender === 'user' ? '#dc2626' : '#f3f4f6',
                color: msg.sender === 'user' ? '#ffffff' : '#1f2937',
                borderTopRightRadius: msg.sender === 'user' ? 0 : 16,
                borderTopLeftRadius: msg.sender === 'user' ? 16 : 0,
                width: 'fit-content',
              }}
            >
              {msg.text}
              {msg.sourceSentence && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '0.75rem',
                    color: '#dc2626',
                    fontWeight: 900,
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: '5px',
                  }}
                >
                  📍 HIGHLIGHTED ON PAGE
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: '#9ca3af',
                marginTop: '4px',
                textTransform: 'uppercase',
                fontWeight: 900,
                letterSpacing: '-0.025em',
              }}
            >
              {msg.sender === 'user' ? 'You' : 'Vouch'} •{' '}
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        
      </div>

      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#ffffff',
        }}
      >
        <form onSubmit={handleSend} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            style={{
              width: '100%',
              backgroundColor: '#f3f4f6',
              borderRadius: '16px',
              padding: '12px 48px 12px 16px',
              fontSize: '14px',
              border: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            style={{
              position: 'absolute',
              right: '8px',
              padding: '8px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              borderRadius: '12px',
              border: 'none',
              cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !input.trim() || isTyping ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
            title="Send"
          >
            <span style={{ fontSize: 16, fontWeight: 900 }}>➤</span>
          </button>
        </form>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};
