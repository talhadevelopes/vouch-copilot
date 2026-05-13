import React, { useState, useRef, useEffect } from 'react';
import { renderMarkdown } from './Markdown';
import type { ChatMessage, StreamEvent } from '../utils/types';
import { authFetch } from '../../lib/api';
import { sendRuntimeMessage } from '../../utils/runtime-messages';

interface ChatPanelProps {
  pageContent: string;
  computeSourceSentence: boolean;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  pageContent,
  computeSourceSentence,
  initialMessages,
  onMessagesChange,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingBuffer = useRef('');
  const drainInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      sourceSentence: null,
      timestamp: Date.now(),
    };

    const historyForBackend = [...messages, userMessage].map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      text: '',
      sender: 'vouch',
      sourceSentence: null,
      timestamp: Date.now(),
    };

    setMessages((prev) => {
      const next = [...prev, userMessage, assistantMessage];
      onMessagesChange?.(next);
      return next;
    });
    setInput('');
    setIsTyping(true);
    pendingBuffer.current = '';

    const startDrain = () => {
      if (drainInterval.current) return;
      drainInterval.current = setInterval(() => {
        if (!pendingBuffer.current.length) return;
        const chunk = pendingBuffer.current.slice(0, 6);
        pendingBuffer.current = pendingBuffer.current.slice(6);
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, text: m.text + chunk } : m)
        );
      }, 18);
    };

    const stopDrain = () => {
      if (drainInterval.current) {
        clearInterval(drainInterval.current);
        drainInterval.current = null;
      }
    };

    try {
      const res = await authFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userText,
          pageContent,
          messages: historyForBackend,
          stream: true,
          computeSourceSentence,
        }),
      });

      if (!res.ok) throw new Error(`Chat request failed: ${res.status} ${res.statusText}`);
      if (!res.body) throw new Error('Chat response body is empty.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalSourceSentence: string | null = null;

      const processLine = (line: string) => {
        if (!line.startsWith('data:')) return;
        const dataStr = line.slice('data:'.length).trim();
        if (!dataStr) return;

        let parsed: StreamEvent;
        try {
          parsed = JSON.parse(dataStr) as StreamEvent;
        } catch {
          return;
        }

        if (parsed?.type === 'token' && typeof parsed.text === 'string') {
          pendingBuffer.current += parsed.text;
          startDrain();
        }

        if (parsed?.type === 'final') {
          stopDrain();
          pendingBuffer.current = '';
          if (typeof parsed.sourceSentence === 'string' || parsed.sourceSentence === null) {
            finalSourceSentence = parsed.sourceSentence;
          }
          if (typeof parsed.answer === 'string') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, text: parsed.answer, sourceSentence: finalSourceSentence } : m
              )
            );
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, sourceSentence: finalSourceSentence } : m
              )
            );
          }
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let eventEnd = buffer.indexOf('\n\n');
        while (eventEnd !== -1) {
          const rawEvent = buffer.slice(0, eventEnd).trim();
          buffer = buffer.slice(eventEnd + 2);
          eventEnd = buffer.indexOf('\n\n');
          if (!rawEvent) continue;
          rawEvent.split('\n').forEach(processLine);
        }
      }

      if (buffer.trim()) buffer.trim().split('\n').forEach(processLine);

      if (finalSourceSentence) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          sendRuntimeMessage({
            type: 'HIGHLIGHT_REQUEST',
            tabId: tab.id,
            text: finalSourceSentence,
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      stopDrain();
      pendingBuffer.current = '';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, text: 'Sorry, I encountered an error while processing your request.' }
            : m
        )
      );
    } finally {
      stopDrain();
      pendingBuffer.current = '';
      setIsTyping(false);
      setMessages((prev) => {
        onMessagesChange?.(prev);
        return prev;
      });
    }
  };

  return (
    <div className="v-chat">
      <div ref={scrollRef} className="v-chat-messages">
        {messages.length === 0 && (
          <div className="v-chat-empty">Ask me anything about the article.</div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`v-msg-row ${msg.sender}`}
          >
            <div className={`v-bubble ${msg.sender}`}>
              {msg.sender === 'vouch' && !msg.text && isTyping ? (
                <div className="v-dot-spinner">
                  <div className="v-dot" />
                  <div className="v-dot" />
                  <div className="v-dot" />
                </div>
              ) : (
                msg.sender === 'vouch' ? renderMarkdown(msg.text) : msg.text
              )}
              {msg.sourceSentence && (
                <div className="v-source-indicator">HIGHLIGHTED ON PAGE</div>
              )}
            </div>
            <div className="v-msg-time">
              {msg.sender === 'user' ? 'You' : 'Vouch'} •{' '}
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>

      <div className="v-chat-input-bar">
        <form onSubmit={handleSend} className="v-chat-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="v-chat-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="v-chat-send-btn"
            title="Send"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};
