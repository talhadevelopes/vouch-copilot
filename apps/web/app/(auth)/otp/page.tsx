"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Mail, 
  CheckCircle2,
  ChevronLeft,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, setAuthTokens } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { LoginResponse } from "@/lib/types";

const STEPS = [
  { n: "01", label: "Your details" },
  { n: "02", label: "Verify email" },
  { n: "03", label: "Set password" },
];

export default function OTPVerifyPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const router = useRouter();
  const email = useAuthStore((state) => state.pendingEmail);
  const name = useAuthStore((state) => state.pendingName);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);

  useEffect(() => {
    if (!email) {
      router.replace("/register");
      return;
    }
    startTimer();
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [email, router]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(30);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = text[i] || "";
    setOtp(next);
    const focus = Math.min(text.length, 5);
    setTimeout(() => inputRefs.current[focus]?.focus(), 0);
  };

  const otpVerifyMutation = useMutation({
    mutationFn: async (values: { email: string; code: string; name?: string | null }) =>
      apiFetch<LoginResponse>("/auth/otp/verify", {
        method: "POST",
        body: values,
      }),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setVerified(true);
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length < 6 || otpVerifyMutation.isPending || !email) return;
    setError(null);
    otpVerifyMutation.mutate({ email, code, name });
  };

  const resend = () => {
    if (countdown > 0) return;
    setOtp(["", "", "", "", "", ""]);
    startTimer();
    // In real app, call resend API here
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const filled = otp.filter(v => v !== "").length;
  const currentStep = verified ? 3 : 2;

  if (!email) return null;

  return (
    <div className="auth-page" style={{ minHeight: "100vh", width: "100%", fontFamily: "'Cabinet Grotesk', sans-serif", background: "#ffffff", display: "flex", overflow: "hidden" }}>
      <style>{`
        @font-face {
          font-family: 'Cabinet Grotesk';
          src: url('https://cdn.fontshare.com/wf/J6PPRPKWXDUIYA47IXLEQB4R4OPVYDQH/N2ZXAXWEHVMLISD2TIXJC7EF4GOY43L4/NXM4Z4TDCMYWBZ7AVI2N6DQ5VMWNENMU.woff2') format('woff2');
          font-weight: 400;
          font-display: swap;
          font-style: normal;
        }
        @font-face {
          font-family: 'Cabinet Grotesk';
          src: url('https://cdn.fontshare.com/wf/CKQBK2QBTCDREE7L3MXZ3PPW7LDNJCWU/OTOY7FQFSFOJVZKJWKO2EHUJLOGBDN4Q/4CO2ETY7NITKLUDKMYJ75RHJSPHOJ7XT.woff2') format('woff2');
          font-weight: 500;
          font-display: swap;
          font-style: normal;
        }
        @font-face {
          font-family: 'Cabinet Grotesk';
          src: url('https://cdn.fontshare.com/wf/XMXWOHABYLQDJ42L65EFRYNVRY37HQCB/B2O4O6V3JMFM2WDCYQI3A47L5U4THDUL/WN5274VQ3AUBDFP74GB4EC4XYJ3EKVNE.woff2') format('woff2');
          font-weight: 700;
          font-display: swap;
          font-style: normal;
        }
        @font-face {
          font-family: 'Cabinet Grotesk';
          src: url('https://cdn.fontshare.com/wf/ZX6AQLSFYVDPN2URWO2MQFGTYYOHIS64/TPYPKOYWFQVNJHLLRXD4KFYX4LUOUW4Z/6QH2ALVTTK7IRVO5MYOQQ3OZNXW5SSS3.woff2') format('woff2');
          font-weight: 800;
          font-display: swap;
          font-style: normal;
        }

        @keyframes vr-sp  { to{transform:rotate(360deg)} }
        @keyframes vr-ck  { 0%{transform:scale(.3);opacity:0} 65%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }

        .otp-box{transition:border-color .18s,box-shadow .18s,background .18s;outline:none!important;font-family:'Cabinet Grotesk',sans-serif;text-align:center;caret-color:#dc2626}
        .otp-box:focus{border-color:#dc2626!important;box-shadow:0 0 0 3px rgba(220,38,38,.11)!important;background:#fff!important}

        .vr-btn{transition:all .2s cubic-bezier(.4,0,.2,1)}
        .vr-btn:hover:not(:disabled){background:#b91c1c!important;transform:translateY(-1px)!important;box-shadow:0 8px 22px rgba(220,38,38,.22)!important}
        .vr-btn:active:not(:disabled){transform:translateY(0)!important}

        .vr-lnk{transition:color .15s}
        .vr-lnk:hover{color:#dc2626!important}

        .vr-sp{animation:vr-sp .7s linear infinite}
        .vr-ck{animation:vr-ck .45s cubic-bezier(.4,0,.2,1) forwards}

        .step-dot{transition:all .3s ease}
        .resend-btn{transition:color .15s}
        .resend-btn:hover:not(:disabled){color:#b91c1c!important}

        @media (max-width: 1024px) {
          .left-strip { display: none !important; }
          .right-panel { display: none !important; }
        }
      `}</style>

      {/* ── LEFT STRIP ── */}
      <div className="left-strip" style={{ width: "80px", background: "#f7f6f3", borderRight: "1px solid #ebebea", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", flexShrink: 0 }}>
        {STEPS.map(({ n, label }, i) => {
          const idx = i + 1;
          const active = currentStep === idx;
          const done = currentStep > idx;
          return (
            <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {i > 0 && <div style={{ width: "1px", height: "32px", background: done || active ? "#dc2626" : "#e0deda", transition: "background .4s" }} />}
              <div className="step-dot" style={{ width: "36px", height: "36px", borderRadius: "50%", background: done ? "#dc2626" : "#fff", border: `2px solid ${done || active ? "#dc2626" : "#e0deda"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {done
                  ? <CheckCircle2 size={13} color="#fff" />
                  : <span style={{ fontSize: "10px", fontWeight: 800, color: active ? "#dc2626" : "#c0c5ce", letterSpacing: "-0.02em" }}>{n}</span>
                }
              </div>
              {i < STEPS.length - 1 && <div style={{ width: "1px", height: "32px", background: done ? "#dc2626" : "#e0deda", transition: "background .4s" }} />}
              <span style={{ fontSize: "9px", fontWeight: 700, color: active || done ? "#dc2626" : "#b0b5be", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "6px", writingMode: "vertical-rl", transform: "rotate(180deg)", lineHeight: 1 }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div className="auth-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", borderBottom: "1px solid #ebebea" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: "12px", letterSpacing: "-0.05em" }}>V</span>
              </div>
              <span style={{ color: "#111827", fontWeight: 800, fontSize: "16px", letterSpacing: "-0.05em" }}>Vouch</span>
            </Link>
            <span style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,.2)", color: "#dc2626", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: "100px", padding: "2px 8px" }}>Beta</span>
          </div>
          <p style={{ color: "#9ca3af", fontSize: "13px", fontWeight: 500, margin: 0 }}>
            Already registered?{" "}
            <Link href="/login" className="vr-lnk" style={{ color: "#374151", fontWeight: 700, textDecoration: "none" }}>Sign in →</Link>
          </p>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex" }}>

          {/* Form area */}
          <div className="auth-form-wrap" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px" }}>
            <div style={{ width: "100%", maxWidth: "400px" }}>
              <AnimatePresence mode="wait">
                {verified ? (
                  <motion.div 
                    key="verified" 
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -28 }}
                    style={{ textAlign: "center" }}
                  >
                    <div className="vr-ck" style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#fef2f2", border: "2px solid #dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                      <CheckCircle2 size={32} color="#dc2626" />
                    </div>
                    <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "28px", letterSpacing: "-0.04em", marginBottom: "10px" }}>Email verified!</h2>
                    <p style={{ color: "#9ca3af", fontSize: "14px", fontWeight: 500, lineHeight: "1.7", marginBottom: "26px" }}>
                      <span style={{ color: "#111827", fontWeight: 700 }}>{email}</span> has been confirmed.<br />
                      Let's set up your password next.
                    </p>
                    <button 
                      className="vr-btn" 
                      onClick={() => router.push("/set-password")} 
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#dc2626", border: "none", borderRadius: "12px", padding: "14px", color: "#fff", fontWeight: 800, fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Continue to password <ArrowRight size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="otp"
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -28 }}
                  >
                    <div style={{ marginBottom: "28px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <Sparkles size={12} color="#dc2626" />
                        <span style={{ color: "#dc2626", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Step 2 of 3</span>
                      </div>
                      <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "30px", letterSpacing: "-0.04em", lineHeight: "1.1", marginBottom: "7px" }}>
                        Check your<br />inbox.
                      </h2>
                      <p style={{ color: "#9ca3af", fontSize: "14px", fontWeight: 500, lineHeight: "1.65", margin: 0 }}>
                        We sent a 6-digit code to<br />
                        <span style={{ color: "#111827", fontWeight: 700 }}>{email}</span>
                      </p>
                    </div>

                    {/* OTP Boxes */}
                    <div style={{ marginBottom: "8px" }}>
                      <label style={{ display: "block", color: "#374151", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "12px" }}>Verification code</label>
                      <div style={{ display: "flex", gap: "9px", justifyContent: "center" }}>
                        {otp.map((v, i) => (
                          <input
                            key={i}
                            // @ts-ignore
                            ref={el => inputRefs.current[i] = el}
                            className="otp-box"
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={v}
                            onChange={e => handleChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            onPaste={handlePaste}
                            autoComplete="one-time-code"
                            style={{
                              width: "52px", height: "62px", borderRadius: "12px",
                              background: v ? "#fff" : "#f9f9f7",
                              border: `1.5px solid ${v ? "#dc2626" : "#e5e5e3"}`,
                              fontSize: "26px", fontWeight: 800, color: "#111827",
                              boxSizing: "border-box",
                            }}
                          />
                        ))}
                      </div>
                      <p style={{ color: "#c0c5ce", fontSize: "11px", fontWeight: 600, textAlign: "center", marginTop: "8px", letterSpacing: "0.03em" }}>
                        Paste your code or type each digit
                      </p>
                    </div>

                    {/* Progress dots + counter */}
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", gap: "5px" }}>
                        {otp.map((v, i) => (
                          <div key={i} style={{ flex: 1, height: "3px", borderRadius: "100px", background: v ? "#dc2626" : "#e5e5e3", transition: "background .2s" }} />
                        ))}
                      </div>
                      <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, textAlign: "right", marginTop: "5px" }}>{filled}/6 digits entered</p>
                    </div>

                    {/* Timer + Resend */}
                    <div style={{ marginBottom: "18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#f9f9f7", borderRadius: "10px", border: "1px solid #ebebea" }}>
                        <Clock size={13} color="#9ca3af" />
                        <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>
                          Code expires in{" "}
                          <span style={{ color: "#111827", fontWeight: 700 }}>{countdown > 0 ? `${countdown}s` : "a few minutes"}</span>
                        </span>
                        <div style={{ flex: 1 }} />
                        {countdown === 0 ? (
                          <button className="resend-btn" onClick={resend} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 700, fontSize: "12px", fontFamily: "inherit", padding: 0 }}>
                            Resend code
                          </button>
                        ) : (
                          <span style={{ color: "#c0c5ce", fontWeight: 700, fontSize: "12px" }}>Resend in {countdown}s</span>
                        )}
                      </div>
                    </div>

                    {/* Submit */}
                    <div>
                      <button 
                        className="vr-btn" 
                        onClick={handleVerify} 
                        disabled={filled < 6 || otpVerifyMutation.isPending} 
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#dc2626", border: "none", borderRadius: "12px", padding: "14px", color: "#fff", fontWeight: 800, fontSize: "15px", cursor: filled < 6 || otpVerifyMutation.isPending ? "not-allowed" : "pointer", opacity: filled < 6 ? 0.55 : 1, fontFamily: "inherit" }}
                      >
                        {otpVerifyMutation.isPending
                          ? <><Zap className="vr-sp" size={16} />Verifying…</>
                          : <>Verify code <ArrowRight size={16} /></>
                        }
                      </button>
                    </div>

                    {error && (
                      <p style={{ color: '#dc2626', fontSize: '12px', fontWeight: 700, marginTop: '16px', textAlign: 'center' }}>{error}</p>
                    )}

                    <div style={{ textAlign: "center", marginTop: "14px" }}>
                      <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontWeight: 500, fontSize: "12px", fontFamily: "inherit" }}>
                        <ChevronLeft size={14} /> Back to details
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right panel */}
          <div className="right-panel" style={{ width: "320px", borderLeft: "1px solid #ebebea", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#fafaf8", flexShrink: 0 }}>
            <motion.div 
              key={verified ? "done" : "otp"}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div style={{ color: "#dc2626", fontWeight: 800, fontSize: "96px", lineHeight: 1, letterSpacing: "-0.06em", opacity: 0.12, marginBottom: "4px", userSelect: "none" }}>
                {verified ? "✓" : "02"}
              </div>
              <div style={{ color: "#111827", fontWeight: 800, fontSize: "18px", letterSpacing: "-0.03em", marginBottom: "12px" }}>
                {verified ? "Verified!" : "Verify email"}
              </div>
              <p style={{ color: "#9ca3af", fontSize: "13px", fontWeight: 500, lineHeight: "1.75" }}>
                {verified
                  ? "Your email is confirmed. Next — set a strong password to protect your account."
                  : "Check your inbox for a 6-digit code. It expires in 10 minutes. Check spam if you don't see it."}
              </p>

              {!verified && (
                <div style={{ marginTop: "24px", padding: "16px", background: "#fff", border: "1px solid #ebebea", borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ width: "32px", height: "32px", background: "#fef2f2", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Mail size={14} color="#dc2626" />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>Check these folders</span>
                  </div>
                  {["Inbox", "Spam / Junk", "Promotions tab"].map(folder => (
                    <div key={folder} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>{folder}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Step progress bar */}
            <div style={{ display: "flex", gap: "6px", marginTop: "32px" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: "4px", borderRadius: "100px", background: i <= 2 ? "#dc2626" : "#e5e5e3", flex: i === 2 ? 2 : 1, transition: "all .35s ease" }} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}