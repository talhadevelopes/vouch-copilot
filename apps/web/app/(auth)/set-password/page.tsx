"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Lock, 
  CheckCircle2, 
  Chrome,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";

const STEPS = [
  { n: "01", label: "Your details" },
  { n: "02", label: "Verify email" },
  { n: "03", label: "Set password" },
];

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState({ password: false, confirm: false });
  const [focused, setFocused] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  const mismatch = confirm && confirm !== password;

  const pwStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const strengthColor = ["", "text-red-500", "text-orange-500", "text-yellow-500", "text-green-500"][pwStrength];
  const strengthBg = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"][pwStrength];

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const setPasswordMutation = useMutation({
    mutationFn: async (password: string) =>
      apiFetch("/auth/set-password", {
        method: "POST",
        body: { password },
      }),
    onSuccess: () => {
      setDone(true);
    },
  });

  const canSubmit = !!(password && confirm && password === confirm && agreed && !setPasswordMutation.isPending && pwStrength >= 2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setPasswordMutation.mutate(password);
  };

  const currentStep = done ? 4 : 3;

  if (!user) return null;

  return (
    <div className="auth-page min-h-screen w-full flex bg-white overflow-hidden font-cabinet">
      {/* LEFT STRIP - Step Progress */}
      <div className="auth-left-strip w-20 bg-[#f7f6f3] border-r border-[#ebebea] flex flex-col items-center justify-center py-8 shrink-0">
        {STEPS.map(({ n, label }, i) => {
          const idx = i + 1;
          const active = currentStep === idx;
          const doneStep = currentStep > idx;
          return (
            <div key={n} className="flex flex-col items-center">
              {i > 0 && <div className={`w-px h-8 ${doneStep || active ? "bg-vouch-red" : "bg-[#e0deda]"} transition-colors duration-400`} />}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${doneStep || active ? "border-vouch-red" : "border-[#e0deda]"} ${doneStep ? "bg-vouch-red" : "bg-white"}`}>
                {doneStep ? (
                  <CheckCircle2 size={13} className="text-white" />
                ) : (
                  <span className={`text-[10px] font-extrabold ${active ? "text-vouch-red" : "text-[#c0c5ce]"} tracking-tight`}>{n}</span>
                )}
              </div>
              {i < STEPS.length - 1 && <div className={`w-px h-8 ${doneStep ? "bg-vouch-red" : "bg-[#e0deda]"} transition-colors duration-400`} />}
              <span className={`text-[9px] font-bold ${active || doneStep ? "text-vouch-red" : "text-[#b0b5be]"} uppercase tracking-widest mt-1.5 [writing-mode:vertical-rl] rotate-180 leading-none`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="auth-topbar flex items-center justify-between px-12 py-4.5 border-b border-[#ebebea]">
          <div className="flex items-center gap-2">
            <div className="w-7.5 h-7.5 rounded-lg bg-vouch-red flex items-center justify-center">
              <span className="text-white font-black text-xs tracking-tighter">V</span>
            </div>
            <span className="text-gray-900 font-extrabold text-base tracking-tighter">Vouch</span>
            <span className="bg-red-50 border border-red-100 text-vouch-red text-[9px] font-bold tracking-widest uppercase rounded-full px-2 py-0.5">Beta</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">
            Already registered?{" "}
            <Link href="/login" className="text-gray-700 font-bold hover:text-vouch-red transition-colors">Sign in →</Link>
          </p>
        </div>

        <div className="auth-main-row flex-1 flex">
          {/* Form area */}
          <div className="auth-form-wrap flex-1 flex items-center justify-center px-12 py-10">
            <div className="w-full max-w-[400px]">
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div 
                    key="done"
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-center"
                  >
                    <div className="w-[72px] h-[72px] rounded-full bg-red-50 border-2 border-vouch-red flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 size={32} className="text-vouch-red" />
                    </div>
                    <h2 className="text-gray-900 font-extrabold text-[28px] tracking-tight mb-2.5">You're all set!</h2>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed mb-6.5">
                      Welcome to Vouch, <span className="text-gray-900 font-bold">{user.name}</span>.<br />
                      Install the extension and start reading smarter.
                    </p>
                    <div className="flex flex-col gap-3">
                      <a href="#" className="w-full bg-vouch-red text-white font-extrabold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-vouch-darkRed hover:-translate-y-0.5 hover:shadow-xl transition-all">
                        <Chrome size={15} /> Install Chrome Extension — Free
                      </a>
                      <Link href="/dashboard" className="text-gray-500 font-bold text-sm hover:text-vouch-red transition-colors">
                        Go to Dashboard
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="pw"
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="mb-7">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Sparkles size={12} className="text-vouch-red" />
                        <span className="text-vouch-red text-[11px] font-bold tracking-widest uppercase">Step 3 of 3 — Final step</span>
                      </div>
                      <h2 className="text-gray-900 font-extrabold text-3xl tracking-tight leading-[1.1] mb-2">
                        Secure your<br />account.
                      </h2>
                      <p className="text-gray-400 text-sm font-medium">Almost there. Set a strong password.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Password field */}
                      <div>
                        <label className="block text-gray-700 text-[10.5px] font-bold tracking-widest uppercase mb-1.5">Password</label>
                        <div className="relative">
                          <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                          <input
                            type={showPw.password ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            onFocus={() => setFocused("password")}
                            onBlur={() => setFocused(null)}
                            className={`w-full bg-[#f9f9f7] border-[1.5px] rounded-xl pl-9.5 pr-10 py-3 text-gray-900 text-sm font-medium outline-none transition-all ${focused === "password" ? "border-vouch-red bg-white ring-4 ring-red-50" : "border-[#e5e5e3]"}`}
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPw(p => ({ ...p, password: !p.password }))} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:text-gray-600 transition-colors"
                          >
                            {showPw.password ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>

                        {/* Strength meter */}
                        {password && (
                          <div className="mt-2.5">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="flex gap-1 flex-1">
                                {[1, 2, 3, 4].map(i => (
                                  <div key={i} className={`flex-1 h-0.75 rounded-full transition-all duration-300 ${i <= pwStrength ? strengthBg : "bg-[#e5e5e3]"}`} />
                                ))}
                              </div>
                              <span className={`text-[11px] font-bold min-w-[36px] ${strengthColor}`}>{strengthLabel}</span>
                            </div>

                            {/* Requirements checklist */}
                            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                              {requirements.map(({ label, met }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${met ? "bg-green-50 border-green-500" : "bg-gray-50 border-gray-200"}`}>
                                    {met && <CheckCircle2 size={8} className="text-green-500" />}
                                  </div>
                                  <span className={`text-[10.5px] font-medium transition-colors ${met ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm password */}
                      <div>
                        <label className="block text-gray-700 text-[10.5px] font-bold tracking-widest uppercase mb-1.5">Confirm password</label>
                        <div className="relative">
                          <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                          <input
                            type={showPw.confirm ? "text" : "password"}
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            placeholder="Repeat password"
                            onFocus={() => setFocused("confirm")}
                            onBlur={() => setFocused(null)}
                            className={`w-full bg-[#f9f9f7] border-[1.5px] rounded-xl pl-9.5 pr-10 py-3 text-gray-900 text-sm font-medium outline-none transition-all ${mismatch ? "border-red-500 bg-white ring-4 ring-red-50" : focused === "confirm" ? "border-vouch-red bg-white ring-4 ring-red-50" : "border-[#e5e5e3]"}`}
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:text-gray-600 transition-colors"
                          >
                            {showPw.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        {mismatch && <p className="text-red-500 text-[11px] font-bold mt-1.5">Passwords don't match</p>}
                        {confirm && !mismatch && (
                          <p className="text-green-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                            <CheckCircle2 size={11} /> Passwords match
                          </p>
                        )}
                      </div>

                      {/* Terms checkbox */}
                      <div className="flex items-start gap-2.5 py-1 cursor-pointer" onClick={() => setAgreed(!agreed)}>
                        <button 
                          type="button"
                          tabIndex={-1}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${agreed ? "bg-vouch-red border-vouch-red" : "border-gray-500 bg-white hover:border-vouch-red"}`}
                        >
                          {agreed && <CheckCircle2 size={10} className="text-white" />}
                        </button>
                        <span className="text-gray-500 text-xs font-medium leading-relaxed select-none">
                          I agree to Vouch's <a href="#" onClick={(e) => e.stopPropagation()} className="text-gray-700 font-bold hover:text-vouch-red">Terms of Service</a> & <a href="#" onClick={(e) => e.stopPropagation()} className="text-gray-700 font-bold hover:text-vouch-red">Privacy Policy</a>
                        </span>
                      </div>

                      <button 
                        type="submit" 
                        disabled={!canSubmit}
                        className="w-full bg-vouch-red text-white font-extrabold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-vouch-darkRed hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-55 disabled:cursor-not-allowed"
                      >
                        {setPasswordMutation.isPending ? (
                          <>
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                            >
                              <Zap size={16} />
                            </motion.div>
                            Creating account...
                          </>
                        ) : (
                          <>Create my account <ArrowRight size={16} /></>
                        )}
                      </button>
                    </form>

                    <div className="text-center mt-3.5">
                      <button onClick={() => router.back()} className="text-gray-400 font-medium text-xs hover:text-gray-600 transition-colors">← Back to verification</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right panel - Info */}
          <div className="w-80 border-l border-[#ebebea] px-10 py-12 flex flex-col justify-center bg-[#fafaf8] shrink-0">
            <motion.div
              key={done ? "done" : "pw"}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-vouch-red font-extrabold text-[96px] leading-none tracking-tighter opacity-[0.12] mb-1 select-none">
                {done ? "✓" : "03"}
              </div>
              <div className="text-gray-900 font-extrabold text-lg tracking-tight mb-3">
                {done ? "All done!" : "Set password"}
              </div>
              <p className="text-gray-400 text-[13px] font-medium leading-relaxed mb-6">
                {done
                  ? "Your Vouch account is live. Install the Chrome extension to get started."
                  : "Pick a strong password. Mix uppercase, numbers, and symbols to hit Strong."}
              </p>

              {!done && (
                <div className="space-y-2.5">
                  {[
                    { icon: "🔒", title: "Encrypted storage", desc: "Your password is hashed and never stored in plain text." },
                    { icon: "🛡️", title: "Secure by default", desc: "We use industry-standard bcrypt with salting." },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="p-3 bg-white border border-[#ebebea] rounded-xl flex gap-2.5 items-start">
                      <span className="text-base shrink-0 mt-0.5">{icon}</span>
                      <div>
                        <p className="text-xs font-bold text-gray-900 mb-0.5">{title}</p>
                        <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Step progress bar */}
            <div className="flex gap-1.5 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1 rounded-full transition-all duration-350 ${done || i <= 3 ? "bg-vouch-red" : "bg-[#e5e5e3]"} ${i === 3 ? "flex-[2]" : "flex-1"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
