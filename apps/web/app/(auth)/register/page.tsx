"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  MessageSquare, 
  CheckCircle2,
  Mail
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

const FEATURES = [
  { icon: ShieldCheck,   label: "Real-time fact verification", sub: "Claims scanned live against the web" },
  { icon: Zap,           label: "Instant bias detection",      sub: "Loaded language surfaced automatically" },
  { icon: MessageSquare, label: "Chat with any article",       sub: "Ask anything, get answers instantly" },
];

const STEPS = [
  { n: "01", label: "Your details" },
  { n: "02", label: "Verify email" },
  { n: "03", label: "Set password" },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();
  const setPendingEmail = useAuthStore((state) => state.setPendingEmail);
  const setPendingName = useAuthStore((state) => state.setPendingName);

  const otpRequestMutation = useMutation({
    mutationFn: async (values: { email: string; name: string }) =>
      apiFetch<{ email: string }>("/auth/otp/request", {
        method: "POST",
        body: { email: values.email },
      }),
    onSuccess: (_, variables) => {
      setPendingEmail(variables.email);
      setPendingName(variables.name);
      router.push("/otp");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      otpRequestMutation.mutate({ email, name });
    }
  };

  const loading = otpRequestMutation.isPending;
  const error = (otpRequestMutation.error as Error | null)?.message;

  return (
    <div className="auth-page" style={{ minHeight: '100vh', width: '100%', display: 'flex', backgroundColor: '#ffffff', overflow: 'hidden', fontFamily: '"Cabinet Grotesk", sans-serif' }}>
      {/* LEFT STRIP - Step Progress */}
      <div className="auth-left-strip" style={{ width: '80px', backgroundColor: '#f7f6f3', borderRight: '1px solid #ebebea', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', flexShrink: 0 }}>
        {STEPS.map(({ n, label }, i) => {
          const idx = i + 1;
          const active = idx === 1;
          const done = false;
          return (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: '1px', height: '32px', backgroundColor: done || active ? '#dc2626' : '#e0deda', transition: 'background-color 0.4s' }} />}
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: '2px solid', 
                borderColor: done || active ? '#dc2626' : '#e0deda',
                backgroundColor: done ? '#dc2626' : '#ffffff',
                transition: 'all 0.3s'
              }}>
                {done ? (
                  <CheckCircle2 size={13} color="#ffffff" />
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 800, color: active ? '#dc2626' : '#c0c5ce', letterSpacing: '-0.025em' }}>{n}</span>
                )}
              </div>
              {i < STEPS.length - 1 && <div style={{ width: '1px', height: '32px', backgroundColor: done ? '#dc2626' : '#e0deda', transition: 'background-color 0.4s' }} />}
              <span style={{ 
                fontSize: '9px', 
                fontWeight: 700, 
                color: active || done ? '#dc2626' : '#b0b5be', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em', 
                marginTop: '6px',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                lineHeight: 1
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div className="auth-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', borderBottom: '1px solid #ebebea' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '12px', letterSpacing: '-0.05em' }}>V</span>
            </div>
            <span style={{ color: '#111827', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.05em' }}>Vouch</span>
            <span style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '9999px', padding: '2px 8px' }}>Beta</span>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 500 }}>
            Already registered?{" "}
            <Link href="/login" style={{ color: '#374151', fontWeight: 700, textDecoration: 'none' }} className="hover:text-vouch-red transition-colors">Sign in →</Link>
          </p>
        </div>

        <div className="auth-main-row" style={{ flex: 1, display: 'flex' }}>
          {/* Form area */}
          <div className="auth-form-wrap" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
            <motion.div 
              style={{ width: '100%', maxWidth: '400px' }}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.38 }}
            >
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Sparkles size={12} color="#dc2626" />
                  <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Step 1 of 3</span>
                </div>
                <h2 style={{ color: '#111827', fontWeight: 800, fontSize: '30px', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '8px' }}>
                  Create your<br />account.
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 500, lineHeight: 1.6 }}>
                  Enter your email to get started. No complex forms.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', color: '#374151', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Username / Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    placeholder="Your full name"
                    required
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#f9f9f7', 
                      border: '1.5px solid', 
                      borderColor: focused === "name" ? '#dc2626' : '#e5e5e3',
                      borderRadius: '12px', 
                      padding: '12px 16px', 
                      color: '#111827', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      outline: 'none', 
                      transition: 'all 0.2s',
                      boxShadow: focused === "name" ? '0 0 0 4px rgba(220, 38, 38, 0.05)' : 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#374151', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    placeholder="you@example.com"
                    required
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#f9f9f7', 
                      border: '1.5px solid', 
                      borderColor: focused === "email" ? '#dc2626' : '#e5e5e3',
                      borderRadius: '12px', 
                      padding: '12px 16px', 
                      color: '#111827', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      outline: 'none', 
                      transition: 'all 0.2s',
                      boxShadow: focused === "email" ? '0 0 0 4px rgba(220, 38, 38, 0.05)' : 'none'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={!email || !name || loading}
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#dc2626', 
                    color: '#ffffff', 
                    fontWeight: 800, 
                    borderRadius: '12px', 
                    padding: '14px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    border: 'none',
                    cursor: (email && name && !loading) ? 'pointer' : 'not-allowed',
                    opacity: (email && name && !loading) ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}
                  className="hover:bg-vouch-darkRed hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
                >
                  {loading ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap size={16} />
                      </motion.div>
                      Sending OTP...
                    </>
                  ) : (
                    <>Continue to verification <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              {error && (
                <p style={{ color: '#dc2626', fontSize: '12px', fontWeight: 700, marginTop: '16px', textAlign: 'center' }}>{error}</p>
              )}

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 500 }}>
                  By joining, you agree to our <a href="#" style={{ color: '#374151', fontWeight: 700, textDecoration: 'underline' }} className="hover:text-vouch-red">Terms</a> & <a href="#" style={{ color: '#374151', fontWeight: 700, textDecoration: 'underline' }} className="hover:text-vouch-red">Privacy</a>
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right panel - Info */}
          <div style={{ width: '320px', borderLeft: '1px solid #ebebea', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fafaf8', flexShrink: 0 }} className="hidden md:flex">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '96px', lineHeight: 1, letterSpacing: '-0.05em', opacity: 0.12, marginBottom: '4px', userSelect: 'none' }}>
                01
              </div>
              <div style={{ color: '#111827', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.025em', marginBottom: '12px' }}>
                Your details
              </div>
              <p style={{ color: '#9ca3af', fontSize: '13px', fontWeight: 500, lineHeight: 1.6, marginBottom: '24px' }}>
                Start your journey to smarter reading. We use your email to keep your history synced across devices.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {FEATURES.map(({ icon: Icon, label, sub }) => (
                  <div key={label} style={{ backgroundColor: '#ffffff', border: '1px solid #ebebea', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.2s' }} className="hover:translate-x-1">
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color="#dc2626" />
                    </div>
                    <div>
                      <div style={{ color: '#111827', fontWeight: 700, fontSize: '12px' }}>{label}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 500, marginTop: '2px' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step progress bar */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '32px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '4px', borderRadius: '9999px', transition: 'all 0.35s', backgroundColor: i === 1 ? '#dc2626' : '#e5e5e3', flex: i === 1 ? 2 : 1 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
