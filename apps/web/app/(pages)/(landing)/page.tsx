"use client";

import { motion } from "framer-motion";
import {
  Chrome,
  CheckCircle,
  MessageSquare,
  Shield,
  MousePointer,
  Eye,
  PenTool,
  Clock,
  Zap,
  Search,
  Settings,
  X,
  ArrowRight,
  LogIn,
  LogInIcon
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const TICKER_ITEMS = [
  "Fact Check", "Beat Bias", "Chat with Articles",
  "Verify Claims", "Detect Spin", "Read Smarter",
  "Stay Informed", "No Guesswork"
];

const FEATURES = [
  { icon: <MessageSquare size={24} color="#dc2626" />, title: "Conversational Chat", desc: "Ask anything about the article — summaries, context, follow-ups." },
  { icon: <Shield size={24} color="#dc2626" />, title: "Fact Verification", desc: "Claims scanned live against the web. Verified, contradicted, or flagged." },
  { icon: <MousePointer size={24} color="#dc2626" />, title: "Vouch This", desc: "Select any text, right-click, verify that exact claim instantly." },
  { icon: <Eye size={24} color="#dc2626" />, title: "Bias Detection", desc: "Loaded language, spin, and opinion-as-fact — all surfaced." },
  { icon: <PenTool size={24} color="#dc2626" />, title: "Live Highlights", desc: "Click a flagged claim in the sidebar to jump to it on the page." },
  { icon: <Clock size={24} color="#dc2626" />, title: "Chat History", desc: "Sessions saved per article for 72 hours. Resume anytime." },
  { icon: <Zap size={24} color="#dc2626" />, title: "Auto Extraction", desc: "Strips ads, popups, clutter. Only the words that matter." },
  { icon: <Search size={24} color="#dc2626" />, title: "Deep Q&A", desc: "Find quotes, explain jargon, get background on any story." }
];

const IMAGES = [
  { src: "/chat-interface.png", label: "Chat Interface" },
  { src: "/verify-1.png", label: "Fact Verification" },
  { src: "/bias-1.png", label: "Bias Analysis" },
  { src: "/vouch-that.png", label: "Vouch This" },
  { src: "/verify-2.png", label: "Live Highlights" },
  { src: "/history.png", label: "Chat History" },
  { src: "/bias-2.png", label: "Page Extraction" },
];

export default function HomePage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const updateGallery = (idx: number) => {
    if (isFading || idx === activeIdx) return;
    setIsFading(true);
    setTimeout(() => {
      setActiveIdx(idx);
      setIsFading(false);
    }, 200);
    resetAutoPlay();
  };

  const nextImage = () => updateGallery((activeIdx + 1) % IMAGES.length);
  const prevImage = () => updateGallery((activeIdx - 1 + IMAGES.length) % IMAGES.length);

  const resetAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(nextImage, 7500);
  };

  useEffect(() => {
    resetAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [activeIdx]);

  const fadeIn = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.65, ease: "easeOut" }
  };

  return (
    <div className="landing-page" style={{
      background: "#ffffff",
      color: "#111827",
      fontFamily: "'Cabinet Grotesk', sans-serif",
      overflowX: "hidden",
      WebkitFontSmoothing: "antialiased"
    }}>
      {/* Navigation */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        background: "#dc2626",
        borderBottom: "1px solid #b91c1c",
        padding: "0 48px",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="Vouch" style={{ height: "44px", width: "auto", display: "block", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        </div>
        <div className="hidden md:flex" style={{ gap: "36px" }}>
          <a href="#features" style={{ fontWeight: 500, fontSize: "15px", color: "rgba(255,255,255,0.85)", transition: "color .15s ease" }}>Features</a>
          <a href="#screenshots" style={{ fontWeight: 500, fontSize: "15px", color: "rgba(255,255,255,0.85)", transition: "color .15s ease" }}>Screenshots</a>
          <a href="#stack" style={{ fontWeight: 500, fontSize: "15px", color: "rgba(255,255,255,0.85)", transition: "color .15s ease" }}>Stack</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="/login" className="cta-primary" style={{
            background: "#ffffff", color: "#dc2626", fontWeight: 800, borderRadius: "9px",
            padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: "7px",
            transition: "all .2s ease", cursor: "pointer"
          }}>
            <LogInIcon size={18} /> Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero" style={{
        background: "#ffffff",
        padding: "0 48px",
        minHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          fontWeight: 800, fontSize: "min(22vw, 260px)", color: "rgba(0,0,0,0.02)",
          letterSpacing: "-0.05em", whiteSpace: "nowrap", pointerEvents: "none",
          userSelect: "none", lineHeight: 1, zIndex: 0
        }}>
          VOUCH
        </div>
        <div style={{ position: "absolute", top: "-8%", right: "-4%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }}></div>
        <div style={{ position: "absolute", bottom: "-10%", left: "5%", width: "380px", height: "380px", background: "radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }}></div>

        <div className="landing-hero-inner flex-col lg:flex-row" style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "40px" }}>
          <div style={{ flex: 1, maxWidth: "500px" }}>
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              style={{ fontWeight: 800, fontSize: "clamp(38px, 5vw, 64px)", lineHeight: 1.05, letterSpacing: "-0.04em", color: "#111827", marginBottom: "24px" }}
            >
              Read every article<br />
              <span style={{ color: "#dc2626" }}>like a journalist.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
              style={{ fontWeight: 400, fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.6, color: "#4b5563", maxWidth: "480px", marginBottom: "36px" }}
            >
              Vouch lives in your browser sidebar — verifying claims, detecting bias, summarising articles, and answering
              any question about what you're reading. In real time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.3 }}
              style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", marginBottom: "48px" }}
            >
              <a href="#" style={{
                background: "#dc2626", color: "#fff", borderRadius: "11px", padding: "16px 32px", fontSize: "16px",
                fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "7px", transition: "all .2s ease"
              }} className="cta-primary-lg">
                <Chrome size={20} /> Add to Chrome — Free
              </a>
              <a href="#features" style={{
                background: "transparent", color: "#4b5563", fontWeight: 500, border: "1px solid #d1d5db",
                borderRadius: "11px", padding: "16px 28px", display: "inline-block", transition: "all .2s"
              }} className="cta-secondary">
                See features &rarr;
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.4 }}
              className="landing-hero-stats flex w-full flex-row items-start justify-between gap-3 border-t border-[#e5e7eb] pt-5 sm:gap-6 lg:gap-0 lg:pt-6"
            >
              <div className="landing-stat-item min-w-0 flex-1 text-center lg:flex-none lg:border-r lg:border-[#e5e7eb] lg:pr-11 lg:mr-11 lg:pt-6 lg:text-left">
                <div className="text-lg font-extrabold leading-none text-[#dc2626] sm:text-xl lg:text-[32px]">7+</div>
                <div className="mt-1 text-[10px] font-medium text-[#6b7280] sm:text-[11px] lg:text-[13px]">Features</div>
              </div>
              <div className="landing-stat-item min-w-0 flex-1 text-center lg:flex-none lg:border-r lg:border-[#e5e7eb] lg:pr-11 lg:mr-11 lg:pt-6 lg:text-left">
                <div className="text-lg font-extrabold leading-none text-[#dc2626] sm:text-xl lg:text-[32px]">Real-time</div>
                <div className="mt-1 text-[10px] font-medium text-[#6b7280] sm:text-[11px] lg:text-[13px]">Fact-checking</div>
              </div>
              <div className="landing-stat-item min-w-0 flex-1 text-center lg:flex-none lg:pt-6 lg:text-left">
                <div className="text-lg font-extrabold leading-none text-[#dc2626] sm:text-xl lg:text-[32px]">72h</div>
                <div className="mt-1 text-[10px] font-medium text-[#6b7280] sm:text-[11px] lg:text-[13px]">Chat history</div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.5 }}
            style={{ flex: 1, display: "flex", justifyContent: "flex-end", position: "relative" }}
          >
            {/* Extension Mockup */}
            <div className="landing-mockup" style={{
              width: "400px", background: "#ffffff", borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid #e5e7eb",
              overflow: "hidden", display: "flex", flexDirection: "column", height: "580px",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}>
                            <div style={{ background: "#dc2626", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white", borderBottom: "2px solid #b91c1c" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img src="/logo.png" alt="Vouch" style={{ height: "20px", display: "block", filter: "brightness(0) invert(1)" }} />
                </div>
                <div style={{ display: "flex", gap: "12px", color: "rgba(255,255,255,0.8)" }}>
                  <Settings size={16} />
                  <X size={18} />
                </div>
              </div>
              <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ flex: 1, textAlign: "center", padding: "12px 0", fontSize: "13.5px", fontWeight: 600, color: "#6b7280", borderBottom: "2px solid transparent" }}>Scan</div>
                <div style={{ flex: 1, textAlign: "center", padding: "12px 0", fontSize: "13.5px", fontWeight: 600, color: "#6b7280", borderBottom: "2px solid transparent" }}>Bias</div>
                <div style={{ flex: 1, textAlign: "center", padding: "12px 0", fontSize: "13.5px", fontWeight: 600, color: "#dc2626", borderBottom: "2px solid #dc2626" }}>Vouch This</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
                  <div style={{ fontSize: "13px", color: "#4b5563", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <MousePointer size={12} /> Selected Claim
                  </div>
                  <div style={{ fontSize: "17px", fontWeight: 700, color: "#111827", lineHeight: 1.45 }}>
                    "OpenAI's new model uses 10x less energy than GPT-4 while scoring higher on benchmarks."
                  </div>
                </div>

                <div style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 700,
                    width: "fit-content", marginBottom: "16px", background: "#f0fdf4", color: "#16a34a",
                    border: "1px solid #bbf7d0", boxShadow: "0 1px 2px rgba(22,163,74,0.05)"
                  }}>
                    <CheckCircle size={14} /> Verified
                  </div>
                  <p style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.6, marginBottom: "24px", fontWeight: 500 }}>
                    Multiple credible tech analysts and benchmark reports confirm the new architecture achieves higher MMLU
                    scores while significantly reducing tracking compute overhead and total energy consumption per token.
                  </p>

                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.05em" }}>Sources</div>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "12px 14px", marginBottom: "10px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "250px" }}>Technical Report: Efficiency in Modern LLMs</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626" }}>arxiv.org ↗</div>
                  </div>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "12px 14px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "250px" }}>Benchmarks for Next-Gen Models</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626" }}>huggingface.co ↗</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ticker Section */}
      <div style={{ overflow: "hidden", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", padding: "13px 0" }}>
        <div className="animate-ticker" style={{ display: "flex", width: "max-content", whiteSpace: "nowrap" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "16px", padding: "0 28px", fontWeight: 700, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: i % 3 === 0 ? '#dc2626' : '#6b7280' }}>
              {t} <span style={{ color: "#d1d5db", fontSize: "16px" }}>&middot;</span>
            </span>
          ))}
        </div>
      </div>

      {/* Screenshots Section */}
      <section id="screenshots" className="landing-section" style={{ background: "#f9fafb", padding: "100px 48px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "56px" }}>
            <motion.div {...fadeIn}>
              <div style={{ fontWeight: 700, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#dc2626", marginBottom: "12px" }}>Screenshots</div>
              <h2 style={{ fontWeight: 800, fontSize: "clamp(28px, 4vw, 52px)", letterSpacing: "-0.03em", color: "#111827", lineHeight: 1.1 }}>See it in action.</h2>
            </motion.div>
            <motion.div {...fadeIn} style={{ display: "flex", gap: "10px" }}>
              <button onClick={prevImage} style={{ width: "46px", height: "46px", border: "1px solid #d1d5db", background: "transparent", borderRadius: "50%", color: "#4b5563", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s ease" }} className="arrow-btn">&larr;</button>
              <button onClick={nextImage} style={{ width: "46px", height: "46px", border: "1px solid #d1d5db", background: "transparent", borderRadius: "50%", color: "#4b5563", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s ease" }} className="arrow-btn">&rarr;</button>
            </motion.div>
          </div>

          <div
            onClick={nextImage}
            style={{
              position: "relative", borderRadius: "16px", overflow: "hidden", border: "1px solid #e5e7eb",
              background: "#fafafa", marginBottom: "16px", cursor: "pointer",
              opacity: isFading ? 0 : 1, transition: "opacity 0.2s ease"
            }}
          >
            <div style={{ position: "absolute", top: "18px", left: "18px", zIndex: 10, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "6px 14px", fontWeight: 700, fontSize: "12px", color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {IMAGES[activeIdx].label}
            </div>
            <div style={{ position: "absolute", top: "18px", right: "18px", zIndex: 10, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "6px 14px", fontWeight: 700, fontSize: "12px", color: "#4b5563" }}>
              {activeIdx + 1} / {IMAGES.length}
            </div>
            <img
              src={IMAGES[activeIdx].src}
              alt={IMAGES[activeIdx].label}
              style={{ width: "100%", aspectRatio: "16/9", objectFit: "contain", background: "#fafafa", display: "block" }}
            />
            <div onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{ position: "absolute", top: 0, bottom: 0, width: "15%", zIndex: 9, left: 0 }}></div>
            <div onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{ position: "absolute", top: 0, bottom: 0, width: "15%", zIndex: 9, right: 0 }}></div>
          </div>

          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px", scrollbarWidth: "none" }}>
            {IMAGES.map((img, i) => (
              <div
                key={i}
                onClick={() => updateGallery(i)}
                style={{
                  flexShrink: 0, width: "140px", borderRadius: "10px", overflow: "hidden",
                  border: i === activeIdx ? "2px solid #dc2626" : "2px solid #e5e7eb",
                  opacity: i === activeIdx ? 1 : 0.5, transition: "all .22s ease", cursor: "pointer", background: "#fafafa"
                }}
              >
                <img src={img.src} alt={img.label} style={{ width: "100%", aspectRatio: "16/9", objectFit: "contain", display: "block" }} />
                <div style={{ padding: "6px 8px", background: "#fff", fontSize: "10px", fontWeight: 600, color: i === activeIdx ? "#dc2626" : "#6b7280", letterSpacing: "0.04em", textTransform: "uppercase" }}>{img.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "24px" }}>
            {IMAGES.map((_, i) => (
              <div
                key={i}
                onClick={() => updateGallery(i)}
                style={{
                  height: "5px", width: i === activeIdx ? "28px" : "5px", borderRadius: "3px",
                  background: i === activeIdx ? "#dc2626" : "#d1d5db", cursor: "pointer", transition: "all .3s ease"
                }}
              ></div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="landing-section landing-problem" style={{ background: "#dc2626", padding: "80px 48px", color: "#fff" }}>
        <div className="landing-problem-grid" style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <motion.div {...fadeIn}>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(28px, 4vw, 50px)", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px", color: "#fff" }}>Reading the news is broken.</h2>
            <p style={{ fontWeight: 500, fontSize: "17px", color: "rgba(255,255,255,0.85)", lineHeight: 1.75 }}>Claims go unchecked. Bias hides in plain sight. Long articles bury the point. You shouldn't need a research team just to read with confidence.</p>
          </motion.div>
          <motion.div {...fadeIn} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              { val: "1,800+", lbl: "avg. words in a news article" },
              { val: "62%", lbl: "of readers never verify a claim" },
              { val: "3×", lbl: "more manipulative language than 10 yrs ago" },
              { val: "0", lbl: "reading tools built for you. Until now." }
            ].map((stat, i) => (
              <div key={i} style={{ background: "rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "12px", padding: "22px 18px", transition: "transform .2s ease" }} className="stat-box">
                <div style={{ fontWeight: 800, fontSize: "36px", letterSpacing: "-0.03em", marginBottom: "6px" }}>{stat.val}</div>
                <div style={{ fontWeight: 500, fontSize: "12.5px", color: "rgba(255,255,255,0.8)", lineHeight: 1.55 }}>{stat.lbl}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-section" style={{ background: "#ffffff", padding: "100px 48px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
          <div style={{ marginBottom: "56px" }}>
            <div style={{ fontWeight: 700, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#dc2626", marginBottom: "12px" }}>Features</div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(28px, 4vw, 52px)", letterSpacing: "-0.03em", color: "#111827", lineHeight: 1.1, maxWidth: "500px" }}>Everything you need.<br />Nothing you don't.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px, 1fr))", gap: "16px" }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: (i % 4) * 0.1 }}
                style={{ background: "#f9fafb", border: "1.5px solid #f3f4f6", borderRadius: "14px", padding: "26px 24px", cursor: "default", transition: "all .2s ease" }}
                className="feat-card"
              >
                <div style={{ width: "44px", height: "44px", background: "#fff0f0", borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", border: "1px solid #fecaca" }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "#111827", marginBottom: "8px" }}>{f.title}</div>
                <div style={{ fontWeight: 500, fontSize: "14px", color: "#6b7280", lineHeight: 1.65 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack Section */}
      <section id="stack" className="landing-section" style={{ background: "#f9fafb", padding: "100px 48px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontWeight: 700, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#dc2626", marginBottom: "12px" }}>Tech Stack</div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(28px, 4vw, 52px)", letterSpacing: "-0.03em", color: "#111827", lineHeight: 1.1 }}>Built on what works.</h2>
          </div>
          <motion.div className="landing-stack-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.2 }}
              style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "30px 28px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }}></div>
                <span style={{ fontWeight: 700, fontSize: "12px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em" }}>Extension</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontWeight: 600, fontSize: "13.5px", background: "#f3f4f6", color: "#374151", padding: "7px 14px", borderRadius: "100px", border: "1px solid #e5e7eb" }}>React 18</span>
                <span style={{ fontWeight: 600, fontSize: "13.5px", background: "#f3f4f6", color: "#374151", padding: "7px 14px", borderRadius: "100px", border: "1px solid #e5e7eb" }}>TypeScript</span>
                <span style={{ fontWeight: 600, fontSize: "13.5px", background: "#f3f4f6", color: "#374151", padding: "7px 14px", borderRadius: "100px", border: "1px solid #e5e7eb" }}>Vite</span>
                <span style={{ fontWeight: 600, fontSize: "13.5px", background: "#f3f4f6", color: "#374151", padding: "7px 14px", borderRadius: "100px", border: "1px solid #e5e7eb" }}>Mozilla Readability</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.3 }}
              style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "30px 28px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6" }}></div>
                <span style={{ fontWeight: 700, fontSize: "12px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em" }}>Server</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontWeight: 600, fontSize: "13.5px", background: "#f3f4f6", color: "#374151", padding: "7px 14px", borderRadius: "100px", border: "1px solid #e5e7eb" }}>Bun runtime</span>
                <span style={{ fontWeight: 600, fontSize: "13.5px", background: "#f3f4f6", color: "#374151", padding: "7px 14px", borderRadius: "100px", border: "1px solid #e5e7eb" }}>Hono framework</span>
                <span style={{ fontWeight: 600, fontSize: "13.5px", background: "#f3f4f6", color: "#374151", padding: "7px 14px", borderRadius: "100px", border: "1px solid #e5e7eb" }}>Google Gemini</span>
                <span style={{ fontWeight: 600, fontSize: "13.5px", background: "#f3f4f6", color: "#374151", padding: "7px 14px", borderRadius: "100px", border: "1px solid #e5e7eb" }}>Upstash Redis</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section landing-cta" style={{ background: "#ffffff", padding: "120px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "700px", height: "700px", background: "radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 65%)", pointerEvents: "none" }}></div>
        <div style={{ maxWidth: "680px", margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
          <motion.div {...fadeIn}>
            <div style={{ fontWeight: 700, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#dc2626", marginBottom: "12px" }}>Get Vouch</div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(32px, 5vw, 66px)", letterSpacing: "-0.04em", lineHeight: 1.0, color: "#111827", marginBottom: "22px" }}>Read the internet<br />on your terms.</h2>
            <p style={{ fontWeight: 500, fontSize: "18px", color: "#4b5563", lineHeight: 1.75, marginBottom: "44px" }}>Free to install. One click and your browser becomes the most powerful reading tool you've ever used.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.3 }}
            style={{ marginTop: "28px" }}
          >
            <a href="#" style={{
              background: "#dc2626", color: "#fff", padding: "18px 40px", borderRadius: "12px",
              fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "7px", transition: "all .2s ease"
            }} className="cta-primary-xl">
              <Chrome size={20} /> Add to Chrome — It's Free
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.4 }}
            style={{ display: "flex", gap: "28px", justifyContent: "center", marginTop: "36px", flexWrap: "wrap" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "14px", color: "#374151" }}><CheckCircle size={16} color="#16a34a" /> No account required</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "14px", color: "#374151" }}><CheckCircle size={16} color="#16a34a" /> Runs locally</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "14px", color: "#374151" }}><CheckCircle size={16} color="#16a34a" /> No data sold</div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb", padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/logo.png" alt="Vouch" style={{ height: "26px", width: "auto", display: "block", objectFit: "contain" }} />
        </div>
        <div style={{ fontWeight: 500, fontSize: "13px", color: "#6b7280" }}>&copy; 2025 Vouch. All rights reserved.</div>
        <div style={{ fontWeight: 500, fontSize: "13px", color: "#9ca3af" }}>React &middot; Bun &middot; Gemini AI</div>
      </footer>

      {/* Custom Global Styles for Hover effects and animations that can't be inline easily */}
      <style jsx global>{`
        .cta-primary:hover { 
          background: #fef2f2 !important; 
          transform: translateY(-2px); 
          box-shadow: 0 12px 32px rgba(0,0,0,.15); 
        }
        .cta-primary-lg:hover { 
          background: #b91c1c !important; 
          box-shadow: 0 12px 32px rgba(220,38,38,.25); 
          transform: translateY(-2px);
        }
        .cta-primary-xl:hover { 
          background: #b91c1c !important; 
          transform: translateY(-2px);
        }
        .cta-secondary:hover { 
          border-color: #9ca3af !important; 
          color: #111827 !important; 
        }
        .arrow-btn:hover { 
          background: #dc2626 !important; 
          border-color: #dc2626 !important; 
          color: #fff !important; 
        }
        .feat-card:hover { 
          background: #fff !important; 
          border-color: #dc2626 !important; 
          transform: translateY(-3px); 
          box-shadow: 0 10px 25px rgba(220,38,38,.08); 
        }
        .stat-box:hover { 
          transform: translateY(-4px); 
        }
        @keyframes ticker { 
          0%{transform:translateX(0)} 
          100%{transform:translateX(-50%)} 
        }
        .animate-ticker { 
          animation: ticker 22s linear infinite; 
        }
        .animate-ticker:hover { 
          animation-play-state: paused; 
        }
      `}</style>
    </div>
  );
}
