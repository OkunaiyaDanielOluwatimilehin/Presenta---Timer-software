import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  Cloud,
  LayoutDashboard,
  MessageSquareText,
  MonitorPlay,
  Palette,
  ArrowUp,
  X,
  Send,
  Shield,
  Timer,
  WifiOff,
} from 'lucide-react';
import { motion } from 'motion/react';

const DEFAULT_DOWNLOAD_PATH = 'download/PresentaProInstaller.msi';
const HERO_TITLE = 'PRESENTA PRO';
const HERO_HEADLINE = 'STAGE TIMING THAT LOOKS PRO.';
const DEFAULT_FORMSPREE_ENDPOINT = 'https://formspree.io/f/mnjgzdbv';

type Props = {
  onOpenApp: () => void;
  downloadUrl?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function WindowsIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 5.2 10.5 4v7.2H3V5.2Zm0 13.6v-6.4h7.5V20L3 18.8Zm9 1.4v-7.8H21V22l-9-.8Zm0-16.4L21 2v9.2h-9V3.8Z" />
    </svg>
  );
}

export default function Landing({ onOpenApp, downloadUrl }: Props) {
  const assetUrl = useMemo(() => {
    const base = (import.meta as any)?.env?.BASE_URL ?? '/';
    return (path: string) => `${String(base).replace(/\/?$/, '/')}${String(path).replace(/^\//, '')}`;
  }, []);

  const resolvedDownloadUrl = downloadUrl ?? assetUrl(DEFAULT_DOWNLOAD_PATH);
  const formspreeEndpoint =
    (import.meta as any)?.env?.VITE_FORMSPREE_ENDPOINT ?? DEFAULT_FORMSPREE_ENDPOINT;

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroTyped, setHeroTyped] = useState('');
  const [previewSelectedAgendaIndex, setPreviewSelectedAgendaIndex] = useState(0);
  const [previewTimeLeftMs, setPreviewTimeLeftMs] = useState(0);
  const previewLastTickMsRef = useRef<number | null>(null);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const previewAgenda = useMemo(
    () => [
      { label: 'Opening', durationMs: 2 * 60 * 1000 },
      { label: 'Worship', durationMs: 5 * 60 * 1000 },
      { label: 'Message', durationMs: 5 * 60 * 1000 },
      { label: 'Closing', durationMs: 3 * 60 * 1000 },
    ],
    [],
  );

  const formatPreviewTime = (ms: number) => {
    const clamped = Math.max(0, ms);
    const totalSeconds = Math.ceil(clamped / 1000);
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(mm)} : ${pad(ss)}`;
  };

  useEffect(() => {
    setPreviewTimeLeftMs(previewAgenda[previewSelectedAgendaIndex]?.durationMs ?? 0);
    previewLastTickMsRef.current = null;
  }, [previewAgenda, previewSelectedAgendaIndex]);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (reduced) {
      setHeroTyped(HERO_HEADLINE);
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    setHeroTyped('');
    const full = HERO_HEADLINE;
    let cursor = 0;
    let mode: 'type' | 'delete' = 'type';

    const tick = () => {
      if (cancelled) return;

      const clamped = Math.max(0, Math.min(full.length, cursor));
      setHeroTyped(full.slice(0, clamped));

      if (mode === 'type') {
        if (cursor >= full.length) {
          mode = 'delete';
          timeoutId = window.setTimeout(tick, 1100);
          return;
        }
        cursor += 1;
        timeoutId = window.setTimeout(tick, 26);
        return;
      }

      if (cursor <= 0) {
        mode = 'type';
        timeoutId = window.setTimeout(tick, 520);
        return;
      }

      cursor -= 1;
      timeoutId = window.setTimeout(tick, 16);
    };

    timeoutId = window.setTimeout(tick, 220);

    return () => {
      cancelled = true;
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (reduced) return;

    const timeScale = 10;
    const id = window.setInterval(() => {
      const now = Date.now();
      const last = previewLastTickMsRef.current ?? now;
      previewLastTickMsRef.current = now;
      const delta = Math.max(0, now - last);

      setPreviewTimeLeftMs((prev) => {
        const next = Math.max(0, prev - delta * timeScale);
        return next;
      });
    }, 100);

    return () => window.clearInterval(id);
  }, [previewAgenda.length]);

  useEffect(() => {
    if (previewTimeLeftMs !== 0) return;
    if (!previewAgenda.length) return;
    setPreviewSelectedAgendaIndex((prev) => (prev + 1) % previewAgenda.length);
  }, [previewAgenda.length, previewTimeLeftMs]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) return;

    setFeedbackStatus('submitting');
    try {
      const res = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: feedbackName,
          email: feedbackEmail,
          message: feedbackMessage,
          page: 'landing',
        }),
      });

      if (res.ok) {
        setFeedbackStatus('success');
        setFeedbackName('');
        setFeedbackEmail('');
        setFeedbackMessage('');
        return;
      }

      setFeedbackStatus('error');
    } catch {
      setFeedbackStatus('error');
    }
  };

  const faqs = useMemo(
    () => [
      {
        q: 'Is the web app offline?',
        a: 'Yes. Your agenda and settings are stored locally in your browser (LocalStorage).',
      },
      {
        q: 'How do I show the timer on an external monitor?',
        a: 'Open the web app, then use the Outputs panel to open Display Mode in a new window. Drag it to your external monitor and go fullscreen.',
      },
      {
        q: 'Why doesn’t the display window open?',
        a: 'Your browser may block pop-ups. Allow pop-ups for this site, then try again.',
      },
      {
        q: 'Can I still use the Windows installer?',
        a: 'Yes. Click Download installer to get the Windows (.msi) file directly from this website.',
      },
    ],
    [],
  );

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#060707] text-white [background-image:radial-gradient(900px_500px_at_15%_10%,rgba(16,185,129,0.20),transparent_60%),radial-gradient(800px_520px_at_85%_12%,rgba(34,211,238,0.16),transparent_60%),radial-gradient(900px_640px_at_50%_120%,rgba(168,85,247,0.10),transparent_60%)]">
      <style>{`
        @keyframes pp_shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes pp_blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="#top" className="flex items-center gap-3 no-underline">
            <img
              src={assetUrl('android-chrome-192x192.png')}
              alt=""
              className="h-9 w-9 rounded-xl border border-white/10 bg-white/5"
            />
            <div className="leading-tight">
              <div className="text-[12px] font-black uppercase tracking-[0.22em] text-white/90">Presenta Pro</div>
              <div className="text-[10px] font-bold text-white/45">Professional Stage Timer</div>
            </div>
          </a>

          <nav className="hidden items-center gap-5 text-[11px] font-black uppercase tracking-[0.22em] text-white/60 md:flex">
            <a className="hover:text-white" href="#about">
              About
            </a>
            <a className="hover:text-white" href="#features">
              Features
            </a>
            <a className="hover:text-white" href="#faq">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenApp}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/90 hover:bg-white/10"
            >
              <MonitorPlay size={14} className="text-emerald-400" />
              Open web app
              <ArrowRight size={14} className="text-white/70" />
            </button>
            <a
              href={resolvedDownloadUrl}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-white/85 hover:bg-white/10 sm:hidden"
              aria-label="Download installer (Windows .msi)"
              title="Download installer (Windows .msi)"
              download
            >
              <WindowsIcon size={16} />
            </a>
            <a
              href={resolvedDownloadUrl}
              className="hidden items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-black hover:opacity-90 sm:inline-flex"
              download
            >
              <WindowsIcon size={14} />
              Download installer
              <Download size={14} />
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <svg
              aria-hidden="true"
              className="absolute left-1/2 top-[-120px] h-[520px] w-[980px] -translate-x-1/2 opacity-[0.22]"
              viewBox="0 0 980 520"
              fill="none"
            >
              <defs>
                <linearGradient id="pp-grid" x1="0" y1="0" x2="980" y2="520" gradientUnits="userSpaceOnUse">
                  <stop stopColor="rgba(16,185,129,0.55)" />
                  <stop offset="0.55" stopColor="rgba(34,211,238,0.35)" />
                  <stop offset="1" stopColor="rgba(168,85,247,0.30)" />
                </linearGradient>
                <pattern id="pp-p" width="44" height="44" patternUnits="userSpaceOnUse">
                  <path d="M 44 0 H 0 V 44" stroke="url(#pp-grid)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="980" height="520" fill="url(#pp-p)" />
              <rect
                x="0"
                y="0"
                width="980"
                height="520"
                fill="url(#pp-grid)"
                opacity="0.12"
              />
            </svg>
            <div className="absolute left-[-24%] top-[-28%] h-[520px] w-[520px] rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute right-[-22%] top-[-26%] h-[520px] w-[520px] rounded-full bg-cyan-400/16 blur-3xl" />
            <div className="absolute left-[38%] top-[65%] h-[560px] w-[560px] rounded-full bg-fuchsia-500/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
            <div className="grid gap-10 md:min-h-[920px] md:grid-rows-[0.4fr_0.6fr]">
              <motion.div
                className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center"
              >
                <motion.div
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/70"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <Timer size={14} className="text-emerald-400" />
                  Stage timer • Agenda • Display mode
                </motion.div>

                <motion.h1
                  className="mt-6 text-balance text-5xl font-black uppercase leading-[0.92] tracking-tight md:text-7xl"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut', delay: 0.04 }}
                >
                  <span className="text-white/95">{HERO_TITLE}</span>
                </motion.h1>

                <motion.div
                  className="mt-3 text-balance text-sm font-semibold uppercase tracking-[0.14em] text-white/70 md:text-base"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut', delay: 0.06 }}
                >
                  <span className="bg-gradient-to-r from-emerald-200 via-cyan-100 to-fuchsia-200/70 bg-[length:200%_100%] bg-clip-text text-transparent [animation:pp_shimmer_7s_linear_infinite]">
                    {heroTyped}
                  </span>
                  <span
                    aria-hidden="true"
                    className="ml-0.5 align-baseline font-normal text-emerald-200/65 [animation:pp_blink_1s_steps(1)_infinite]"
                  >
                    ▏
                  </span>
                </motion.div>

                <motion.p
                  className="mt-5 max-w-[62ch] text-pretty text-sm font-bold leading-relaxed text-white/60 md:text-base mx-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
                >
                  Run a precise timer, manage agenda segments, open a dedicated fullscreen display window, and send broadcast
                  messages — all in the browser.
                </motion.p>
              </motion.div>

              <motion.div
                className="h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/5 to-cyan-400/10 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.65)] md:p-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.12 }}
              >
                <motion.div
                  className="flex h-full flex-col"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-white/15" />
                      <div className="h-3 w-3 rounded-full bg-white/15" />
                      <div className="h-3 w-3 rounded-full bg-white/15" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">Preview</div>
                  </div>
                  <div className="flex-1 overflow-auto pt-4">
                    <div className="rounded-2xl border border-emerald-500/25 bg-black/45 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                            Stage display
                          </div>
                          <div className="mt-1 text-[12px] font-bold text-white/60">
                            Preview timer runs fast (demo mode).
                          </div>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300/70">
                          Auto
                        </div>
                      </div>

                      <div className="mt-4 text-7xl font-black tracking-[0.06em] text-white drop-shadow-[0_0_50px_rgba(16,185,129,0.25)] md:text-8xl">
                        {formatPreviewTime(previewTimeLeftMs)}
                      </div>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-fuchsia-500 transition-[width] duration-150"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                (previewTimeLeftMs / (previewAgenda[previewSelectedAgendaIndex]?.durationMs ?? 1)) * 100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="mt-3 text-[12px] font-bold text-white/55">
                        Now:{' '}
                        <span className="text-white/85">{previewAgenda[previewSelectedAgendaIndex]?.label}</span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">Agenda</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {previewAgenda.map((i, idx) => {
                          const active = idx === previewSelectedAgendaIndex;
                          return (
                            <button
                              key={i.label}
                              type="button"
                              onClick={() => setPreviewSelectedAgendaIndex(idx)}
                              className={cn(
                                'relative overflow-hidden rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] transition-colors',
                                active
                                  ? 'border-emerald-500/40 text-white'
                                  : 'border-white/10 text-white/70 hover:bg-white/10',
                              )}
                              title={`Show: ${i.label}`}
                            >
                              {active ? (
                                <motion.span
                                  layoutId="pp_agenda_active"
                                  className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/25 via-cyan-400/15 to-fuchsia-500/20"
                                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                                />
                              ) : null}
                              <span className="relative z-10">{i.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <motion.section
          id="about"
          className="border-t border-white/10"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">About</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Built for stage clarity.</h2>
                <p className="mt-3 max-w-[74ch] text-sm font-bold leading-relaxed text-white/60">
                  Presenta Pro combines a live controller, agenda segments, and a dedicated display window into a clean,
                  stage-friendly workflow — optimized for both church services and live programs.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { icon: <MonitorPlay size={18} className="text-emerald-400" />, t: 'Operator + display', d: 'Controller window + dedicated stage output window.' },
                { icon: <WifiOff size={18} className="text-emerald-400" />, t: 'Offline-ready', d: 'Agendas and settings persist locally in your browser.' },
                { icon: <Shield size={18} className="text-emerald-400" />, t: 'Reliable workflow', d: 'Designed to fit real stage operations and quick changes.' },
              ].map((c) => (
                <motion.div
                  key={c.t}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.12)_inset]"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/12 blur-2xl" />
                    <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-2xl" />
                  </div>
                  <div className="flex items-center gap-2">
                    {c.icon}
                    <div className="text-[12px] font-black uppercase tracking-[0.22em] text-white/85">{c.t}</div>
                  </div>
                  <div className="mt-3 text-[12px] font-bold leading-relaxed text-white/60">{c.d}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          id="features"
          className="border-t border-white/10 bg-white/[0.02]"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">Features</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Everything you need on stage.</h2>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {[
                { icon: <LayoutDashboard size={18} className="text-emerald-200" />, t: 'Live controller', d: 'Start/pause, reset, and jump to agenda items quickly.' },
                { icon: <Timer size={18} className="text-emerald-200" />, t: 'Agenda management', d: 'Build a full event flow and load the active item instantly.' },
                { icon: <MonitorPlay size={18} className="text-emerald-200" />, t: 'Display mode', d: 'Open a fullscreen-ready stage output window from the controller.' },
                { icon: <MessageSquareText size={18} className="text-emerald-200" />, t: 'Broadcast messages', d: 'Send notices, alerts, or scrolling messages to the stage display.' },
                { icon: <Palette size={18} className="text-emerald-200" />, t: 'Themes + typography', d: 'Professional themes and offline-ready fonts with bold readability.' },
                { icon: <Cloud size={18} className="text-emerald-200" />, t: 'Static hosting', d: 'Deploy as a static site (GitHub Pages, Vercel, Netlify, S3).' },
              ].map(({ icon, t, d }) => (
                <motion.div
                  key={t}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.10)_inset]"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-fuchsia-500/8 blur-2xl" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/5">
                      {icon}
                    </div>
                    <div className="text-[12px] font-black uppercase tracking-[0.22em] text-white/90">{t}</div>
                  </div>
                  <div className="mt-2.5 text-[12px] font-semibold leading-relaxed text-white/60">{d}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          id="faq"
          className="border-t border-white/10"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">FAQ</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Quick answers.</h2>
            <div className="mt-7 grid gap-3">
              {faqs.map((f, idx) => {
                const open = openFaq === idx;
                return (
                  <button
                    key={f.q}
                    type="button"
                    onClick={() => setOpenFaq((prev) => (prev === idx ? null : idx))}
                    className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-left shadow-[0_0_0_1px_rgba(0,0,0,0.12)_inset] hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-black uppercase tracking-[0.18em] text-white/90">{f.q}</div>
                      <ChevronDown
                        size={18}
                        className={cn('text-white/60 transition-transform', open && 'rotate-180')}
                      />
                    </div>
                    <motion.div
                      initial={false}
                      animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 text-[12px] font-bold leading-relaxed text-white/60">{f.a}</div>
                    </motion.div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.section>

        <section className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <motion.div
              className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_40px_140px_rgba(0,0,0,0.55)] md:p-8"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                <div>
                  <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-white/55">Get started</div>
                  <div className="mt-2 text-base font-bold tracking-tight text-white/90 md:text-lg">
                    Open the web app, or download the Windows installer.
                  </div>
                  <div className="mt-2 max-w-[72ch] text-[11px] font-medium leading-relaxed text-white/55 md:text-[12px]">
                    Windows 10/11 (64-bit) installer (.msi) served directly from this site.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenApp}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-black shadow-[0_18px_60px_rgba(16,185,129,0.25)] hover:opacity-90"
                  >
                    Open web app
                    <ArrowRight size={16} />
                  </button>
                  <a
                    href={resolvedDownloadUrl}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white/90 hover:bg-white/10"
                    download
                  >
                    <WindowsIcon size={16} className="text-white/85" />
                    Download installer
                    <Download size={16} className="text-white/70" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 md:flex-row md:items-center">
          <div>
            <div className="text-[12px] font-black uppercase tracking-[0.22em] text-white/85">Presenta Pro</div>
            <div className="mt-2 text-[12px] font-bold text-white/45">Professional Stage Timer</div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-black uppercase tracking-[0.22em] text-white/60">
            <button type="button" onClick={onOpenApp} className="hover:text-white">
              Open web app
            </button>
            <a href={resolvedDownloadUrl} download className="hover:text-white">
              Download installer
            </a>
            <a
              href="https://github.com/OkunaiyaDanielOluwatimilehin/Presenta---Timer-software"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Source
            </a>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setShowFeedback(true);
            setFeedbackStatus('idle');
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white/85 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur hover:bg-black/70"
        >
          <MessageSquareText size={16} className="text-emerald-200" />
          Submit feedback
        </button>

        {showScrollTop ? (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
            title="Scroll to top"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-black/60 p-3 text-white/85 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur hover:bg-black/70"
          >
            <ArrowUp size={18} />
          </button>
        ) : null}
      </div>

      {showFeedback ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close feedback form"
            onClick={() => setShowFeedback(false)}
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_50px_180px_rgba(0,0,0,0.75)] backdrop-blur md:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">Feedback</div>
                <div className="mt-2 text-xl font-black tracking-tight text-white/90">Tell us what to improve.</div>
                <div className="mt-2 text-[12px] font-semibold leading-relaxed text-white/55">
                  This goes straight to our inbox via Formspree.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFeedback(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                aria-label="Close"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="mt-6 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                submitFeedback();
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-semibold text-white/90 outline-none placeholder:text-white/35 focus:ring-2 focus:ring-emerald-500/40"
                />
                <input
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-semibold text-white/90 outline-none placeholder:text-white/35 focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Your message…"
                rows={5}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-semibold text-white/90 outline-none placeholder:text-white/35 focus:ring-2 focus:ring-emerald-500/40"
              />

              {feedbackStatus === 'success' ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[12px] font-semibold text-emerald-100">
                  Submitted. Thank you!
                </div>
              ) : feedbackStatus === 'error' ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] font-semibold text-red-100">
                  Something went wrong. Please try again.
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-[11px] font-semibold text-white/45">
                  {String(formspreeEndpoint || '').includes('formspree.io')
                    ? 'Powered by Formspree.'
                    : 'Set `VITE_FORMSPREE_ENDPOINT` to your Formspree endpoint.'}
                </div>
                <button
                  type="submit"
                  disabled={feedbackStatus === 'submitting' || !feedbackMessage.trim()}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-black shadow-[0_18px_60px_rgba(16,185,129,0.25)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60',
                  )}
                >
                  {feedbackStatus === 'submitting' ? 'Sending…' : 'Send'}
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
