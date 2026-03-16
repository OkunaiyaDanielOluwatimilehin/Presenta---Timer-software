import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Monitor, Settings, Clock, Plus, Trash2, 
  Layout, Palette, Type, ChevronRight, MessageSquare, Maximize2, 
  Activity, RefreshCw, Save, Upload, Eye, EyeOff, MonitorPlay,
  FileText, Edit3, Layers, Settings2, Command, Github, ExternalLink,
  MessageCircle, X, Check, Send
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { motion, AnimatePresence } from 'motion/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SOURCE_CODE_URL = 'https://github.com/OkunaiyaDanielOluwatimilehin/Presenta---Timer-software';

/**
 * Types and Interfaces
 */
interface AgendaItem {
  id: string;
  label: string;
  duration: number; // in seconds
  color: string;
  description?: string;
}

type ThemeMode = 'dark' | 'light' | 'matrix' | 'cyberpunk' | 'minimal';
type FontStyle = 'font-sans' | 'font-display' | 'font-digital' | 'font-mono' | 'font-classic' | 'font-impact' | 'font-retro' | 'font-heavy' | 'font-clean' | 'font-elegant';
type TimerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

type OutputTarget = {
  index: number;
  name: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  isPrimary?: boolean;
  scaleFactor?: number;
  kind: 'tauri' | 'web';
};

interface TimerConfig {
  theme: ThemeMode;
  fontFamily: FontStyle;
  primaryColor: string;
  displaySize: TimerSize;
  timerFontPx: number;
  showLabel: boolean;
  labelColor: string;
  broadcast: {
    message: string;
    show: boolean;
    color: string;
    fontSize: number;
    animation: 'plain' | 'scroll' | 'alert';
    duration: number; // minutes
    startTime: number | null;
  };
}

/**
 * Constants
 */
const THEMES: Record<ThemeMode, { bg: string; text: string; muted: string; accent: string; card: string; border: string; subtleBg: string; navBg: string; navText: string; panelBg: string; inputBg: string }> = {
  dark: { 
    bg: 'bg-[#0a0a0a]', 
    text: 'text-white', 
    muted: 'text-white/40',
    accent: 'text-emerald-500', 
    card: 'bg-white/5 border-white/10',
    border: 'border-white/10',
    subtleBg: 'bg-white/5',
    navBg: 'bg-black/20',
    navText: 'text-white',
    panelBg: 'bg-black/10',
    inputBg: 'bg-white/10'
  },
  light: { 
    bg: 'bg-[#f8fafc]', 
    text: 'text-slate-900', 
    muted: 'text-slate-500',
    accent: 'text-blue-600', 
    card: 'bg-white border-slate-200 shadow-sm',
    border: 'border-slate-200',
    subtleBg: 'bg-slate-200/50',
    navBg: 'bg-white/80',
    navText: 'text-slate-900',
    panelBg: 'bg-slate-50',
    inputBg: 'bg-slate-100'
  },
  matrix: { 
    bg: 'bg-black', 
    text: 'text-green-500', 
    muted: 'text-green-900',
    accent: 'text-green-400', 
    card: 'bg-black border-green-900/50',
    border: 'border-green-900/30',
    subtleBg: 'bg-green-900/10',
    navBg: 'bg-black/40',
    navText: 'text-green-500',
    panelBg: 'bg-green-900/5',
    inputBg: 'bg-green-900/20'
  },
  cyberpunk: { 
    bg: 'bg-[#050505]', 
    text: 'text-fuchsia-500', 
    muted: 'text-fuchsia-900',
    accent: 'text-cyan-400', 
    card: 'bg-fuchsia-500/5 border-fuchsia-500/20',
    border: 'border-fuchsia-500/20',
    subtleBg: 'bg-fuchsia-500/5',
    navBg: 'bg-black/60',
    navText: 'text-fuchsia-500',
    panelBg: 'bg-fuchsia-500/5',
    inputBg: 'bg-fuchsia-500/10'
  },
  minimal: { 
    bg: 'bg-white', 
    text: 'text-black', 
    muted: 'text-gray-400',
    accent: 'text-black', 
    card: 'bg-transparent border-black/5',
    border: 'border-black/10',
    subtleBg: 'bg-black/5',
    navBg: 'bg-white',
    navText: 'text-black',
    panelBg: 'bg-gray-50',
    inputBg: 'bg-gray-100'
  },
};

const clampTimerFontPx = (value: number) => Math.max(80, Math.min(900, value));

const getDurationParts = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    minutes: minutes.toString(),
    seconds: seconds.toString().padStart(2, '0'),
  };
};

const TimerText = ({ ms }: { ms: number }) => {
  const parts = getDurationParts(ms);
  const minutes = parts.minutes.padStart(2, '0');
  const seconds = parts.seconds;

  return (
    <span className="inline-grid items-baseline whitespace-nowrap" style={{ gridTemplateColumns: '2ch 1.5ch 2ch' }}>
      <span className="text-right" style={{ width: '2ch' }}>{minutes}</span>
      <span className="text-center" style={{ width: '1.5ch' }}>:</span>
      <span className="text-left" style={{ width: '2ch' }}>{seconds}</span>
    </span>
  );
};

/**
 * Utility for formatting time (agenda durations, no milliseconds)
 */
const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m} : ${s.toString().padStart(2, '0')}`;
};

const formatSystemClock = (d: Date) => {
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh} : ${mm} : ${ss}`;
};

/**
 * Sub-component for Timer Display
 */
