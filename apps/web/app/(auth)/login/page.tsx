"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Zap, MessageSquare, CheckCircle2, Chrome, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useGoogleLogin } from "@react-oauth/google";
import { apiFetch, setAuthTokens } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { LoginResponse } from "@/lib/types";

const FEATURES = [
  { icon: ShieldCheck,   label: "Real-time fact verification", sub: "Claims scanned live against the web" },
  { icon: Zap,           label: "Instant bias detection",      sub: "Loaded language surfaced automatically" },
  { icon: MessageSquare, label: "Chat with any article",       sub: "Ask anything, get answers instantly" },
];

const PILLS = ["Fact Check","Beat Bias","Verify Claims","Read Smarter","Detect Spin","Stay Informed","No Guesswork","Deep Q&A"];

export default function VouchLogin() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [focused,  setFocused]  = useState<string | null>(null);
  
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setPendingEmail = useAuthStore((state) => state.setPendingEmail);

  const loginMutation = useMutation({
    mutationFn: async (values: any) =>
      apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: values,
      }),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/dashboard");
    },
  });

  const otpRequestMutation = useMutation({
    mutationFn: async (email: string) =>
      apiFetch<{ email: string }>("/auth/otp/request", {
        method: "POST",
        body: { email },
      }),
    onSuccess: (data) => {
      setPendingEmail(data.email);
      router.push("/otp");
    },
  });

  const googleMutation = useMutation({
    mutationFn: async (accessToken: string) =>
      apiFetch<LoginResponse>("/auth/google", {
        method: "POST",
        body: { accessToken },
      }),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/dashboard");
    },
  });

  const demoLoginMutation = useMutation({
    mutationFn: async () =>
      apiFetch<LoginResponse>("/auth/demo-login", {
        method: "POST",
      }),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/dashboard");
    },
  });

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      googleMutation.mutate(tokenResponse.access_token);
    },
    onError: () => {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      loginMutation.mutate({ email, password });
    } else if (email && !password) {
      otpRequestMutation.mutate(email);
    }
  };

  const loading = loginMutation.isPending || otpRequestMutation.isPending || googleMutation.isPending || demoLoginMutation.isPending;
  const error = (loginMutation.error as Error | null)?.message || 
                (otpRequestMutation.error as Error | null)?.message || 
                (googleMutation.error as Error | null)?.message || 
                (demoLoginMutation.error as Error | null)?.message;

  return (
    <div className="login-page" style={{ minHeight:"100vh", width:"100%", display:"flex", fontFamily:"'Cabinet Grotesk', sans-serif", background:"#ffffff", overflow:"hidden" }}>

      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500,400&display=swap');

        @keyframes vl-up  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes vl-fa  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes vl-fb  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes vl-tk  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes vl-sp  { to{transform:rotate(360deg)} }
        @keyframes vl-pu  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes vl-rng { to{transform:rotate(360deg)} }
        @keyframes vl-bg  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

        .vl1{animation:vl-up .5s ease forwards .05s;opacity:0}
        .vl2{animation:vl-up .5s ease forwards .15s;opacity:0}
        .vl3{animation:vl-up .5s ease forwards .25s;opacity:0}
        .vl4{animation:vl-up .5s ease forwards .36s;opacity:0}
        .vl5{animation:vl-up .5s ease forwards .47s;opacity:0}

        .vl-fa{animation:vl-fa 5s ease-in-out infinite}
        .vl-fb{animation:vl-fb 4s ease-in-out infinite;animation-delay:.8s}
        .vl-fc{animation:vl-fa 6s ease-in-out infinite;animation-delay:1.4s}
        .vl-tk{animation:vl-tk 22s linear infinite;display:flex;width:max-content}
        .vl-tk:hover{animation-play-state:paused}
        .vl-sp{animation:vl-sp .7s linear infinite}
        .vl-pu{animation:vl-pu 2s ease-in-out infinite}
        .vl-rng{animation:vl-rng 22s linear infinite}

        .vl-feat{transition:all .2s ease;cursor:default}
        .vl-feat:hover{background:rgba(255,255,255,.18)!important;transform:translateX(4px)}

        .vl-inp{transition:border-color .2s,box-shadow .2s;outline:none!important;font-family:'Cabinet Grotesk',sans-serif}
        .vl-inp:focus{border-color:#dc2626!important;box-shadow:0 0 0 3px rgba(220,38,38,.14)!important}
        .vl-inp::placeholder{color:#9ca3af;font-family:'Cabinet Grotesk',sans-serif}

        .vl-btn{transition:all .2s cubic-bezier(.4,0,.2,1)}
        .vl-btn:hover:not(:disabled){background:#b91c1c!important;transform:translateY(-2px)!important;box-shadow:0 10px 32px rgba(220,38,38,.3)!important}
        .vl-btn:active:not(:disabled){transform:translateY(0)!important}

        .vl-goog{transition:all .2s ease;font-family:'Cabinet Grotesk',sans-serif}
        .vl-goog:hover{background:#f3f4f6!important;border-color:#9ca3af!important}

        .vl-lnk{transition:color .15s ease}
        .vl-lnk:hover{color:#dc2626!important}

        .vl-chrome{transition:all .2s ease}
        .vl-chrome:hover{border-color:#dc2626!important;color:#dc2626!important}
      `}</style>

      {/* ═══ LEFT — RED BRAND PANEL ═══ */}
      <div className="login-brand-panel" style={{
        width:"50%", display:"flex", flexDirection:"column",
        background:"#dc2626", position:"relative", overflow:"hidden"
      }}>

        {/* Dot-grid overlay */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:"radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize:"24px 24px"
        }}/>

        {/* Rotating decorative ring */}
        <div className="vl-rng" style={{
          position:"absolute", top:"25%", left:"-120px",
          width:"460px", height:"460px", borderRadius:"50%",
          border:"1px solid rgba(255,255,255,0.1)", pointerEvents:"none"
        }}/>
        <div style={{
          position:"absolute", top:"25%", left:"-80px",
          width:"320px", height:"320px", borderRadius:"50%",
          border:"1px solid rgba(255,255,255,0.06)", pointerEvents:"none"
        }}/>

        {/* Dark-red glow at top-right */}
        <div style={{
          position:"absolute", top:"-80px", right:"-80px",
          width:"300px", height:"300px", borderRadius:"50%",
          background:"rgba(0,0,0,0.12)", pointerEvents:"none"
        }}/>

        {/* Bottom strip */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"3px",
          background:"rgba(0,0,0,0.15)"
        }}/>

        {/* Logo */}
        <div style={{ position:"relative", zIndex:5, padding:"28px 40px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:"10px", textDecoration: "none" }}>
            <div style={{
              width:"36px", height:"36px", borderRadius:"10px",
              background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
              <span style={{ color:"#fff", fontWeight:900, fontSize:"15px", letterSpacing:"-0.05em" }}>V</span>
            </div>
            <span style={{ color:"#fff", fontWeight:800, fontSize:"20px", letterSpacing:"-0.05em" }}>Vouch</span>
          </Link>
          <span style={{
            background:"rgba(0,0,0,0.15)", border:"1px solid rgba(255,255,255,0.2)",
            color:"rgba(255,255,255,0.9)", fontSize:"10px", fontWeight:700,
            letterSpacing:"0.1em", textTransform:"uppercase",
            borderRadius:"100px", padding:"4px 12px"
          }}>Beta</span>
        </div>

        {/* Main content */}
        <div style={{ position:"relative", zIndex:5, flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 40px" }}>

          {/* Badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"7px",
            background:"rgba(0,0,0,0.15)", border:"1px solid rgba(255,255,255,0.2)",
            borderRadius:"100px", padding:"5px 14px", width:"fit-content", marginBottom:"22px"
          }}>
            <span className="vl-pu" style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#fff", display:"inline-block" }}/>
            <span style={{ color:"rgba(255,255,255,0.9)", fontSize:"11px", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase" }}>Live · Now in Beta</span>
          </div>

          {/* Headline */}
          <h1 style={{
            color:"#fff", fontWeight:800, lineHeight:"0.95",
            letterSpacing:"-0.045em", marginBottom:"18px",
            fontSize:"clamp(34px, 3.8vw, 54px)"
          }}>
            Read every<br/>
            article.<br/>
            <span style={{ color:"rgba(255,255,255,0.35)", fontStyle:"italic" }}>like a</span><br/>
            journalist.
          </h1>

          <p style={{ color:"rgba(255,255,255,0.75)", fontWeight:500, fontSize:"14.5px", lineHeight:"1.75", maxWidth:"340px", marginBottom:"30px" }}>
            Vouch lives in your browser sidebar — verifying claims, detecting bias, and answering any question about what you're reading. In real time.
          </p>

          {/* Features */}
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"32px" }}>
            {FEATURES.map(({ icon:Icon, label, sub }) => (
              <div key={label} className="vl-feat" style={{
                display:"flex", alignItems:"center", gap:"14px",
                background:"rgba(0,0,0,0.1)", border:"1px solid rgba(255,255,255,0.13)",
                borderRadius:"14px", padding:"12px 16px"
              }}>
                <div style={{
                  width:"36px", height:"36px", borderRadius:"10px",
                  background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0
                }}>
                  <Icon size={15} color="#fff"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#fff", fontWeight:700, fontSize:"13px" }}>{label}</div>
                  <div style={{ color:"rgba(255,255,255,0.55)", fontSize:"11.5px", fontWeight:500, marginTop:"2px" }}>{sub}</div>
                </div>
                <CheckCircle2 size={14} color="rgba(255,255,255,0.6)" style={{ flexShrink:0 }}/>
              </div>
            ))}
          </div>

          {/* Stat cards */}
          <div style={{ display:"flex", gap:"10px" }}>
            {[["7+","AI Features","vl-fa"],["Real-time","Fact Check","vl-fb"],["72h","History","vl-fc"]].map(([v,l,c]) => (
              <div key={l} className={c} style={{
                background:"rgba(0,0,0,0.12)", border:"1px solid rgba(255,255,255,0.15)",
                borderRadius:"16px", padding:"14px 16px"
              }}>
                <div style={{ color:"#fff", fontWeight:800, fontSize:"20px", letterSpacing:"-0.04em", lineHeight:1 }}>{v}</div>
                <div style={{ color:"rgba(255,255,255,0.55)", fontSize:"10px", fontWeight:600, marginTop:"4px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticker */}
        <div style={{ position:"relative", zIndex:5, borderTop:"1px solid rgba(0,0,0,0.12)", padding:"11px 0", overflow:"hidden" }}>
          <div className="vl-tk">
            {[...PILLS, ...PILLS, ...PILLS].map((p, i) => (
              <span key={i} style={{
                display:"inline-flex", alignItems:"center", gap:"10px",
                padding:"0 18px", color: i % 4 === 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                fontSize:"10px", fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.1em", whiteSpace:"nowrap"
              }}>
                {p}<span style={{ color:"rgba(255,255,255,0.25)" }}>·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — FORM PANEL ═══ */}
      <div className="login-form-panel" style={{
        flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"40px 32px", background:"#ffffff", position:"relative"
      }}>

        {/* Subtle background blush */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(ellipse at 60% 30%, rgba(220,38,38,0.04) 0%, transparent 60%)"
        }}/>

        <div style={{ width:"100%", maxWidth:"390px", position:"relative", zIndex:2 }}>

          {/* Heading */}
          <div className="vl1" style={{ marginBottom:"28px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"10px" }}>
              <Sparkles size={13} color="#dc2626"/>
              <span style={{ color:"#dc2626", fontSize:"11px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Welcome back</span>
            </div>
            <h2 style={{ color:"#111827", fontWeight:800, fontSize:"30px", letterSpacing:"-0.04em", lineHeight:"1.1", marginBottom:"7px" }}>
              Sign in to<br/>your account.
            </h2>
            <p style={{ color:"#6b7280", fontSize:"14px", fontWeight:500, lineHeight:"1.65" }}>
              Read the internet on your terms.
            </p>
          </div>

          {/* Google */}
          <div className="vl2" style={{ marginBottom:"18px" }}>
            <button 
              type="button"
              onClick={() => googleLogin()}
              disabled={loading}
              className="vl-goog" style={{
                width:"100%", display:"flex", alignItems:"center",
                justifyContent:"center", gap:"10px",
                background:"#ffffff", border:"1px solid #e5e7eb",
                borderRadius:"12px", padding:"13px 16px",
                color:"#374151", fontWeight:600, fontSize:"14px", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}>
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="vl2" style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"18px" }}>
            <div style={{ flex:1, height:"1px", background:"#e5e7eb" }}/>
            <span style={{ color:"#9ca3af", fontSize:"11px", fontWeight:600 }}>or continue with email</span>
            <div style={{ flex:1, height:"1px", background:"#e5e7eb" }}/>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="vl3" style={{ display:"flex", flexDirection:"column", gap:"14px", marginBottom:"18px" }}>

              {/* Email */}
              <div>
                <label style={{ display:"block", color:"#374151", fontSize:"11px", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"7px" }}>
                  Email address
                </label>
                <input
                  className="vl-inp"
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  style={{
                    width:"100%", boxSizing:"border-box",
                    background: focused==="email" ? "#ffffff" : "#f9fafb",
                    border:`1.5px solid ${focused==="email" ? "#dc2626" : "#e5e7eb"}`,
                    borderRadius:"11px", padding:"12px 15px",
                    color:"#111827", fontSize:"14px", fontWeight:500
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"7px" }}>
                  <label style={{ color:"#374151", fontSize:"11px", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Password</label>
                  <a href="#" className="vl-lnk" style={{ color:"#dc2626", fontSize:"12px", fontWeight:600, textDecoration:"none" }}>Forgot password?</a>
                </div>
                <div style={{ position:"relative" }}>
                  <input
                    className="vl-inp"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onFocus={() => setFocused("pw")}
                    onBlur={() => setFocused(null)}
                    style={{
                      width:"100%", boxSizing:"border-box",
                      background: focused==="pw" ? "#ffffff" : "#f9fafb",
                      border:`1.5px solid ${focused==="pw" ? "#dc2626" : "#e5e7eb"}`,
                      borderRadius:"11px", padding:"12px 44px 12px 15px",
                      color:"#111827", fontSize:"14px", fontWeight:500
                    }}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{
                    position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", cursor:"pointer",
                    color:"#9ca3af", display:"flex", padding:"2px"
                  }}>
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                <p style={{ color:"#9ca3af", fontSize:"11px", fontWeight:500, marginTop:"6px" }}>
                  Leave password empty to login with OTP
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="vl4">
              <button type="submit" disabled={loading} className="vl-btn" style={{
                width:"100%", display:"flex", alignItems:"center",
                justifyContent:"center", gap:"8px",
                background:"#dc2626", border:"none",
                borderRadius:"12px", padding:"14px 20px",
                color:"#fff", fontWeight:800, fontSize:"15px",
                letterSpacing:"-0.01em", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, fontFamily:"inherit"
              }}>
                {loading ? (
                  <>
                    <svg className="vl-sp" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>Sign in <ArrowRight size={16}/></>
                )}
              </button>

              <button 
                type="button" 
                onClick={() => demoLoginMutation.mutate()}
                disabled={loading} 
                className="vl-goog" 
                style={{
                  width:"100%", display:"flex", alignItems:"center",
                  justifyContent:"center", gap:"8px",
                  background:"#ffffff", border:"1.5px solid #dc2626",
                  borderRadius:"12px", padding:"13px 20px",
                  color:"#dc2626", fontWeight:800, fontSize:"14px",
                  marginTop: "12px", cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1, fontFamily:"inherit"
                }}>
                <Sparkles size={16} /> Continue as Demo user
              </button>
            </div>
          </form>

          {/* Sign up */}
          <div className="vl5" style={{
            marginTop:"20px", paddingTop:"18px",
            borderTop:"1px solid #f3f4f6", textAlign:"center"
          }}>
            <p style={{ color:"#6b7280", fontSize:"13px", fontWeight:500 }}>
              No account?{" "}
              <Link href="/register" className="vl-lnk" style={{ color:"#111827", fontWeight:700, textDecoration:"none" }}>Create one free →</Link>
            </p>
          </div>

          {error && (
            <p className="vl5" style={{ color: '#dc2626', fontSize: '12px', fontWeight: 700, marginTop: '16px', textAlign: 'center' }}>{error}</p>
          )}

          <p className="vl5" style={{ textAlign:"center", color:"#9ca3af", fontSize:"11px", fontWeight:500, marginTop:"14px" }}>
            By signing in you agree to our{" "}
            <a href="#" style={{ color:"#9ca3af", textDecoration:"underline" }}>Terms</a>
            {" "}&amp;{" "}
            <a href="#" style={{ color:"#9ca3af", textDecoration:"underline" }}>Privacy</a>
          </p>

        </div>
      </div>
    </div>
  );
}