const TimerDisplay = ({ 
  config, 
  timeLeft, 
  activeItem, 
  systemClock,
  isActive,
  targetTime,
  isPreview = false 
}: { 
  config: TimerConfig; 
  timeLeft: number; 
  activeItem: AgendaItem | null;
  systemClock?: Date;
  isActive?: boolean;
  targetTime?: number | null;
  isPreview?: boolean;
}) => {
  const currentTheme = THEMES[config.theme];
  const isAlert = timeLeft <= 60000 && timeLeft > 0;
  const isFinished = timeLeft === 0;
  const hasBroadcast = Boolean(config.broadcast.show && config.broadcast.message);
  const showStatus = !isPreview && (isFinished || isAlert);
  const timerTextColor = config.primaryColor;
  const timerFontPx = clampTimerFontPx(config.timerFontPx || 380);
  const timerOuterRef = useRef<HTMLDivElement | null>(null);
  const timerInnerRef = useRef<HTMLDivElement | null>(null);
  const [timerScale, setTimerScale] = useState(1);
  const isTauri = Boolean((window as any).__TAURI__);
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    if (isPreview) {
      setTimerScale(1);
      return;
    }

    const measure = () => {
      const outer = timerOuterRef.current;
      const inner = timerInnerRef.current;
      if (!outer || !inner) return;

      const available = outer.clientWidth;
      const needed = inner.scrollWidth;
      if (available <= 0 || needed <= 0) return;

      const nextScale = Math.min(1, available / needed);
      setTimerScale(prev => (Math.abs(prev - nextScale) < 0.01 ? prev : nextScale));
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isPreview, timeLeft, timerFontPx, config.fontFamily]);

  return (
    <div className={cn(
      "relative w-full h-full flex flex-col items-center justify-center overflow-hidden",
      !isPreview && "transition-colors duration-500",
      isPreview ? "bg-transparent" : currentTheme.bg,
      !isPreview && hasBroadcast && "pb-[9vh]"
    )}>
      {/* Web display: encourage fullscreen to hide browser chrome */}
      {!isPreview && !isTauri && !isFullscreen && (
        <div className="absolute top-4 right-4 z-[110]">
          <button
            type="button"
            onClick={() => {
              try {
                document.documentElement.requestFullscreen?.();
              } catch {
                // ignore
              }
            }}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-black hover:opacity-90"
            title="Enter Fullscreen (hides browser UI)"
          >
            Fullscreen
          </button>
        </div>
      )}

      {/* Status + System Clock (Display Only, ABOVE timer) */}
      {!isPreview && (
        <div className={cn("w-full flex flex-col items-center text-center", showStatus ? "mb-14" : "mb-10")}>
          <AnimatePresence>
            {isFinished && (
              <motion.div
                key="time-up-main"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "text-5xl md:text-7xl",
                  "text-red-600 font-black uppercase tracking-[0.35em] animate-flash"
                )}
                style={{
                  textShadow: '0 0 50px rgba(255,0,0,0.8), 0 0 100px rgba(255,0,0,0.4)',
                  lineHeight: '0.85'
                }}
              >
                TIME UP
              </motion.div>
            )}
            {!isFinished && isAlert && (
              <motion.div
                key="round-up-main"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "text-4xl md:text-6xl",
                  "text-yellow-400 font-black uppercase tracking-[0.25em] animate-flash"
                )}
                style={{
                  textShadow: '0 0 40px rgba(255,255,0,0.6)',
                  lineHeight: '0.85'
                }}
              >
                ROUND UP NOW
              </motion.div>
            )}
          </AnimatePresence>

          {systemClock && (
            <div className={cn(
              "mt-8 flex items-center gap-3 px-6 py-3 rounded-2xl border",
              "bg-black/40 border-white/10 text-white backdrop-blur-md"
            )}>
              <Clock size={28} className="text-blue-400" />
              <span className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                {formatSystemClock(systemClock)}
              </span>
            </div>
          )}
        </div>
      )}

      {config.showLabel && activeItem && (
        isPreview ? (
          <div
            className={cn(
              "font-display font-black uppercase tracking-[0.5em] mb-3 text-center",
              "text-[10px]"
            )}
            style={{ color: config.labelColor, textShadow: '0 0 20px rgba(0,0,0,0.5)' }}
          >
            {activeItem.label}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn("font-display font-black uppercase tracking-[0.5em] mb-6 text-center", "text-6xl")}
              style={{ color: config.labelColor, textShadow: '0 0 20px rgba(0,0,0,0.5)' }}
            >
              {activeItem.label}
            </motion.div>
          </AnimatePresence>
        )
      )}

      <div ref={timerOuterRef} className="w-full flex justify-center" style={{ maxWidth: '95vw' }}>
        <div
          ref={timerInnerRef}
          className={cn(config.fontFamily, "inline-flex font-black tabular-nums leading-none relative select-none")}
          style={{
            color: timerTextColor,
            fontSize: isPreview ? '48px' : `${timerFontPx}px`,
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"tnum"',
            transform: !isPreview && timerScale < 1 ? `scale(${timerScale})` : undefined,
            transformOrigin: 'center',
          }}
        >
          <TimerText ms={timeLeft} />
        </div>
      </div>

      {/* Broadcast Bar */}
      <AnimatePresence>
        {config.broadcast.show && config.broadcast.message && (
          isPreview ? (
            <div
              className={cn(
                "absolute bottom-0 left-0 w-full flex items-center overflow-hidden border-t z-100",
                currentTheme.border,
                "h-6",
                config.broadcast.animation === 'alert' && "animate-alert"
              )}
              style={{ backgroundColor: config.broadcast.color }}
            >
              <div className={cn(
                "w-full text-white font-black uppercase tracking-widest text-center px-2 whitespace-nowrap",
                config.broadcast.animation === 'scroll' && "marquee"
              )} style={{
                fontSize: `${config.broadcast.fontSize * 2}px`,
                display: config.broadcast.animation === 'scroll' ? 'inline-block' : 'block'
              }}>
                {config.broadcast.message}
              </div>
            </div>
          ) : (
            <motion.div
              key="broadcast-bar"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className={cn(
                "absolute bottom-0 left-0 w-full flex items-center overflow-hidden border-t z-100",
                currentTheme.border,
                "h-[9vh]",
                config.broadcast.animation === 'alert' && "animate-alert"
              )}
              style={{ backgroundColor: config.broadcast.color }}
            >
              <div className={cn(
                "w-full text-white font-black uppercase tracking-widest text-center px-8 whitespace-nowrap",
                config.broadcast.animation === 'scroll' && "marquee"
              )} style={{
                fontSize: `${config.broadcast.fontSize}rem`,
                display: config.broadcast.animation === 'scroll' ? 'inline-block' : 'block'
              }}>
                {config.broadcast.message}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Main Application Component
 */
export default function App() {
  // --- State ---
  const [timeLeft, setTimeLeft] = useState(300000); // Default 5 minutes in ms
  const [isActive, setIsActive] = useState(false);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [isDisplayMode, setIsDisplayMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [activeItem, setActiveItem] = useState<AgendaItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [systemClock, setSystemClock] = useState(() => new Date());
  const [showAddAgendaModal, setShowAddAgendaModal] = useState(false);
  const [newAgendaLabel, setNewAgendaLabel] = useState('');
  const [newAgendaMinutesText, setNewAgendaMinutesText] = useState('5');
  const [newAgendaColor, setNewAgendaColor] = useState('#10b981');
  const [newAgendaDescription, setNewAgendaDescription] = useState('');
  const [outputs, setOutputs] = useState<OutputTarget[]>([]);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState<number | null>(null);
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const [showDisplayHelp, setShowDisplayHelp] = useState(false);
  
  const [agenda, setAgenda] = useState<AgendaItem[]>(() => {
    const saved = localStorage.getItem('presenta-agenda-v6');
    return saved ? JSON.parse(saved) : [
      { id: '1', label: 'Opening Remarks', duration: 300, color: '#10b981', description: 'Welcome and introduction' },
      { id: '2', label: 'Keynote Session', duration: 1800, color: '#3b82f6', description: 'Main presentation' },
      { id: '3', label: 'Q&A Panel', duration: 900, color: '#f59e0b', description: 'Audience questions' },
    ];
  });

  const [config, setConfig] = useState<TimerConfig>(() => {
    const saved = localStorage.getItem('presenta-config-v6');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        showLabel: false,
        timerFontPx: typeof parsed.timerFontPx === 'number' ? parsed.timerFontPx : 380,
      };
    }
    return {
      theme: 'dark',
      fontFamily: 'font-digital',
      primaryColor: '#10b981',
      displaySize: 'lg',
      timerFontPx: 380,
      showLabel: false,
      labelColor: '#10b981',
      broadcast: {
        message: '',
        show: false,
        color: '#2563eb',
        fontSize: 4,
        animation: 'plain',
        duration: 5,
        startTime: null,
      }
    };
  });

  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const syncSenderIdRef = useRef(
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  );
  const isTauri = Boolean((window as any).__TAURI__);
 
  // --- Display Window Management ---
  const handleOpenDisplay = async (outputIndex?: number | null) => {
    // Prefer native Tauri window creation when running as a desktop app.
    // (window.open in Tauri typically opens the system browser instead of a new app window.)
    if (isTauri) {
      try {
        const tauriGlobal = (window as any).__TAURI__;
        const invoke =
          tauriGlobal?.core?.invoke ??
          tauriGlobal?.invoke;

        if (typeof invoke === 'function') {
          await invoke('open_display_window', outputIndex != null ? { output_index: outputIndex } : undefined);
          setIsDisplayOpen(true);
          return;
        }
      } catch (err) {
        console.warn('Failed to open Tauri display window.', err);
      }

      setShowDisplayHelp(true);
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('display', 'true');
    
    let windowFeatures = 'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no';

    try {
      if ('getScreenDetails' in window) {
        // @ts-ignore
        const screenDetails = await window.getScreenDetails();
        // @ts-ignore
        const target = (typeof outputIndex === 'number')
          ? screenDetails.screens[outputIndex]
          : screenDetails.screens.find((s: any) => !s.isPrimary && !s.isInternal);
        
        if (target) {
          windowFeatures = `left=${target.availLeft},top=${target.availTop},width=${target.availWidth},height=${target.availHeight},menubar=no,toolbar=no,location=no,status=no,fullscreen=yes`;
        }
      }
    } catch (err) {
      console.warn('Window Management API not supported or permission denied.');
    }

    const w = window.open(url.toString(), 'PresentaProDisplay', windowFeatures);
    if (!w) {
      setShowDisplayHelp(true);
      return;
    }
    setIsDisplayOpen(true);
  };

  const handleCloseDisplay = async () => {
    if (isTauri) {
      try {
        const tauriGlobal = (window as any).__TAURI__;
        const invoke =
          tauriGlobal?.core?.invoke ??
          tauriGlobal?.invoke;
        if (typeof invoke === 'function') {
          await invoke('close_display_window');
          setIsDisplayOpen(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to close Tauri display window.', err);
      }
    }

    try {
      // Best-effort for web: reuse window name and close if we can access it.
      const display = window.open('', 'PresentaProDisplay');
      display?.close();
    } catch {
      // ignore
    }
    setIsDisplayOpen(false);
  };

  const refreshOutputs = useCallback(async () => {
    if (isTauri) {
      try {
        const tauriGlobal = (window as any).__TAURI__;
        const invoke =
          tauriGlobal?.core?.invoke ??
          tauriGlobal?.invoke;
        if (typeof invoke === 'function') {
          const raw = await invoke('list_outputs');
          const list = (Array.isArray(raw) ? raw : []).map((m: any) => ({
            index: Number(m.index),
            name: String(m.name ?? `Display ${Number(m.index) + 1}`),
            width: Number(m.width),
            height: Number(m.height),
            x: Number(m.x),
            y: Number(m.y),
            isPrimary: Boolean(m.is_primary ?? m.isPrimary),
            scaleFactor: Number(m.scale_factor ?? m.scaleFactor),
            kind: 'tauri' as const,
          }));
          setOutputs(list);
          if (selectedOutputIndex == null) {
            const primary = list.find((o) => o.isPrimary);
            setSelectedOutputIndex(primary?.index ?? list[0]?.index ?? null);
          }
          return;
        }
      } catch (err) {
        console.warn('Failed to list outputs (Tauri).', err);
      }
      setOutputs([]);
      return;
    }

    // Web fallback (best-effort)
    try {
      if ('getScreenDetails' in window) {
        // @ts-ignore
        const screenDetails = await window.getScreenDetails();
        const list = (screenDetails?.screens ?? []).map((s: any, index: number) => ({
          index,
          name: `Screen ${index + 1}`,
          width: Number(s.width ?? s.availWidth ?? 0),
          height: Number(s.height ?? s.availHeight ?? 0),
          x: Number(s.availLeft ?? 0),
          y: Number(s.availTop ?? 0),
          isPrimary: Boolean(s.isPrimary),
          kind: 'web' as const,
        }));
        setOutputs(list);
        if (selectedOutputIndex == null) {
          const primary = list.find((o) => o.isPrimary);
          setSelectedOutputIndex(primary?.index ?? list[0]?.index ?? null);
        }
        return;
      }
    } catch (err) {
      console.warn('Failed to list outputs (Web).', err);
    }

    setOutputs([
      {
        index: 0,
        name: 'Screen 1',
        width: window.screen?.width ?? 0,
        height: window.screen?.height ?? 0,
        isPrimary: true,
        kind: 'web' as const,
      },
    ]);
    if (selectedOutputIndex == null) setSelectedOutputIndex(0);
  }, [isTauri, selectedOutputIndex]);

  // --- Effects ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('display') === 'true') {
      setIsDisplayMode(true);
    }
  }, []);

  useEffect(() => {
    document.title = isDisplayMode ? 'Presenta Pro - Display' : 'Presenta Pro';
  }, [isDisplayMode]);

  useEffect(() => {
    if (isDisplayMode) return;
    refreshOutputs();
  }, [isDisplayMode, refreshOutputs]);

  // Multi-Window Sync
  useEffect(() => {
    const channel = new BroadcastChannel('presenta_pro_v6_sync');
    
    const handleSync = (event: MessageEvent) => {
      const { type, payload, senderId } = event.data ?? {};
      if (senderId && senderId === syncSenderIdRef.current) return;
      if (type === 'SYNC_STATE') {
        if (payload.timeLeft !== undefined) setTimeLeft(payload.timeLeft);
        if (payload.isActive !== undefined) setIsActive(payload.isActive);
        if (payload.targetTime !== undefined) setTargetTime(payload.targetTime);
        if (payload.agenda) setAgenda(payload.agenda);
        if (payload.activeItem !== undefined) setActiveItem(payload.activeItem);
        if (payload.config) setConfig(payload.config);
      }
    };

    channel.onmessage = handleSync;
    return () => channel.close();
  }, []);

  // Optimized Sync
  useEffect(() => {
    if (isDisplayMode) return;
    const channel = new BroadcastChannel('presenta_pro_v6_sync');
    // Sync major state changes immediately
    channel.postMessage({
      senderId: syncSenderIdRef.current,
      type: 'SYNC_STATE',
      payload: { timeLeft, isActive, targetTime, agenda, activeItem, config }
    });
    return () => channel.close();
  }, [timeLeft, isActive, targetTime, agenda, activeItem, config, isDisplayMode]);

  // Separate effect for manual timeLeft updates (only when paused)
  useEffect(() => {
    if (isDisplayMode || isActive) return;
    const channel = new BroadcastChannel('presenta_pro_v6_sync');
    channel.postMessage({ senderId: syncSenderIdRef.current, type: 'SYNC_STATE', payload: { timeLeft, config } });
    return () => channel.close();
  }, [timeLeft, isActive, isDisplayMode, config]);

  // Timer Tick (controller drives countdown; preview/output are consumers)
  useEffect(() => {
    if (isDisplayMode || !isActive || !targetTime) return;

    const channel = new BroadcastChannel('presenta_pro_v6_sync');
    let lastSent = -1;

    const id = window.setInterval(() => {
      const remaining = Math.max(0, targetTime - Date.now());
      const next = remaining === 0 ? 0 : Math.ceil(remaining / 1000) * 1000;

      if (next !== timeLeft) setTimeLeft(next);

      if (next !== lastSent) {
        lastSent = next;
        channel.postMessage({
          senderId: syncSenderIdRef.current,
          type: 'SYNC_STATE',
          payload: { timeLeft: next, isActive, targetTime }
        });
      }

      if (next === 0) {
        setIsActive(false);
        setTargetTime(null);
      }
    }, 120);

    return () => {
      window.clearInterval(id);
      channel.close();
    };
  }, [isActive, targetTime]);

  // System Clock (wall clock for operator)
  useEffect(() => {
    const id = window.setInterval(() => setSystemClock(new Date()), 250);
    return () => window.clearInterval(id);
  }, []);

  // Broadcast Duration Logic
  useEffect(() => {
    if (config.broadcast.show && config.broadcast.startTime && config.broadcast.duration > 0) {
      const checkInterval = setInterval(() => {
        const now = Date.now();
        const elapsedMinutes = (now - config.broadcast.startTime!) / (1000 * 60);
        
        if (elapsedMinutes >= config.broadcast.duration) {
          setConfig(prev => ({
            ...prev,
            broadcast: { ...prev.broadcast, show: false, startTime: null }
          }));
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(checkInterval);
    }
  }, [config.broadcast.show, config.broadcast.startTime, config.broadcast.duration]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('presenta-agenda-v6', JSON.stringify(agenda));
    localStorage.setItem('presenta-config-v6', JSON.stringify(config));
  }, [agenda, config]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isActive) stopTimer();
          else startTimer(timeLeft);
          break;
        case 'KeyR':
          handleReset();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, agenda.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          if (agenda[selectedIndex]) applyAgendaItem(agenda[selectedIndex]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [agenda, selectedIndex]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenu && !(e.target as HTMLElement).closest('.nav-menu-container')) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  // --- Handlers ---
  const startTimer = (currentRemaining: number) => {
    const target = Date.now() + currentRemaining;
    setTargetTime(target);
    setIsActive(true);
  };

  const stopTimer = () => {
    if (isActive && targetTime) {
      const remaining = Math.max(0, targetTime - Date.now());
      setTimeLeft(remaining === 0 ? 0 : Math.ceil(remaining / 1000) * 1000);
    }
    setIsActive(false);
    setTargetTime(null);
  };

  const formatTimeLocal = (ms: number) => {
    return formatDuration(ms);
  };

  const handleReset = () => {
    stopTimer();
    setTimeLeft(300000); // Reset to 5 minutes
    setActiveItem(null);
  };

  const applyAgendaItem = (item: AgendaItem) => {
    stopTimer();
    setTimeLeft(item.duration * 1000);
    setActiveItem(item);
  };

  const applyNextAgendaItem = () => {
    if (agenda.length === 0) return;
    const currentIndex = activeItem ? agenda.findIndex(a => a.id === activeItem.id) : selectedIndex;
    const baseIndex = currentIndex >= 0 ? currentIndex : selectedIndex;
    const nextIndex = Math.min(baseIndex + 1, agenda.length - 1);
    if (nextIndex === baseIndex) return;
    setSelectedIndex(nextIndex);
    applyAgendaItem(agenda[nextIndex]);
  };

  const addAgendaItem = () => {
    setNewAgendaLabel('');
    setNewAgendaMinutesText('5');
    setNewAgendaColor(config.primaryColor);
    setNewAgendaDescription('');
    setShowAddAgendaModal(true);
  };

  const submitNewAgendaItem = () => {
    const minutes = parseInt(newAgendaMinutesText, 10);
    const safeMinutes = Number.isFinite(minutes) ? Math.max(1, minutes) : 5;
    const durationSeconds = safeMinutes * 60;
    const label = (newAgendaLabel || 'New Segment').trim();

    const newItem: AgendaItem = {
      id: Date.now().toString(),
      label,
      duration: durationSeconds,
      color: newAgendaColor || config.primaryColor,
      description: newAgendaDescription.trim() || undefined,
    };

    setAgenda(prev => {
      const next = [...prev, newItem];
      setSelectedIndex(next.length - 1);
      return next;
    });
    setShowAddAgendaModal(false);
  };

  const removeAgendaItem = (id: string) => {
    setAgenda(agenda.filter(item => item.id !== id));
  };

  const saveAgendaToFile = () => {
    const data = JSON.stringify(agenda, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenda-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadAgendaFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content);
        if (Array.isArray(imported)) setAgenda(imported);
      } catch (err) {
        console.error('Failed to load agenda', err);
      }
    };
    reader.readAsText(file);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedbackStatus('submitting');
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('https://formspree.io/f/mnjgzdbv', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setFeedbackStatus('success');
        setTimeout(() => {
          setShowFeedback(false);
          setFeedbackStatus('idle');
        }, 2000);
      } else {
        setFeedbackStatus('error');
      }
    } catch (error) {
      setFeedbackStatus('error');
    }
  };

  // --- Render ---
  if (isDisplayMode) {
    return (
      <>
        <TimerDisplay config={config} timeLeft={timeLeft} activeItem={activeItem} systemClock={systemClock} isActive={isActive} targetTime={targetTime} />
        <Analytics />
      </>
    );
  }

  const currentTheme = THEMES[config.theme];

  return (
    <div className={cn("relative h-screen flex flex-col font-sans overflow-hidden", currentTheme.bg, currentTheme.text, `theme-${config.theme}`)}>
      {/* Add Agenda Item Modal */}
      <AnimatePresence>
        {showAddAgendaModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddAgendaModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn("relative w-full max-w-lg rounded-3xl p-8 border shadow-2xl overflow-hidden", currentTheme.bg, currentTheme.border)}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={cn("text-xl font-black tracking-tight", currentTheme.text)}>Add Agenda Item</h3>
                  <p className={cn("text-xs font-medium", currentTheme.muted)}>Create a new segment with duration and color.</p>
                </div>
                <button
                  onClick={() => setShowAddAgendaModal(false)}
                  className={cn("p-2 rounded-full transition-colors", currentTheme.subtleBg, "hover:bg-red-500/20 hover:text-red-500")}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitNewAgendaItem();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", currentTheme.muted)}>Label</label>
                  <input
                    value={newAgendaLabel}
                    onChange={(e) => setNewAgendaLabel(e.target.value)}
                    placeholder="e.g. Keynote, Worship, Q&A..."
                    className={cn("w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-emerald-500 outline-none", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", currentTheme.muted)}>Duration (Min)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newAgendaMinutesText}
                      onChange={(e) => setNewAgendaMinutesText(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="5"
                      className={cn("w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-emerald-500 outline-none", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", currentTheme.muted)}>Color</label>
                    <div className={cn("w-full border rounded-xl px-3 py-2 flex items-center gap-3", currentTheme.inputBg, currentTheme.border)}>
                      <input
                        type="color"
                        value={newAgendaColor}
                        onChange={(e) => setNewAgendaColor(e.target.value)}
                        className="w-10 h-10 rounded bg-transparent border-none cursor-pointer"
                      />
                      <input
                        value={newAgendaColor}
                        onChange={(e) => setNewAgendaColor(e.target.value)}
                        className={cn("flex-1 bg-transparent border-none p-0 text-[12px] font-black font-mono focus:ring-0 outline-none", currentTheme.text)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", currentTheme.muted)}>Description (Optional)</label>
                  <textarea
                    value={newAgendaDescription}
                    onChange={(e) => setNewAgendaDescription(e.target.value)}
                    placeholder="Notes for this segment..."
                    className={cn("w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-emerald-500 outline-none resize-none h-24", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAgendaModal(false)}
                    className={cn("px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border", currentTheme.border, currentTheme.muted, "hover:opacity-80")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest bg-emerald-500 text-black hover:opacity-90"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedback(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn("relative w-full max-w-md rounded-3xl p-8 border shadow-2xl overflow-hidden", currentTheme.bg, currentTheme.border)}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <button 
                onClick={() => setShowFeedback(false)}
                className={cn("absolute top-4 right-4 p-2 rounded-full transition-colors", currentTheme.subtleBg, "hover:bg-red-500/20 hover:text-red-500")}
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className={cn("text-xl font-black tracking-tight", currentTheme.text)}>Submit Feedback</h3>
                  <p className={cn("text-xs font-medium", currentTheme.muted)}>We'd love to hear from you!</p>
                </div>
              </div>

              {feedbackStatus === 'success' ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                    <Check size={32} />
                  </div>
                  <h4 className={cn("text-lg font-black", currentTheme.text)}>Thank You!</h4>
                  <p className={cn("text-sm", currentTheme.muted)}>Your feedback has been submitted successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", currentTheme.muted)}>Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      required
                      placeholder="your@email.com"
                      className={cn("w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-emerald-500 outline-none", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", currentTheme.muted)}>Message</label>
                    <textarea 
                      name="message" 
                      required
                      placeholder="Tell us what you think..."
                      className={cn("w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-emerald-500 outline-none h-32 resize-none", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                    />
                  </div>
                  {feedbackStatus === 'error' && (
                    <p className="text-red-500 text-xs font-bold text-center">Something went wrong. Please try again.</p>
                  )}
                  <button 
                    type="submit"
                    disabled={feedbackStatus === 'submitting'}
                    className={cn(
                      "w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2",
                      feedbackStatus === 'submitting' ? "bg-slate-500 cursor-not-allowed" : "bg-emerald-500 text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                    )}
                  >
                    {feedbackStatus === 'submitting' ? (
                      <Activity size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Send Feedback
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Display Help Modal */}
      <AnimatePresence>
        {showDisplayHelp && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDisplayHelp(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn("relative w-full max-w-xl rounded-3xl p-8 border shadow-2xl overflow-hidden", currentTheme.bg, currentTheme.border)}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <button
                onClick={() => setShowDisplayHelp(false)}
                className={cn("absolute top-4 right-4 p-2 rounded-full transition-colors", currentTheme.subtleBg, "hover:bg-red-500/20 hover:text-red-500")}
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <MonitorPlay size={24} />
                </div>
                <div>
                  <h3 className={cn("text-xl font-black tracking-tight", currentTheme.text)}>Display Troubleshooting</h3>
                  <p className={cn("text-xs font-medium", currentTheme.muted)}>
                    If you previously blocked access, you can unblock it here.
                  </p>
                </div>
              </div>

              <div className={cn("space-y-4 text-sm leading-relaxed", currentTheme.text)}>
                <div className={cn("p-4 rounded-2xl border", currentTheme.subtleBg, currentTheme.border)}>
                  <div className="text-[11px] font-black uppercase tracking-widest mb-2">Desktop App (Tauri)</div>
                  <div className={cn("text-[12px] font-bold", currentTheme.muted)}>
                    Use <span className={currentTheme.text}>Settings → Outputs</span> to pick a screen and click <span className={currentTheme.text}>Turn On</span>.
                    If it opened in your browser before, that was a fallback — this modal prevents that now.
                  </div>
                </div>

                <div className={cn("p-4 rounded-2xl border", currentTheme.subtleBg, currentTheme.border)}>
                  <div className="text-[11px] font-black uppercase tracking-widest mb-2">Web Browser</div>
                  <ul className={cn("list-disc pl-5 space-y-1 text-[12px] font-bold", currentTheme.muted)}>
                    <li>Allow <span className={currentTheme.text}>Pop-ups</span> for this site (your display window is a pop-up).</li>
                    <li>In Edge/Chrome: click the lock icon → <span className={currentTheme.text}>Site permissions</span> → reset/allow permissions for this site.</li>
                    <li>If available, allow <span className={currentTheme.text}>Window management / Screen placement</span>, then refresh the page.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowDisplayHelp(false)}
                  className={cn("px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border", currentTheme.border, currentTheme.muted, "hover:opacity-80")}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <nav className={cn("h-12 border-b flex items-center px-4 gap-6 backdrop-blur-md z-50", currentTheme.navBg, currentTheme.border)}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/20 shadow-lg shadow-emerald-500/15">
            <img
              src="/android-chrome-192x192.png"
              alt="Presenta Pro"
              className="w-4.5 h-4.5 logo-emerald logo-float"
              draggable={false}
            />
          </div>
          <span className={cn("font-display font-black tracking-tighter text-lg", currentTheme.text)}>
            PRES<span className="text-emerald-500">NTA</span>
          </span>
        </div>

          <div className="flex items-center gap-2 nav-menu-container">
            {[
              { label: 'File', icon: <FileText size={14} /> },
              { label: 'Edit', icon: <Edit3 size={14} /> },
              { label: 'View', icon: <Layers size={14} /> },
              { label: 'Settings', icon: <Settings2 size={14} /> }
            ].map(menu => (
              <div key={menu.label} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === menu.label ? null : menu.label);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    activeMenu === menu.label 
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                      : "text-emerald-500 hover:bg-emerald-500/10"
                  )}
                >
                  {menu.icon}
                  {menu.label}
                </button>
                {activeMenu === menu.label && (
                  <div className={cn(
                    "absolute top-full left-0 mt-2 w-64 rounded-xl py-2 shadow-2xl z-100 border overflow-hidden backdrop-blur-xl",
                    currentTheme.bg === 'bg-white' ? "bg-white/95 border-slate-200" : "bg-black/80 border-white/10"
                  )}>
                    {menu.label === 'File' && (
                      <>
                        <button onClick={() => { saveAgendaToFile(); setActiveMenu(null); }} className={cn("w-full px-4 py-2.5 text-left text-sm flex items-center justify-between group transition-colors", "hover:bg-emerald-500/10")}>
                          <div className="flex items-center gap-3">
                            <Save size={16} className="text-blue-400" /> 
                            <span className={currentTheme.text}>Save Agenda</span>
                          </div>
                          <span className={cn("text-[10px] font-mono", currentTheme.muted)}>⌘S</span>
                        </button>
                        <button onClick={() => { fileInputRef.current?.click(); setActiveMenu(null); }} className={cn("w-full px-4 py-2.5 text-left text-sm flex items-center justify-between group transition-colors", "hover:bg-emerald-500/10")}>
                          <div className="flex items-center gap-3">
                            <Upload size={16} className="text-emerald-400" /> 
                            <span className={currentTheme.text}>Load Agenda</span>
                          </div>
                          <span className={cn("text-[10px] font-mono", currentTheme.muted)}>⌘O</span>
                        </button>
                      </>
                    )}
                    {menu.label === 'Edit' && (
                      <>
                        <button onClick={() => { addAgendaItem(); setActiveMenu(null); }} className={cn("w-full px-4 py-2.5 text-left text-sm flex items-center justify-between group transition-colors", "hover:bg-emerald-500/10")}>
                          <div className="flex items-center gap-3">
                            <Plus size={16} className="text-blue-400" /> 
                            <span className={currentTheme.text}>Add Item</span>
                          </div>
                          <span className={cn("text-[10px] font-mono", currentTheme.muted)}>⌘N</span>
                        </button>
                        <button onClick={() => { handleReset(); setActiveMenu(null); }} className={cn("w-full px-4 py-2.5 text-left text-sm flex items-center justify-between group transition-colors", "hover:bg-emerald-500/10")}>
                          <div className="flex items-center gap-3">
                            <RotateCcw size={16} className="text-red-400" /> 
                            <span className={currentTheme.text}>Reset Timer</span>
                          </div>
                          <span className={cn("text-[10px] font-mono", currentTheme.muted)}>R</span>
                        </button>
                      </>
                    )}
                    {menu.label === 'View' && (
                      <>
                        <button onClick={() => { setShowPreview(!showPreview); setActiveMenu(null); }} className={cn("w-full px-4 py-2.5 text-left text-sm flex items-center justify-between group transition-colors", "hover:bg-emerald-500/10")}>
                          <div className="flex items-center gap-3">
                            {showPreview ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-blue-400" />} 
                            <span className={currentTheme.text}>{showPreview ? 'Hide' : 'Show'} Preview</span>
                          </div>
                          <span className={cn("text-[10px] font-mono", currentTheme.muted)}>⌘P</span>
                        </button>
                        <button onClick={() => { handleOpenDisplay(); setActiveMenu(null); }} className={cn("w-full px-4 py-2.5 text-left text-sm flex items-center justify-between group transition-colors", "hover:bg-emerald-500/10")}>
                          <div className="flex items-center gap-3 font-bold text-emerald-500">
                            <MonitorPlay size={16} /> 
                            <span>Send to Monitor</span>
                          </div>
                          <span className="text-[10px] text-emerald-500/50 group-hover:text-emerald-500 font-mono">⌘D</span>
                        </button>
                      </>
                    )}
                    {menu.label === 'Settings' && (
                      <div className="px-4 py-3 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-[10px] font-black uppercase tracking-widest", currentTheme.muted)}>Display Theme</label>
                            <Palette size={10} className={currentTheme.muted} />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['dark', 'light', 'matrix', 'cyberpunk', 'minimal'] as ThemeMode[]).map(t => (
                              <button
                                key={t}
                                onClick={() => setConfig({ ...config, theme: t })}
                                className={cn(
                                  "px-2 py-1.5 rounded-lg text-[10px] font-bold capitalize border transition-all",
                                  config.theme === t 
                                    ? "bg-emerald-500 text-black border-emerald-500 shadow-lg" 
                                    : cn(currentTheme.subtleBg, currentTheme.border, currentTheme.muted, "hover:border-emerald-500/30")
                                )}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn("text-[10px] font-black uppercase tracking-widest", currentTheme.muted)}>Global Font</label>
                            <Type size={10} className={currentTheme.muted} />
                          </div>
                          <div className="relative">
                            <select 
                              className={cn("w-full border rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer pr-8", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                              value={config.fontFamily}
                              onChange={(e) => setConfig({ ...config, fontFamily: e.target.value as FontStyle })}
                            >
                              <option value="font-sans">Poppins (Sans)</option>
                              <option value="font-display">Montserrat (Display)</option>
                              <option value="font-digital">Orbitron (Digital)</option>
                              <option value="font-classic">Libre Baskerville (Classic)</option>
                              <option value="font-mono">JetBrains Mono (Mono)</option>
                              <option value="font-impact">Bebas Neue (Impact)</option>
                              <option value="font-retro">Righteous (Retro)</option>
                              <option value="font-heavy">Anton (Heavy)</option>
                              <option value="font-clean">Outfit (Clean)</option>
                              <option value="font-elegant">Playfair Display (Elegant)</option>
                            </select>
                            <ChevronRight size={12} className={cn("absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none", currentTheme.muted)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

        <div className="ml-auto flex items-center gap-6">
          <a 
            href={SOURCE_CODE_URL}
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => {
              // In Tauri, we prefer opening external links in the system browser (not navigating the WebView).
              if ((window as any).__TAURI__) {
                e.preventDefault();
                window.open(SOURCE_CODE_URL, '_blank', 'noopener,noreferrer');
              }
            }}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors group"
          >
            <Github size={14} />
            <span>Source Code</span>
          </a>
          <button 
            onClick={() => setShowFeedback(true)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors group"
          >
            <MessageCircle size={14} />
            <span>Submit Feedback</span>
          </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={loadAgendaFromFile} />
      </nav>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden pb-2">
        <PanelGroup direction="horizontal" className="min-h-0">
          {/* Sidebar: Agenda & Broadcast */}
          <Panel defaultSize={20} minSize={15} className={cn("min-h-0 flex flex-col", currentTheme.panelBg)}>
            <PanelGroup direction="vertical" className="min-h-0">
              {/* Agenda Section */}
              <Panel defaultSize={60} minSize={30} className="min-h-0 flex flex-col">
                <div className={cn("p-3 border-b flex items-center justify-between", currentTheme.border, currentTheme.subtleBg)}>
                  <div className="flex items-center gap-2">
                    <Layout size={16} className="text-emerald-500" />
                    <h2 className={cn("text-[12px] font-black uppercase tracking-[0.22em]", currentTheme.text)}>Agenda</h2>
                  </div>
                  <button onClick={addAgendaItem} className={cn("p-1.5 rounded-md transition-colors", currentTheme.subtleBg, "hover:opacity-80", currentTheme.text)}><Plus size={16} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 pb-6 space-y-2 scrollbar-thin">
                  {agenda.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      layout
                      className={cn(
                        "p-2.5 rounded-xl border transition-all cursor-pointer group",
                        activeItem?.id === item.id ? "bg-emerald-500/10 border-emerald-500/50" : 
                        selectedIndex === idx ? cn(currentTheme.subtleBg, currentTheme.border) : cn(currentTheme.subtleBg, "border-transparent hover:border-emerald-500/30")
                      )}
                      onClick={() => setSelectedIndex(idx)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <input 
                            className={cn("bg-transparent border-none p-0 text-[13px] font-black focus:ring-0 w-full", currentTheme.text)}
                            value={item.label}
                            onChange={(e) => setAgenda(agenda.map(a => a.id === item.id ? { ...a, label: e.target.value } : a))}
                          />
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeAgendaItem(item.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-red-500/50 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className={cn("text-xs font-black font-mono", currentTheme.muted)}>{formatDuration(item.duration * 1000)}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); applyAgendaItem(item); }}
                          title="Load Segment (Enter)"
                          className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative group/btn",
                            activeItem?.id === item.id ? "bg-emerald-500 text-black" : cn(currentTheme.subtleBg, "hover:opacity-80")
                          )}
                        >
                          Load
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black rounded text-[8px] font-black text-white opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                            ENTER
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Panel>

              <PanelResizeHandle
                className={cn(
                  "h-2 cursor-row-resize transition-colors",
                  "bg-emerald-500/20 hover:bg-emerald-500/50",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.35)]"
                )}
              />

              {/* Broadcast Section */}
              <Panel defaultSize={40} minSize={25} className={cn("min-h-0 flex flex-col", currentTheme.panelBg)}>
                <div className={cn("p-4 border-b flex items-center justify-between", currentTheme.border, currentTheme.subtleBg)}>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-500" />
                    <h2 className={cn("text-[14px] font-black uppercase tracking-[0.2em]", currentTheme.text)}>Broadcast</h2>
                  </div>
                  <button 
                    onClick={() => {
                      const isShowing = !config.broadcast.show;
                      setConfig(prev => ({ 
                        ...prev, 
                        broadcast: { 
                          ...prev.broadcast, 
                          show: isShowing,
                          startTime: isShowing ? Date.now() : null
                        } 
                      }));
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg",
                      config.broadcast.show 
                        ? "bg-blue-500 text-white shadow-blue-500/20" 
                        : cn(currentTheme.subtleBg, currentTheme.muted, "hover:bg-blue-500/10 hover:text-blue-500")
                    )}
                  >
                    {config.broadcast.show ? '● Live' : 'Go Live'}
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  <textarea 
                    className={cn("w-full border rounded-lg p-3 text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24 placeholder:opacity-40", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                    placeholder="Type broadcast message here..."
                    value={config.broadcast.message}
                    onChange={(e) => setConfig(prev => ({ ...prev, broadcast: { ...prev.broadcast, message: e.target.value } }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className={cn("text-[9px] font-black uppercase tracking-widest", currentTheme.muted)}>Animation</label>
                      <select 
                        className={cn("w-full border rounded-lg px-2 py-2 text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                        value={config.broadcast.animation}
                        onChange={(e) => setConfig(prev => ({ ...prev, broadcast: { ...prev.broadcast, animation: e.target.value as any } }))}
                      >
                        <option value="plain">Plain</option>
                        <option value="scroll">Scroll</option>
                        <option value="alert">Alert</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={cn("text-[9px] font-black uppercase tracking-widest", currentTheme.muted)}>Duration (Min)</label>
                      <input 
                        type="number"
                        min="0"
                        className={cn("w-full border rounded-lg px-2 py-2 text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                        value={config.broadcast.duration}
                        onChange={(e) => setConfig(prev => ({ ...prev, broadcast: { ...prev.broadcast, duration: parseInt(e.target.value) || 0 } }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className={cn("text-[9px] font-black uppercase tracking-widest", currentTheme.muted)}>Text Size</label>
                      <select 
                        className={cn("w-full border rounded-lg px-2 py-2 text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                        value={config.broadcast.fontSize}
                        onChange={(e) => setConfig(prev => ({ ...prev, broadcast: { ...prev.broadcast, fontSize: parseInt(e.target.value) } }))}
                      >
                        <option value={2}>Small</option>
                        <option value={4}>Medium</option>
                        <option value={6}>Large</option>
                        <option value={8}>Extra Large</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={cn("text-[9px] font-black uppercase tracking-widest", currentTheme.muted)}>Bar Color</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={config.broadcast.color}
                          onChange={(e) => setConfig(prev => ({ ...prev, broadcast: { ...prev.broadcast, color: e.target.value } }))}
                          className="w-8 h-8 rounded bg-transparent border-none cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={config.broadcast.color}
                          onChange={(e) => setConfig(prev => ({ ...prev, broadcast: { ...prev.broadcast, color: e.target.value } }))}
                          className={cn("flex-1 border rounded-lg px-2 py-2 text-[10px] font-black font-mono focus:ring-1 focus:ring-blue-500 outline-none", currentTheme.inputBg, currentTheme.border, currentTheme.text)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle
            className={cn(
              "w-2 cursor-col-resize transition-colors",
              "bg-emerald-500/20 hover:bg-emerald-500/50",
              "shadow-[inset_1px_0_0_rgba(255,255,255,0.12),inset_-1px_0_0_rgba(0,0,0,0.35)]"
            )}
          />

          {/* Main View: Controller */}
          <Panel
            defaultSize={50}
            minSize={30}
            className={cn(
              "min-h-0 flex flex-col items-center relative overflow-y-auto",
              "p-4 pt-12 pb-5 lg:p-10 lg:pt-24 lg:pb-10",
              currentTheme.bg
            )}
          >
            <div className={cn("absolute top-3 left-4 flex items-center gap-2", currentTheme.muted)}>
              <Activity size={15} className="text-emerald-500" />
              <span className="text-[11px] font-black uppercase tracking-[0.34em]">Live Control</span>
            </div>
            <div className={cn("absolute top-3 right-4 flex items-center gap-2", currentTheme.muted)}>
              <Clock size={15} className="text-blue-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">{formatSystemClock(systemClock)}</span>
            </div>

            <div className={cn(
              config.fontFamily,
              "inline-flex font-black tabular-nums leading-none mb-4 sm:mb-6 lg:mb-8 relative whitespace-nowrap select-none",
              currentTheme.text,
            )} style={{
              fontSize: 'clamp(4.75rem, 14vh, 10rem)',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum"',
            }}>
              <TimerText ms={timeLeft} />
            </div>

            {/* Status Indicators for Controller (only these animate / change color) */}
            <div className="mb-4 sm:mb-6 lg:mb-10 h-12 flex items-center justify-center">
              {timeLeft === 0 ? (
                <div
                  className="text-red-600 font-black uppercase tracking-[0.35em] text-4xl"
                  style={{ lineHeight: '1' }}
                >
                  TIME UP
                </div>
              ) : (timeLeft > 0 && timeLeft <= 60000) ? (
                <div
                  className="text-yellow-400 font-black uppercase tracking-[0.25em] text-3xl"
                  style={{ lineHeight: '1' }}
                >
                  ROUND UP NOW
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-4 lg:gap-8 mb-8 lg:mb-16">
              {!isActive ? (
                <button 
                  onClick={() => startTimer(timeLeft)}
                  disabled={timeLeft === 0}
                  title="Start Timer (Space)"
                  className="w-18 h-18 lg:w-24 lg:h-24 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-2xl shadow-emerald-500/20 disabled:opacity-20 relative group"
                >
                  <Play size={30} fill="currentColor" className="ml-1" />
                  <div className={cn("absolute -bottom-11 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border", currentTheme.bg === 'bg-white' ? "bg-slate-900 text-white border-slate-800" : "bg-black/80 text-white border-white/10")}>
                    SPACE TO START
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => stopTimer()}
                  title="Pause Timer (Space)"
                  className="w-18 h-18 lg:w-24 lg:h-24 rounded-full border-4 border-emerald-500 text-emerald-500 flex items-center justify-center relative group"
                >
                  <Pause size={30} fill="currentColor" />
                  <div className={cn("absolute -bottom-11 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border", currentTheme.bg === 'bg-white' ? "bg-slate-900 text-white border-slate-800" : "bg-black/80 text-white border-white/10")}>
                    SPACE TO PAUSE
                  </div>
                </button>
              )}
              <button
                onClick={applyNextAgendaItem}
                disabled={agenda.length === 0 || (activeItem ? agenda.findIndex(a => a.id === activeItem.id) : selectedIndex) >= agenda.length - 1}
                title="Next Agenda Item"
                className={cn(
                  "w-18 h-18 lg:w-24 lg:h-24 rounded-full flex items-center justify-center relative group border disabled:opacity-20",
                  currentTheme.subtleBg,
                  currentTheme.border,
                  currentTheme.text,
                  "hover:opacity-80"
                )}
              >
                <ChevronRight size={30} />
                <div className={cn("absolute -bottom-11 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border", currentTheme.bg === 'bg-white' ? "bg-slate-900 text-white border-slate-800" : "bg-black/80 text-white border-white/10")}>
                  NEXT
                </div>
              </button>
              <button 
                onClick={handleReset}
                title="Reset Timer (R)"
                className={cn("w-18 h-18 lg:w-24 lg:h-24 rounded-full flex items-center justify-center relative group border", currentTheme.subtleBg, currentTheme.border, currentTheme.text, "hover:opacity-80")}
              >
                <RotateCcw size={30} />
                <div className={cn("absolute -bottom-11 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border", currentTheme.bg === 'bg-white' ? "bg-slate-900 text-white border-slate-800" : "bg-black/80 text-white border-white/10")}>
                  R TO RESET
                </div>
              </button>
            </div>

            <div className="w-full max-w-xl space-y-3 lg:space-y-6 pb-6">
              <div className={cn("flex items-center gap-3 p-3 lg:p-4 rounded-2xl border focus-within:border-emerald-500/50 transition-all group", currentTheme.subtleBg, currentTheme.border)}>
                <Clock size={20} className={cn("transition-colors", currentTheme.muted, "group-focus-within:text-emerald-500")} />
                <input 
                  type="number" 
                  placeholder="Set Minutes Manually..." 
                  className={cn("bg-transparent border-none p-0 focus:ring-0 text-base font-black w-full placeholder:opacity-40", currentTheme.text)} 
                  onChange={(e) => { 
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      stopTimer();
                      setTimeLeft(val * 60 * 1000); 
                      setActiveItem(null); 
                    }
                  }} 
                />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", currentTheme.muted)}>Minutes</span>
              </div>

              <div className="grid grid-cols-4 gap-2 lg:gap-3">
                {[1, 5, 10, 15, 20, 30, 45, 60].map(m => (
                  <button 
                    key={m}
                    onClick={() => { 
                      stopTimer();
                      setTimeLeft(m * 60 * 1000); 
                      setActiveItem(null); 
                    }}
                    className={cn("py-2.5 lg:py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest hover:border-emerald-500/50 hover:bg-emerald-500/5", currentTheme.subtleBg, currentTheme.border, currentTheme.muted, "hover:text-inherit")}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Bar for Controller */}
            <AnimatePresence>
              {config.broadcast.show && config.broadcast.message && (
                <motion.div
                  key="broadcast-bar-controller"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className={cn(
                    "absolute bottom-0 left-0 w-full flex items-center overflow-hidden border-t z-100",
                    currentTheme.border,
                    "h-[8vh]",
                    config.broadcast.animation === 'alert' && "animate-alert"
                  )}
                  style={{ backgroundColor: config.broadcast.color }}
                >
                  <div className={cn(
                    "w-full text-white font-black uppercase tracking-widest text-center px-8 whitespace-nowrap",
                    config.broadcast.animation === 'scroll' && "marquee"
                  )} style={{ 
                    fontSize: '2rem',
                    display: config.broadcast.animation === 'scroll' ? 'inline-block' : 'block'
                  }}>
                    {config.broadcast.message}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>

          <PanelResizeHandle
            className={cn(
              "w-2 cursor-col-resize transition-colors",
              "bg-emerald-500/20 hover:bg-emerald-500/50",
              "shadow-[inset_1px_0_0_rgba(255,255,255,0.12),inset_-1px_0_0_rgba(0,0,0,0.35)]"
            )}
          />

          {/* Right Panel: Settings & Preview */}
          <Panel defaultSize={30} minSize={20} className={cn("min-h-0 flex flex-col", currentTheme.panelBg)}>
            <PanelGroup direction="vertical" className="min-h-0 flex-1">
              <Panel defaultSize={35} minSize={18} className="min-h-0">
                {/* Preview Monitor */}
                <div className={cn("h-full p-4 border-b border-b-emerald-500/20 flex flex-col", currentTheme.border)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Monitor size={14} className="text-blue-500" />
                      <span className={cn("text-[11px] font-black uppercase tracking-widest", currentTheme.muted)}>Preview Monitor</span>
                    </div>
                    <button onClick={() => handleOpenDisplay(selectedOutputIndex)} className={cn("p-1.5 rounded-md text-emerald-500", currentTheme.subtleBg, "hover:opacity-80")}><Maximize2 size={14} /></button>
                  </div>
                  <div className="w-full sm:max-w-[360px] mx-auto">
                    <div
                      className={cn(
                        "aspect-video bg-black rounded-xl border overflow-hidden relative shadow-2xl",
                        currentTheme.border,
                        "border-emerald-500/20"
                      )}
                    >
                      {showPreview ? <TimerDisplay config={config} timeLeft={timeLeft} activeItem={activeItem} systemClock={systemClock} isActive={isActive} targetTime={targetTime} isPreview /> : (
                        <div className={cn("absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em]", currentTheme.muted, "opacity-20")}>Signal Lost</div>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle
                className={cn(
                  "h-2 cursor-row-resize transition-colors",
                  "bg-emerald-500/20 hover:bg-emerald-500/50",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.35)]"
                )}
              />

              <Panel defaultSize={65} minSize={30} className="min-h-0">
                {/* Appearance Settings */}
                <div className="h-full overflow-y-auto p-4 lg:p-6 pb-6 space-y-4 lg:space-y-6 scrollbar-thin">
              {/* Outputs */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MonitorPlay size={14} className="text-emerald-500" />
                    <h3 className={cn("text-[10px] font-black uppercase tracking-widest", currentTheme.text)}>Outputs</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => refreshOutputs()}
                      className={cn("p-2 rounded-lg border transition-colors", currentTheme.subtleBg, currentTheme.border, "hover:opacity-80")}
                      title="Refresh outputs"
                      type="button"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      onClick={() => setShowDisplayHelp(true)}
                      className={cn("p-2 rounded-lg border transition-colors", currentTheme.subtleBg, currentTheme.border, "hover:opacity-80")}
                      title="Help"
                      type="button"
                    >
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </div>

                <div className={cn("p-4 rounded-2xl border space-y-3", currentTheme.subtleBg, currentTheme.border)}>
                  {outputs.length === 0 ? (
                    <div className={cn("text-[11px] font-bold", currentTheme.muted)}>
                      No outputs detected yet. Click refresh or open the display once.
                    </div>
                  ) : (
                    <div className="max-h-44 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                      {outputs.map((o) => (
                        <button
                          key={`${o.kind}-${o.index}`}
                          type="button"
                          onClick={() => setSelectedOutputIndex(o.index)}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                            currentTheme.border,
                            selectedOutputIndex === o.index ? "bg-emerald-500/15 border-emerald-500/40" : "hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center",
                              selectedOutputIndex === o.index ? "border-emerald-500" : currentTheme.border
                            )}>
                              {selectedOutputIndex === o.index && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                            </div>
                            <div>
                              <div className={cn("text-[12px] font-black", currentTheme.text)}>{o.name}</div>
                              <div className={cn("text-[10px] font-bold", currentTheme.muted)}>
                                {o.width}×{o.height}{o.isPrimary ? ' • Primary' : ''}
                              </div>
                            </div>
                          </div>
                          <div className={cn("text-[10px] font-black uppercase tracking-widest", currentTheme.muted)}>
                            {o.kind === 'tauri' ? 'Desktop' : 'Web'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className={cn("text-[10px] font-black uppercase tracking-widest", currentTheme.muted)}>
                      Output: {selectedOutputIndex == null ? 'Auto' : `#${selectedOutputIndex + 1}`}
                    </div>
                    {isDisplayOpen ? (
                      <button
                        onClick={handleCloseDisplay}
                        type="button"
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-300 hover:bg-red-500/30"
                      >
                        Turn Off
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenDisplay(selectedOutputIndex)}
                        type="button"
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-black hover:opacity-90"
                      >
                        Turn On
                      </button>
                    )}
                  </div>

                  {!isTauri && (
                    <div className={cn("text-[10px] font-bold leading-relaxed", currentTheme.muted)}>
                      Web note: your browser may block pop-ups or screen placement. If the display doesn’t open, click Help.
                    </div>
                  )}
                </div>
              </section>

              {/* Timer Size */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Maximize2 size={14} className="text-emerald-500" />
                  <h3 className={cn("text-[10px] font-black uppercase tracking-widest", currentTheme.text)}>Timer Size</h3>
                </div>
                <div className={cn("p-4 rounded-2xl border", currentTheme.subtleBg, currentTheme.border)}>
                  <div className={cn("mb-2 text-[11px] font-black uppercase tracking-widest", currentTheme.muted)}>
                    Output: {clampTimerFontPx(config.timerFontPx || 380)}px
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={600}
                    step={5}
                    value={clampTimerFontPx(config.timerFontPx || 380)}
                    onChange={(e) => {
                      const next = clampTimerFontPx(parseInt(e.target.value, 10) || 380);
                      setConfig({ ...config, timerFontPx: next });
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </section>

              {/* Colors */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className={cn("text-[10px] font-black uppercase tracking-widest", currentTheme.text)}>Primary Color</h3>
                </div>
                <div className="flex gap-3">
                  {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ffffff'].map(c => (
                    <button
                      key={c}
                      onClick={() => setConfig({ ...config, primaryColor: c, labelColor: c })}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        config.primaryColor === c ? "border-white scale-110" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value, labelColor: e.target.value })}
                    className="w-8 h-8 rounded-full bg-transparent border-none p-0 cursor-pointer"
                  />
                </div>
              </section>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Bottom safe area + separator (keeps UI off the taskbar edge) */}
      <div className="shrink-0 h-4 border-t-2 border-emerald-500/70 bg-transparent" />
      <Analytics />
    </div>
  );
}
