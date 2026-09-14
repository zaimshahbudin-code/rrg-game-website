import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, getDocs, collection, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, saveQuizScore, saveGameRecord, subscribeToAuth } from './firebase';
import AdminDashboard from './AdminDashboard';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  BookOpen, CheckCircle, Maximize, MousePointerClick, Activity,
  Move, FlipHorizontal, RotateCw, CheckCircle2, XCircle, Trophy,
  ArrowRight, RefreshCw, HelpCircle, Calculator, Infinity as InfinityIcon,
  Shapes, Wand2, AlertCircle, Triangle, Square, Trash2, ChevronDown,
  PlayCircle, Loader2, Grid, ZoomIn, ZoomOut, Home, TrendingUp, Info, Languages,
  LogIn, ShieldCheck, UserRound, KeyRound, LogOut
} from 'lucide-react';

const TUTORIAL_STEP_IDLE_CLASS = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
const TUTORIAL_STEP_ACTIVE_GRADIENT_CLASS = 'bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white font-bold shadow-md';

const NOTE_LAYOUT_THEMES = {
  ocean: {
    key: 'ocean',
    label: { en: 'Ocean', ms: 'Laut' },
    swatch: 'from-sky-500 to-cyan-400',
    buttonIdle: 'border-sky-100 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50',
    buttonActive: 'border-sky-300 bg-sky-50 text-sky-800 shadow-sm',
    sectionRule: 'border-sky-100',
    sectionBadge: 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm',
    matrixChip: 'border-sky-300 bg-gradient-to-b from-white to-sky-100 text-sky-900',
    infoPanel: 'bg-gradient-to-r from-sky-50 to-cyan-50',
    infoTitle: 'text-sky-900',
    infoText: 'text-sky-800',
    animationCard: 'bg-gradient-to-br from-white via-sky-50 to-cyan-100 border-sky-200',
    animationLabel: 'text-sky-600',
    stepperWrap: 'bg-gradient-to-br from-white via-sky-50 to-cyan-50 border-sky-100',
    stepperTitle: 'text-sky-800',
    stepActive: TUTORIAL_STEP_ACTIVE_GRADIENT_CLASS,
    svg: {
      primary: '#2563eb',
      primarySoft: 'rgba(37, 99, 235, 0.28)',
      primaryDark: '#1d4ed8',
      secondary: '#0ea5e9',
      secondaryDark: '#0369a1',
      accent: '#f59e0b',
      accentDark: '#d97706',
      danger: '#ef4444',
      dangerDark: '#b91c1c',
      mirror: '#0891b2',
      mirrorDark: '#0f766e',
      light: '#e0f2fe',
      contrast: '#0f172a',
    },
  },
  mint: {
    key: 'mint',
    label: { en: 'Mint', ms: 'Pudina' },
    swatch: 'from-emerald-500 to-teal-400',
    buttonIdle: 'border-emerald-100 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50',
    buttonActive: 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm',
    sectionRule: 'border-emerald-100',
    sectionBadge: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm',
    matrixChip: 'border-emerald-300 bg-gradient-to-b from-white to-emerald-100 text-emerald-900',
    infoPanel: 'bg-gradient-to-r from-emerald-50 to-teal-50',
    infoTitle: 'text-emerald-900',
    infoText: 'text-emerald-800',
    animationCard: 'bg-gradient-to-br from-white via-emerald-50 to-teal-100 border-emerald-200',
    animationLabel: 'text-emerald-600',
    stepperWrap: 'bg-gradient-to-br from-white via-emerald-50 to-teal-50 border-emerald-100',
    stepperTitle: 'text-emerald-800',
    stepActive: TUTORIAL_STEP_ACTIVE_GRADIENT_CLASS,
    svg: {
      primary: '#059669',
      primarySoft: 'rgba(5, 150, 105, 0.28)',
      primaryDark: '#047857',
      secondary: '#14b8a6',
      secondaryDark: '#0f766e',
      accent: '#f59e0b',
      accentDark: '#d97706',
      danger: '#ef4444',
      dangerDark: '#b91c1c',
      mirror: '#10b981',
      mirrorDark: '#047857',
      light: '#ccfbf1',
      contrast: '#052e2b',
    },
  },
  sunset: {
    key: 'sunset',
    label: { en: 'Sunset', ms: 'Senja' },
    swatch: 'from-orange-500 to-rose-400',
    buttonIdle: 'border-orange-100 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50',
    buttonActive: 'border-orange-300 bg-orange-50 text-orange-800 shadow-sm',
    sectionRule: 'border-orange-100',
    sectionBadge: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm',
    matrixChip: 'border-orange-300 bg-gradient-to-b from-white to-orange-100 text-orange-900',
    infoPanel: 'bg-gradient-to-r from-orange-50 to-rose-50',
    infoTitle: 'text-orange-900',
    infoText: 'text-orange-800',
    animationCard: 'bg-gradient-to-br from-white via-orange-50 to-rose-100 border-orange-200',
    animationLabel: 'text-orange-600',
    stepperWrap: 'bg-gradient-to-br from-white via-orange-50 to-rose-50 border-orange-100',
    stepperTitle: 'text-orange-800',
    stepActive: TUTORIAL_STEP_ACTIVE_GRADIENT_CLASS,
    svg: {
      primary: '#f97316',
      primarySoft: 'rgba(249, 115, 22, 0.28)',
      primaryDark: '#c2410c',
      secondary: '#fb7185',
      secondaryDark: '#e11d48',
      accent: '#facc15',
      accentDark: '#ca8a04',
      danger: '#e11d48',
      dangerDark: '#be123c',
      mirror: '#fb7185',
      mirrorDark: '#be123c',
      light: '#ffedd5',
      contrast: '#431407',
    },
  },
  royal: {
    key: 'royal',
    label: { en: 'Royal', ms: 'Diraja' },
    swatch: 'from-violet-500 to-indigo-500',
    buttonIdle: 'border-violet-100 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50',
    buttonActive: 'border-violet-300 bg-violet-50 text-violet-800 shadow-sm',
    sectionRule: 'border-violet-100',
    sectionBadge: 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm',
    matrixChip: 'border-violet-300 bg-gradient-to-b from-white to-violet-100 text-violet-900',
    infoPanel: 'bg-gradient-to-r from-violet-50 to-indigo-50',
    infoTitle: 'text-violet-900',
    infoText: 'text-violet-800',
    animationCard: 'bg-gradient-to-br from-white via-violet-50 to-indigo-100 border-violet-200',
    animationLabel: 'text-violet-600',
    stepperWrap: 'bg-gradient-to-br from-white via-violet-50 to-indigo-50 border-violet-100',
    stepperTitle: 'text-violet-800',
    stepActive: TUTORIAL_STEP_ACTIVE_GRADIENT_CLASS,
    svg: {
      primary: '#7c3aed',
      primarySoft: 'rgba(124, 58, 237, 0.28)',
      primaryDark: '#5b21b6',
      secondary: '#6366f1',
      secondaryDark: '#4338ca',
      accent: '#f59e0b',
      accentDark: '#d97706',
      danger: '#ef4444',
      dangerDark: '#b91c1c',
      mirror: '#8b5cf6',
      mirrorDark: '#6d28d9',
      light: '#ede9fe',
      contrast: '#312e81',
    },
  },
};

const DEFAULT_NOTE_LAYOUT_THEME = NOTE_LAYOUT_THEMES.ocean;

// =====================================================================
// 1. KOMPONEN NOTA & STEPPER (SEKSYEN 1)
// =====================================================================

const TranslasiStepper = ({ lang, theme = DEFAULT_NOTE_LAYOUT_THEME }) => {
  const [step, setStep] = useState(1);
  const palette = theme || DEFAULT_NOTE_LAYOUT_THEME;
  return (
    <div className={`border-2 rounded-xl p-4 md:p-6 mt-6 shadow-inner ${palette.stepperWrap}`}>
      <h3 className={`font-bold mb-4 flex items-center gap-2 ${palette.stepperTitle}`}>
        <MousePointerClick size={18} /> {lang === 'en' ? 'Tutorial: How to Draw the Image After a Translation' : 'Tutorial: Cara Melukis Imej Translasi'}
      </h3>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 space-y-3 w-full">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm font-semibold text-slate-600 mb-3">{lang === 'en' ? 'Click the steps below:' : 'Tekan langkah di bawah:'}</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setStep(1)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 1 ? palette.stepActive : TUTORIAL_STEP_IDLE_CLASS}`}>
                1. {lang === 'en' ? 'Choose a reference vertex (Example: Point A).' : 'Pilih satu bucu rujukan (Contoh: Titik A).'}
              </button>
              <button onClick={() => setStep(2)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 2 ? palette.stepActive : TUTORIAL_STEP_IDLE_CLASS}`}>
                2. {lang === 'en' ? 'Move along the x-axis (e.g., 4 units to the right).' : 'Gerak paksi-x (contoh: ke kanan 4 petak).'}
              </button>
              <button onClick={() => setStep(3)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 3 ? palette.stepActive : TUTORIAL_STEP_IDLE_CLASS}`}>
                3. {lang === 'en' ? "Move along the y-axis (e.g., 3 units down). Mark A'." : "Gerak paksi-y (contoh: ke bawah 3 petak). Tandakan A'."}
              </button>
              <button onClick={() => setStep(4)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 4 ? palette.stepActive : TUTORIAL_STEP_IDLE_CLASS}`}>
                4. {lang === 'en' ? 'Repeat for the other vertices and complete the image.' : 'Ulang langkah untuk bucu lain & lengkapkan imej.'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-[250px] h-[250px] shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
          <svg width="250" height="250" viewBox="0 0 100 100">
            <pattern id="gridT" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#gridT)" />
            <circle cx="20" cy="40" r="2" fill={palette.svg.primaryDark} />
            <text x="13" y="38" fontSize="6" fill={palette.svg.primaryDark} fontWeight="bold">A</text>
            <polygon points="20,40 40,40 20,60" fill={palette.svg.primarySoft} stroke={palette.svg.primaryDark} strokeWidth="1" />

            {step >= 1 && <circle cx="20" cy="40" r="4" fill="none" stroke={palette.svg.accent} strokeWidth="1.5" className="animate-pulse" />}
            {step >= 2 && (
              <g>
                <path d="M 20 40 L 60 40" fill="none" stroke={palette.svg.secondary} strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#arrowH)" />
                <text x="32" y="38" fontSize="4" fill={palette.svg.secondaryDark} fontWeight="bold">{lang === 'en' ? '+4 x-axis' : '+4 paksi-x'}</text>
              </g>
            )}
            {step >= 3 && (
              <g>
                <path d="M 60 40 L 60 70" fill="none" stroke={palette.svg.danger} strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#arrowV)" />
                <text x="62" y="55" fontSize="4" fill={palette.svg.dangerDark} fontWeight="bold">{lang === 'en' ? '-3 y-axis' : '-3 paksi-y'}</text>
                <circle cx="60" cy="70" r="2" fill={palette.svg.dangerDark} />
                <text x="63" y="73" fontSize="6" fill={palette.svg.dangerDark} fontWeight="bold">A'</text>
              </g>
            )}
            {step >= 4 && (
              <g>
                <polygon points="60,70 80,70 60,90" fill="rgba(239, 68, 68, 0.28)" stroke={palette.svg.dangerDark} strokeWidth="1" strokeDasharray="2,1" />
                <path d="M 40 40 L 80 70" fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" />
                <path d="M 20 60 L 60 90" fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" />
              </g>
            )}

            <defs>
              <marker id="arrowH" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><polygon points="0,0 4,2 0,4" fill={palette.svg.secondary} /></marker>
              <marker id="arrowV" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><polygon points="0,0 4,2 0,4" fill={palette.svg.danger} /></marker>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

const PantulanStepper = ({ lang, theme = DEFAULT_NOTE_LAYOUT_THEME }) => {
  const [step, setStep] = useState(1);
  const palette = theme || DEFAULT_NOTE_LAYOUT_THEME;
  return (
    <div className={`border-2 rounded-xl p-4 md:p-6 mt-6 shadow-inner ${palette.stepperWrap}`}>
      <h3 className={`font-bold mb-4 flex items-center gap-2 ${palette.stepperTitle}`}>
        <MousePointerClick size={18} /> {lang === 'en' ? 'Tutorial: How to Draw the Image After a Reflection' : 'Tutorial: Cara Melukis Imej Pantulan'}
      </h3>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 space-y-3 w-full">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm font-semibold text-slate-600 mb-3">{lang === 'en' ? 'Click the steps below:' : 'Tekan langkah di bawah:'}</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setStep(1)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 1 ? palette.stepActive : TUTORIAL_STEP_IDLE_CLASS}`}>
                1. {lang === 'en' ? 'Identify the reflection axis (Mirror Line).' : 'Kenal pasti paksi pantulan (Garis Cermin).'}
              </button>
              <button onClick={() => setStep(2)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 2 ? palette.stepActive : TUTORIAL_STEP_IDLE_CLASS}`}>
                2. {lang === 'en' ? 'Draw a perpendicular line from vertex (A) to the mirror.' : 'Lukis garis serenjang dari bucu (A) ke cermin.'}
              </button>
              <button onClick={() => setStep(3)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 3 ? palette.stepActive : TUTORIAL_STEP_IDLE_CLASS}`}>
                3. {lang === 'en' ? "Measure the same distance to the other side. Mark (A')." : "Ukur jarak yang sama ke sebelah sana. Tandakan (A')."}
              </button>
              <button onClick={() => setStep(4)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 4 ? palette.stepActive : TUTORIAL_STEP_IDLE_CLASS}`}>
                4. {lang === 'en' ? 'Repeat for other points and draw the final shape.' : 'Ulang untuk titik lain dan lukis bentuk akhir.'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-[250px] h-[250px] shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
          <svg width="250" height="250" viewBox="0 0 100 100">
            <pattern id="gridP" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#gridP)" />

            <polygon points="20,30 40,30 20,60" fill={palette.svg.primarySoft} stroke={palette.svg.primaryDark} strokeWidth="1" />
            <circle cx="40" cy="30" r="2" fill={palette.svg.primaryDark} />
            <text x="35" y="27" fontSize="6" fill={palette.svg.primaryDark} fontWeight="bold">A</text>

            {step >= 1 && (
              <g>
                <line x1="60" y1="10" x2="60" y2="90" stroke={palette.svg.accent} strokeWidth="2" strokeDasharray="4,2" />
                <text x="62" y="15" fontSize="4" fill={palette.svg.accentDark} fontWeight="bold">{lang === 'en' ? 'Mirror' : 'Cermin'}</text>
              </g>
            )}
            {step >= 2 && (
              <g>
                <line x1="40" y1="30" x2="60" y2="30" stroke={palette.svg.secondary} strokeWidth="1.5" strokeDasharray="2,2" />
                <text x="43" y="27" fontSize="4" fill={palette.svg.secondaryDark} fontWeight="bold">{lang === 'en' ? '2 units' : '2 unit'}</text>
                <rect x="58" y="30" width="2" height="2" fill="none" stroke={palette.svg.secondaryDark} strokeWidth="0.5" />
              </g>
            )}
            {step >= 3 && (
              <g>
                <line x1="60" y1="30" x2="80" y2="30" stroke={palette.svg.danger} strokeWidth="1.5" strokeDasharray="2,2" />
                <text x="65" y="27" fontSize="4" fill={palette.svg.danger} fontWeight="bold">{lang === 'en' ? '2 units' : '2 unit'}</text>
                <circle cx="80" cy="30" r="2" fill={palette.svg.dangerDark} />
                <text x="82" y="27" fontSize="6" fill={palette.svg.dangerDark} fontWeight="bold">A'</text>
              </g>
            )}
            {step >= 4 && (
              <g>
                <polygon points="100,30 80,30 100,60" fill="rgba(239, 68, 68, 0.28)" stroke={palette.svg.dangerDark} strokeWidth="1" strokeDasharray="2,1" />
                <line x1="20" y1="30" x2="100" y2="30" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="20" y1="60" x2="100" y2="60" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

const PutaranStepper = ({ lang }) => {
  const [step, setStep] = useState(1);
  return (
    <div className="bg-slate-50 border-2 border-purple-100 rounded-xl p-4 md:p-6 mt-6 shadow-inner">
      <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
        <MousePointerClick size={18} /> {lang === 'en' ? 'Tutorial: How to Draw the Image After a Rotation (90° Clockwise)' : 'Tutorial: Cara Melukis Imej Putaran (90° Ikut Jam)'}
      </h3>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 space-y-3 w-full">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm font-semibold text-slate-600 mb-3">{lang === 'en' ? 'Click the steps below:' : 'Tekan langkah di bawah:'}</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setStep(1)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 1 ? TUTORIAL_STEP_ACTIVE_GRADIENT_CLASS : TUTORIAL_STEP_IDLE_CLASS}`}>
                1. {lang === 'en' ? 'Draw a straight line from vertex (A) to the Center of Rotation.' : 'Sambung garis lurus dari bucu (A) ke Pusat Putaran.'}
              </button>
              <button onClick={() => setStep(2)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 2 ? TUTORIAL_STEP_ACTIVE_GRADIENT_CLASS : TUTORIAL_STEP_IDLE_CLASS}`}>
                2. {lang === 'en' ? 'Measure 90° clockwise from that line.' : 'Ukur 90° ikut arah jam dari garisan tersebut.'}
              </button>
              <button onClick={() => setStep(3)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 3 ? TUTORIAL_STEP_ACTIVE_GRADIENT_CLASS : TUTORIAL_STEP_IDLE_CLASS}`}>
                3. {lang === 'en' ? "Transfer the line at the same distance. Mark (A')." : "Pindah garisan pada jarak yang sama. Tandakan (A')."}
              </button>
              <button onClick={() => setStep(4)} className={`text-left px-4 py-2 text-sm rounded-md transition-all ${step === 4 ? TUTORIAL_STEP_ACTIVE_GRADIENT_CLASS : TUTORIAL_STEP_IDLE_CLASS}`}>
                4. {lang === 'en' ? 'Repeat for other points & draw the final image.' : 'Ulang untuk titik lain & lukis imej akhir.'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-[250px] h-[250px] shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
          <svg width="250" height="250" viewBox="0 0 100 100">
            <pattern id="gridR" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#gridR)" />

            <polygon points="20,20 40,20 20,40" fill="rgba(59, 130, 246, 0.4)" stroke="#1e40af" strokeWidth="1" />
            <circle cx="40" cy="20" r="2" fill="#1e40af" />
            <text x="35" y="17" fontSize="6" fill="#1e40af" fontWeight="bold">A</text>

            {step >= 1 && (
              <g>
                <circle cx="40" cy="60" r="3" fill="#000" />
                <text x="43" y="65" fontSize="4" fontWeight="bold">{lang === 'en' ? 'Center' : 'Pusat'}</text>
                <line x1="40" y1="20" x2="40" y2="60" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2" />
              </g>
            )}
            {step >= 2 && (
              <g>
                <path d="M 40 30 A 30 30 0 0 1 70 60" fill="none" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#arrowArc)" />
                <text x="50" y="45" fontSize="4" fill="#7c3aed" fontWeight="bold">90°</text>
                <rect x="40" y="55" width="5" height="5" fill="none" stroke="#8b5cf6" strokeWidth="0.5" />
              </g>
            )}
            {step >= 3 && (
              <g>
                <line x1="40" y1="60" x2="80" y2="60" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                <circle cx="80" cy="60" r="2" fill="#b91c1c" />
                <text x="82" y="58" fontSize="6" fill="#b91c1c" fontWeight="bold">A'</text>
              </g>
            )}
            {step >= 4 && (
              <g>
                <polygon points="80,60 80,80 60,80" fill="rgba(239, 68, 68, 0.4)" stroke="#b91c1c" strokeWidth="1" strokeDasharray="2,1" />
                <line x1="20" y1="20" x2="40" y2="60" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="1,2" />
                <line x1="40" y1="60" x2="80" y2="80" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="1,2" />
              </g>
            )}
            <defs>
              <marker id="arrowArc" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><polygon points="0,0 4,2 0,4" fill="#8b5cf6" /></marker>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

const SectionNota = ({ lang }) => {
  const [layoutThemeKey, setLayoutThemeKey] = useState('ocean');
  const layoutTheme = NOTE_LAYOUT_THEMES[layoutThemeKey] || DEFAULT_NOTE_LAYOUT_THEME;
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 lg:space-y-10">
      {/* 11.1 Transformasi */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-100 pb-3 mb-6 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-lg">11.1</span> 
          {lang === 'en' ? 'Introduction to Transformations' : 'Pengenalan Transformasi'}
        </h2>
        <div className="grid xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)] gap-8 items-start">
          <div className="prose prose-slate max-w-none">
            <p className="text-lg leading-relaxed text-slate-700">
              {lang === 'en' ? (
                <><strong>Transformation</strong> is a movement that changes the position, orientation, or size of an object to produce an image. The original object is called the <strong>Object</strong>, while the resulting shape is called the <strong>Image</strong>.</>
              ) : (
                <><strong>Transformasi</strong> ialah suatu pergerakan yang mengubah kedudukan, orientasi atau saiz suatu objek untuk menghasilkan imej. Objek asal dipanggil <strong>Objek</strong>, manakala bentuk yang terhasil dipanggil <strong>Imej</strong>.</>
              )}
            </p>
            <div className="mt-6 rounded-xl border border-cyan-100 bg-cyan-50/70 p-5">
              <h4 className="font-bold text-cyan-900 mb-2">{lang === 'en' ? 'Quick understanding' : 'Fahami dengan cepat'}</h4>
              <p className="text-sm leading-7 text-cyan-900/80">
                {lang === 'en'
                  ? 'When an object moves, flips, or turns without being redrawn from scratch, we compare the original object with its image. This comparison helps us identify the transformation involved.'
                  : 'Apabila suatu objek digerakkan, dipantulkan atau diputarkan tanpa dilukis semula dari awal, kita membandingkan objek asal dengan imej yang terhasil. Perbandingan ini membantu kita mengenal pasti jenis transformasi yang berlaku.'}
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-1 gap-6">
            <div className="bg-green-50 border border-green-200 p-5 rounded-xl">
              <h4 className="font-bold text-green-800 mb-2">{lang === 'en' ? 'Congruence' : 'Kekongruenan'}</h4>
              <p className="text-sm text-green-700">
                {lang === 'en' ? 'Two figures are congruent if they have the same shape and size, regardless of their position or orientation.' : 'Dua rajah adalah kongruen jika ia mempunyai bentuk dan saiz yang sama, tanpa mengira kedudukan atau orientasinya.'}
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 p-5 rounded-xl">
              <h4 className="font-bold text-orange-800 mb-2">{lang === 'en' ? 'Similarity' : 'Keserupaan'}</h4>
              <p className="text-sm text-orange-700">
                {lang === 'en' ? 'Two figures are similar if they have the same shape but different sizes.' : 'Dua rajah adalah serupa jika ia mempunyai bentuk yang sama tetapi saiz yang berbeza.'}
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* 11.2 Translasi */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className={`text-2xl font-bold text-slate-900 border-b-2 pb-3 mb-6 flex items-center gap-2 ${layoutTheme.sectionRule}`}>
          <span className={`px-3 py-1 rounded-lg text-lg ${layoutTheme.sectionBadge}`}>11.2</span> 
          {lang === 'en' ? 'Geometric Translation' : 'Translasi'}
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
          <div className="flex-1 space-y-4">
            <p className="text-slate-700 leading-relaxed">
              {lang === 'en' ? (
                <><strong>Geometric translation</strong> moves every point on a plane in the same direction and by the same distance. The object <em>slides</em> without turning, and its size remains the same.</>
              ) : (
                <><strong>Translasi</strong> ialah pemindahan semua titik pada suatu satah mengikut arah dan jarak yang sama. Objek <em>melongsor</em> tanpa dipusingkan dan saiznya kekal.</>
              )}
            </p>
            <div className={`p-4 rounded-lg inline-block ${layoutTheme.infoPanel}`}>
              <h4 className={`font-bold mb-2 ${layoutTheme.infoTitle}`}>{lang === 'en' ? 'Vector of Translation' : 'Vektor Translasi'}</h4>
              <div className={`text-sm mb-2 flex items-center gap-2 ${layoutTheme.infoText}`}>
                {lang === 'en' ? 'Written as' : 'Ditulis dalam bentuk'}
                <span className={`flex flex-col items-center border-l-2 border-r-2 px-1.5 rounded-sm leading-tight ${layoutTheme.matrixChip}`}>
                  <span>a</span><span>b</span>
                </span>
              </div>
              <ul className={`list-disc pl-5 text-sm space-y-1 ${layoutTheme.infoText}`}>
                <li><strong>a:</strong> {lang === 'en' ? 'Right (+) or left (-) along the x-axis.' : 'Kanan (+) atau Kiri (-) paksi-x.'}</li>
                <li><strong>b:</strong> {lang === 'en' ? 'Up (+) or down (-) along the y-axis.' : 'Atas (+) atau Bawah (-) paksi-y.'}</li>
              </ul>
            </div>
          </div>
          
          <div className={`w-64 h-64 shrink-0 rounded-xl border-2 flex flex-col items-center justify-center relative overflow-hidden shadow-inner ${layoutTheme.animationCard}`}>
            <div className={`absolute top-2 left-2 flex items-center gap-1 text-xs font-bold bg-white/70 px-2 py-1 rounded-md ${layoutTheme.animationLabel}`}><Activity size={12}/> {lang === 'en' ? 'Concept Animation' : 'Animasi Konsep'}</div>
            <svg width="200" height="200" viewBox="0 0 100 100">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/></pattern>
              <rect width="100" height="100" fill="url(#grid)" />
              <defs>
                <linearGradient id="gradKereta" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={layoutTheme.svg.secondary} /><stop offset="100%" stopColor={layoutTheme.svg.primary} /></linearGradient>
                <marker id="arrowT" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><polygon points="0,0 4,2 0,4" fill={layoutTheme.svg.accent} /></marker>
              </defs>
              <path d="M 30 60 L 65 30" fill="none" stroke={layoutTheme.svg.accent} strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arrowT)" />
              <g transform="translate(35, -30)" opacity="0.3">
                <path d="M 15 65 L 15 55 L 20 55 L 25 45 L 35 45 L 40 55 L 45 55 L 45 65 Z" fill={layoutTheme.svg.danger} stroke={layoutTheme.svg.dangerDark} strokeDasharray="2,2"/>
                <circle cx="20" cy="65" r="4" fill={layoutTheme.svg.danger} /><circle cx="40" cy="65" r="4" fill={layoutTheme.svg.danger} />
              </g>
              <g>
                <animateTransform attributeName="transform" type="translate" values="0 0; 0 0; 35 -30; 35 -30; 0 0" keyTimes="0; 0.2; 0.5; 0.7; 1" dur="8s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1; 0.5 0 0.7 1; 0 0 1 1; 0.5 0 0.7 1"/>
                <path d="M 15 65 L 15 55 L 20 55 L 25 45 L 35 45 L 40 55 L 45 55 L 45 65 Z" fill="url(#gradKereta)" stroke={layoutTheme.svg.primaryDark} strokeWidth="1"/>
                <circle cx="20" cy="65" r="4" fill={layoutTheme.svg.contrast} /><circle cx="40" cy="65" r="4" fill={layoutTheme.svg.contrast} />
                <polygon points="25,55 27,48 33,48 35,55" fill={layoutTheme.svg.light} />
              </g>
            </svg>
          </div>
        </div>
        <TranslasiStepper lang={lang} theme={layoutTheme} />
      </section>

      {/* 11.3 Pantulan */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className={`text-2xl font-bold text-slate-900 border-b-2 pb-3 mb-6 flex items-center gap-2 ${layoutTheme.sectionRule}`}>
          <span className={`px-3 py-1 rounded-lg text-lg ${layoutTheme.sectionBadge}`}>11.3</span> 
          {lang === 'en' ? 'Reflection' : 'Pantulan'}
        </h2>
        
        <div className="flex flex-col md:flex-row-reverse gap-8 items-center mb-6">
          <div className="flex-1 space-y-4">
            <p className="text-slate-700 leading-relaxed">
              {lang === 'en' ? (
                <><strong>Reflection</strong> is a transformation that occurs when an object is flipped across a straight line known as the <strong>Axis of Reflection</strong> (Mirror).</>
              ) : (
                <><strong>Pantulan</strong> ialah penjelmaan yang berlaku apabila suatu objek diterbalikkan pada suatu garisan lurus yang dikenali sebagai <strong>Paksi Pantulan</strong> (Cermin).</>
              )}
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
              <li>{lang === 'en' ? 'The object and image are on opposite sides of the reflection axis.' : 'Objek dan imej berada bertentangan dengan paksi pantulan.'}</li>
              <li>{lang === 'en' ? 'The perpendicular distance from the object to the axis = perpendicular distance from the image to the axis.' : 'Jarak serenjang objek ke paksi = jarak serenjang imej ke paksi.'}</li>
              <li>{lang === 'en' ? 'Same shape/size, but orientation is inverted (laterally inverted).' : 'Bentuk/saiz sama, tetapi orientasinya terbalik (songsang sisi).'}</li>
            </ul>
          </div>
          
          <div className={`w-64 h-64 shrink-0 rounded-xl border-2 flex flex-col items-center justify-center relative overflow-hidden shadow-inner ${layoutTheme.animationCard}`}>
            <div className={`absolute top-2 left-2 flex items-center gap-1 text-xs font-bold bg-white/70 px-2 py-1 rounded-md ${layoutTheme.animationLabel}`}><Activity size={12}/> {lang === 'en' ? 'Concept Animation' : 'Animasi Konsep'}</div>
            <svg width="200" height="200" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="url(#grid)" />
              <line x1="50" y1="0" x2="50" y2="100" stroke={layoutTheme.svg.accent} strokeWidth="2.5" strokeDasharray="4,4" />
              <defs>
                <linearGradient id="gradF" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={layoutTheme.svg.secondary} /><stop offset="100%" stopColor={layoutTheme.svg.primary} /></linearGradient>
                <marker id="arrowP" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><polygon points="0,0 4,2 0,4" fill={layoutTheme.svg.mirror} /></marker>
              </defs>
              <line x1="40" y1="25" x2="60" y2="25" stroke={layoutTheme.svg.mirror} strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrowP)" />
              <line x1="30" y1="65" x2="70" y2="65" stroke={layoutTheme.svg.mirror} strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrowP)" />
              <g transform="translate(100, 0) scale(-1, 1)" opacity="0.3">
                <path d="M 20 20 L 40 20 L 40 30 L 30 30 L 30 40 L 38 40 L 38 50 L 30 50 L 30 80 L 20 80 Z" fill={layoutTheme.svg.danger} stroke={layoutTheme.svg.dangerDark} strokeDasharray="2,2"/>
              </g>
              <g transform="translate(50, 0)">
                <animateTransform attributeName="transform" type="scale" values="1 1; 1 1; -1 1; -1 1; 1 1" keyTimes="0; 0.2; 0.5; 0.7; 1" dur="8s" repeatCount="indefinite" additive="sum" calcMode="spline" keySplines="0 0 1 1; 0.5 0 0.7 1; 0 0 1 1; 0.5 0 0.7 1"/>
                <g transform="translate(-50, 0)">
                  <path d="M 20 20 L 40 20 L 40 30 L 30 30 L 30 40 L 38 40 L 38 50 L 30 50 L 30 80 L 20 80 Z" fill="url(#gradF)" stroke={layoutTheme.svg.primaryDark} strokeWidth="1"/>
                </g>
              </g>
            </svg>
          </div>
        </div>
        <PantulanStepper lang={lang} theme={layoutTheme} />
      </section>

      {/* 11.4 Putaran */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-purple-100 pb-3 mb-6 flex items-center gap-2">
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-lg">11.4</span> 
          {lang === 'en' ? 'Rotation' : 'Putaran'}
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
          <div className="flex-1 space-y-4">
            <p className="text-slate-700 leading-relaxed">
              {lang === 'en' ? (
                <><strong>Rotation</strong> is a transformation where all points are turned around a fixed point, through a certain angle and in a certain direction. The three important elements are: <strong>Center of Rotation</strong>, <strong>Angle of Rotation</strong>, and <strong>Direction of Rotation</strong> (clockwise/anticlockwise).</>
              ) : (
                <><strong>Putaran</strong> ialah transformasi di mana semua titik diputar pada satu titik tetap, sejauh sudut tertentu dan mengikut arah tertentu. Tiga elemen penting ialah: <strong>Pusat Putaran</strong>, <strong>Sudut Putaran</strong>, dan <strong>Arah Putaran</strong> (ikut/lawan jam).</>
              )}
            </p>
          </div>
          
          <div className="w-64 h-64 shrink-0 bg-gradient-to-br from-purple-50 to-fuchsia-100 rounded-xl border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute top-2 left-2 flex items-center gap-1 text-xs font-bold text-purple-600 bg-white/70 px-2 py-1 rounded-md"><Activity size={12}/> {lang === 'en' ? 'Concept Animation' : 'Animasi Konsep'}</div>
            <svg width="200" height="200" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="url(#grid)" />
              <circle cx="50" cy="50" r="3" fill="#000" />
              <defs>
                <linearGradient id="gradPanah" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c084fc" /><stop offset="100%" stopColor="#9333ea" /></linearGradient>
                <marker id="arrowR" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><polygon points="0,0 4,2 0,4" fill="#8b5cf6" /></marker>
              </defs>
              <path d="M 50,15 A 35 35 0 0 1 85,50" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arrowR)"/>
              <g transform="rotate(90 50 50)" opacity="0.3">
                <path d="M 45 40 L 45 15 L 35 15 L 50 0 L 65 15 L 55 15 L 55 40 Z" fill="#ef4444" stroke="#dc2626" strokeDasharray="2,2"/>
              </g>
              <g>
                <animateTransform attributeName="transform" type="rotate" values="0 50 50; 0 50 50; 90 50 50; 90 50 50; 0 50 50" keyTimes="0; 0.2; 0.5; 0.7; 1" dur="8s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1; 0.5 0 0.7 1; 0 0 1 1; 0.5 0 0.7 1"/>
                <path d="M 45 40 L 45 15 L 35 15 L 50 0 L 65 15 L 55 15 L 55 40 Z" fill="url(#gradPanah)" stroke="#4c1d95" strokeWidth="1"/>
              </g>
            </svg>
          </div>
        </div>
        <PutaranStepper lang={lang} />
      </section>

      {/* 11.5 Isometri & 11.6 Simetri Putaran */}
      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-slate-800 text-white rounded-2xl shadow-lg p-6 md:p-8 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Maximize size={120} />
          </div>
          <div>
            <h2 className="text-xl font-bold border-b-2 border-slate-600 pb-3 mb-4 flex items-center gap-2 relative z-10">
              <span className="bg-slate-700 text-white px-2 py-1 rounded text-sm">11.5</span> {lang === 'en' ? 'Isometry' : 'Isometri'}
            </h2>
            <div className="relative z-10 space-y-4">
              <p className="text-slate-300 text-sm">
                {lang === 'en' ? (
                  <><strong>Isometry</strong> is a transformation that preserves the distance between any two points on the original object (Shape and size do not change).</>
                ) : (
                  <><strong>Isometri</strong> ialah transformasi yang mengekalkan jarak antara sebarang dua titik pada objek asal (Bentuk dan saiz tidak berubah).</>
                )}
              </p>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400"/> {lang === 'en' ? 'Translation = Isometry' : 'Translasi = Isometri'}</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400"/> {lang === 'en' ? 'Reflection = Isometry' : 'Pantulan = Isometri'}</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400"/> {lang === 'en' ? 'Rotation = Isometry' : 'Putaran = Isometri'}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 border-b-2 border-rose-100 pb-3 mb-4 flex items-center gap-2">
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-sm">11.6</span> {lang === 'en' ? 'Rotational Symmetry' : 'Simetri Putaran'}
            </h2>
            <p className="text-slate-700 text-sm mb-4">
              {lang === 'en' ? 'A shape that looks the same before one complete rotation (360°) has rotational symmetry.' : 'Bentuk yang kelihatan sama sebelum satu putaran lengkap (360°) mempunyai simetri putaran.'}
            </p>
          </div>
          
          <div className="w-full h-48 bg-gradient-to-br from-rose-50 to-pink-100 rounded-xl border-2 border-rose-200 flex flex-col items-center justify-center p-2 relative overflow-hidden">
            <svg width="100" height="100" viewBox="0 0 100 100" className="mb-2">
              <defs>
                <linearGradient id="gk1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f472b6"/><stop offset="100%" stopColor="#db2777"/></linearGradient>
                <linearGradient id="gk2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#2563eb"/></linearGradient>
                <linearGradient id="gk3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#34d399"/><stop offset="100%" stopColor="#059669"/></linearGradient>
                <linearGradient id="gk4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#d97706"/></linearGradient>
              </defs>
              <g>
                <animateTransform attributeName="transform" type="rotate" values="0 50 50; 0 50 50; 90 50 50; 90 50 50; 180 50 50; 180 50 50; 270 50 50; 270 50 50; 360 50 50; 360 50 50" keyTimes="0; 0.1; 0.25; 0.35; 0.5; 0.6; 0.75; 0.85; 1" dur="8s" repeatCount="indefinite" />
                <path d="M 50 50 Q 80 20 50 5 Q 30 20 50 50 Z" fill="url(#gk1)" />
                <path d="M 50 50 Q 80 80 95 50 Q 80 30 50 50 Z" fill="url(#gk2)" />
                <path d="M 50 50 Q 20 80 50 95 Q 70 80 50 50 Z" fill="url(#gk3)" />
                <path d="M 50 50 Q 20 20 5 50 Q 20 70 50 50 Z" fill="url(#gk4)" />
              </g>
              <circle cx="50" cy="50" r="4" fill="#1e293b" /><circle cx="50" cy="50" r="2" fill="#ffffff" />
            </svg>
            <p className="text-center font-bold text-slate-700 text-xs bg-white/80 px-2 py-1 rounded-full">
              {lang === 'en' ? 'Order 4 Symmetry' : 'Simetri Peringkat 4'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};


// =====================================================================
// 2. KOMPONEN MAKMAL CARTES (SEKSYEN 2)
// =====================================================================

const SVG_W = 800;
const SVG_H = 800;

const SectionMakmal = ({ lang }) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(25);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [vertices, setVertices] = useState([
    { x: 2, y: 3 }, { x: 6, y: 3 }, { x: 4, y: 7 }
  ]);
  const [transType, setTransType] = useState('translasi'); 
  const [transParams, setTransParams] = useState({ dx: 4, dy: -5 });
  const [reflParams, setReflParams] = useState({ type: 'x-axis', val: 0 }); 
  const [rotParams, setRotParams] = useState({ cx: 0, cy: 0, angle: 90, dir: 'cw' }); 
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(1); 
  const [promptText, setPromptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [systemMessage, setSystemMessage] = useState(null);

  const svgRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPan = useRef({ x: 0, y: 0 });

  const mathToSvgX = useCallback((x) => (SVG_W / 2) + pan.x + (x * zoom), [pan.x, zoom]);
  const mathToSvgY = useCallback((y) => (SVG_H / 2) + pan.y - (y * zoom), [pan.y, zoom]); 
  const svgToMathX = useCallback((svgX) => (svgX - pan.x - (SVG_W / 2)) / zoom, [pan.x, zoom]);
  const svgToMathY = useCallback((svgY) => ((SVG_H / 2) + pan.y - svgY) / zoom, [pan.y, zoom]);

  const visibleBounds = useMemo(() => {
    const minX = Math.floor(svgToMathX(0));
    const maxX = Math.ceil(svgToMathX(SVG_W));
    const minY = Math.floor(svgToMathY(SVG_H));
    const maxY = Math.ceil(svgToMathY(0));
    return { minX, maxX, minY, maxY };
  }, [svgToMathX, svgToMathY]);

  const gridStep = useMemo(() => {
    if (zoom > 40) return 1;
    if (zoom > 15) return 2;
    if (zoom > 5) return 5;
    return 10;
  }, [zoom]);

  const handlePointerDown = (e) => {
    if (isAnimating) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastPan.current = { ...pan };
    setIsDraggingCanvas(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingCanvas) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleRatio = SVG_W / rect.width;
    setPan({ x: lastPan.current.x + (dx * scaleRatio), y: lastPan.current.y + (dy * scaleRatio) });
  };

  const handlePointerUp = (e) => {
    if (!isDraggingCanvas) return;
    setIsDraggingCanvas(false);
    e.target.releasePointerCapture(e.pointerId);

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = SVG_W / rect.width;
      const scaleY = SVG_H / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX;
      const svgY = (e.clientY - rect.top) * scaleY;
      const mathX = Math.round(svgToMathX(svgX));
      const mathY = Math.round(svgToMathY(svgY));
      setVertices(prev => [...prev, { x: mathX, y: mathY }]);
      setProgress(1); 
    }
  };

  useEffect(() => {
    const svgElement = svgRef.current;
    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(2, Math.min(100, prev * zoomFactor)));
    };
    if (svgElement) svgElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (svgElement) svgElement.removeEventListener('wheel', handleWheel); };
  }, []);

  const zoomIn = () => setZoom(z => Math.min(100, z * 1.2));
  const zoomOut = () => setZoom(z => Math.max(2, z / 1.2));
  const resetView = () => { setPan({x: 0, y: 0}); setZoom(25); };

  const sortPointsClockwise = (points) => {
    if (!points || points.length < 3) return points;
    const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return [...points].sort((a, b) => {
      const angleA = Math.atan2(a.y - cy, a.x - cx);
      const angleB = Math.atan2(b.y - cy, b.x - cx);
      return angleA - angleB;
    });
  };

  const getLocalShapeFromPrompt = (text) => {
    const prompt = text.toLowerCase();
    const templates = [
      { keys: ["bintang", "star"], points: [{ x: 0, y: 8 }, { x: 2, y: 2 }, { x: 8, y: 2 }, { x: 3, y: -1 }, { x: 5, y: -7 }, { x: 0, y: -3 }, { x: -5, y: -7 }, { x: -3, y: -1 }, { x: -8, y: 2 }, { x: -2, y: 2 }] },
      { keys: ["rumah", "house"], points: [{ x: -6, y: -5 }, { x: 6, y: -5 }, { x: 6, y: 2 }, { x: 0, y: 8 }, { x: -6, y: 2 }] },
      { keys: ["anak panah", "arrow"], points: [{ x: -8, y: -2 }, { x: 2, y: -2 }, { x: 2, y: -5 }, { x: 8, y: 0 }, { x: 2, y: 5 }, { x: 2, y: 2 }, { x: -8, y: 2 }] },
      { keys: ["segi tiga", "triangle"], points: [{ x: 0, y: 7 }, { x: 7, y: -5 }, { x: -7, y: -5 }] },
      { keys: ["segi empat", "square", "kotak"], points: [{ x: -5, y: 5 }, { x: 5, y: 5 }, { x: 5, y: -5 }, { x: -5, y: -5 }] },
      { keys: ["segi panjang", "rectangle"], points: [{ x: -8, y: 4 }, { x: 8, y: 4 }, { x: 8, y: -4 }, { x: -8, y: -4 }] },
      { keys: ["pentagon", "segi lima"], points: [{ x: 0, y: 8 }, { x: 8, y: 2 }, { x: 5, y: -7 }, { x: -5, y: -7 }, { x: -8, y: 2 }] },
      { keys: ["hexagon", "heksagon", "segi enam"], points: [{ x: -4, y: 7 }, { x: 4, y: 7 }, { x: 8, y: 0 }, { x: 4, y: -7 }, { x: -4, y: -7 }, { x: -8, y: 0 }] },
      { keys: ["layang", "kite"], points: [{ x: 0, y: 8 }, { x: 5, y: 0 }, { x: 0, y: -8 }, { x: -3, y: 0 }] },
      { keys: ["trapezium", "trapezoid"], points: [{ x: -4, y: 5 }, { x: 4, y: 5 }, { x: 8, y: -5 }, { x: -8, y: -5 }] },
      { keys: ["diamond", "berlian", "rombus"], points: [{ x: 0, y: 8 }, { x: 7, y: 0 }, { x: 0, y: -8 }, { x: -7, y: 0 }] },
      { keys: ["perahu", "bot", "boat"], points: [{ x: -7, y: 2 }, { x: 7, y: 2 }, { x: 4, y: -4 }, { x: -4, y: -4 }] },
      { keys: ["bulan", "crescent"], points: [{ x: 0, y: 8 }, { x: 6, y: 4 }, { x: 6, y: -4 }, { x: 0, y: -8 }, { x: 3, y: -4 }, { x: 3, y: 4 }] },
      { keys: ["hati", "heart"], points: [{ x: 0, y: 7 }, { x: 4, y: 9 }, { x: 8, y: 5 }, { x: 0, y: -8 }, { x: -8, y: 5 }, { x: -4, y: 9 }] },
    ];

    const match = templates.find(shape => shape.keys.some(key => prompt.includes(key)));
    if (match) return match.points;

    const sides = Math.min(8, Math.max(3, (prompt.length % 6) + 3));
    const radius = prompt.includes("besar") || prompt.includes("large") ? 8 : 6;
    const points = Array.from({ length: sides }, (_, index) => {
      const angle = Math.PI / 2 + (index * 2 * Math.PI) / sides;
      return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
    });
    return sortPointsClockwise(points);
  };

  const generateLocalShapeFromText = async (text) => {
    const cleanedPrompt = text.trim();
    if (!cleanedPrompt) return;
    setIsGenerating(true);
    setSystemMessage(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "your_gemini_api_key_here") {
        throw new Error("API Key belum dikonfigurasi dalam .env");
      }

      const prompt = `You are an assistant for a Cartesian plane shape generator for kids. 
The user wants to generate a shape based on this text: "${cleanedPrompt}".
Output a JSON array of coordinates {x, y}. 
Rules:
- Coordinates must be integers between -10 and 10.
- Provide enough points to form a recognizable polygon representing the user's request.
- Ensure points are ordered sequentially to form a valid non-intersecting polygon.
- Output ONLY valid JSON array with no markdown blocks or backticks.
Example: [{"x":0,"y":5}, {"x":5,"y":-5}, {"x":-5,"y":-5}]`;

      const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"];
      let responseText = "";
      let usedModel = "";

      for (const model of modelsToTry) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.candidates && data.candidates.length > 0) {
              responseText = data.candidates[0].content.parts[0].text.trim();
              usedModel = model;
              break;
            }
          }
        } catch (err) {
          console.warn(`Model ${model} failed, trying next...`, err);
        }
      }

      if (!responseText) {
        throw new Error("Semua model Gemini API tidak memberi respon.");
      }

      let points;
      try {
        const match = responseText.match(/\[[\s\S]*\]/);
        const jsonStr = match ? match[0] : responseText;
        points = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Raw AI Response:", responseText);
        throw new Error("Format JSON dari AI tidak sah.");
      }

      if (!Array.isArray(points) || points.length < 3) throw new Error("Titik koordinat tidak mencukupi.");
      
      const roundedPoints = points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
      const sortedPoints = sortPointsClockwise(roundedPoints);

      setVertices(sortedPoints);
      setSystemMessage({
        type: "success",
        text: lang === "en" ? `AI (${usedModel}) generated: ${cleanedPrompt}` : `AI (${usedModel}) menjana: ${cleanedPrompt}`
      });
    } catch (e) {
      console.warn("AI Generation failed, falling back to local shapes.", e);
      await new Promise(resolve => setTimeout(resolve, 200));
      const points = getLocalShapeFromPrompt(cleanedPrompt);
      setVertices(points);
      setSystemMessage({
        type: "success",
        text: lang === "en" ? `Generated shape: ${cleanedPrompt}` : `Jana bentuk: ${cleanedPrompt}`
      });
    } finally {
      setProgress(1);
      setPromptText("");
      resetView();
      setIsGenerating(false);
    }
  };

  const handleGenerateAI = () => generateLocalShapeFromText(promptText);

  const quickShapePrompts = [
    { ms: "bintang", en: "star", labelMs: "Bintang", labelEn: "Star" },
    { ms: "rumah", en: "house", labelMs: "Rumah", labelEn: "House" },
    { ms: "anak panah", en: "arrow", labelMs: "Anak Panah", labelEn: "Arrow" },
    { ms: "hexagon", en: "hexagon", labelMs: "Hexagon", labelEn: "Hexagon" },
    { ms: "layang-layang", en: "kite", labelMs: "Layang", labelEn: "Kite" },
    { ms: "trapezium", en: "trapezoid", labelMs: "Trapezium", labelEn: "Trapezoid" }
  ];

  useEffect(() => {
    if (systemMessage) {
      const timer = setTimeout(() => setSystemMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [systemMessage]);

  const calculateTranslation = (pt, params, prog = 1) => ({ x: pt.x + params.dx * prog, y: pt.y + params.dy * prog });
  const calculateReflection = (pt, params, prog = 1) => {
    let targetX = pt.x; let targetY = pt.y;
    if (params.type === 'x-axis') targetY = -pt.y;
    else if (params.type === 'y-axis') targetX = -pt.x;
    else if (params.type === 'y-line') targetY = 2 * params.val - pt.y;
    else if (params.type === 'x-line') targetX = 2 * params.val - pt.x;
    return { x: pt.x + (targetX - pt.x) * prog, y: pt.y + (targetY - pt.y) * prog };
  };
  const calculateRotation = (pt, params, prog = 1) => {
    const { cx, cy, angle, dir } = params;
    let rad = (dir === 'cw' ? -angle : angle) * prog * (Math.PI / 180);
    let tempX = pt.x - cx; let tempY = pt.y - cy;
    return {
      x: (tempX * Math.cos(rad) - tempY * Math.sin(rad)) + cx,
      y: (tempX * Math.sin(rad) + tempY * Math.cos(rad)) + cy
    };
  };

  const currentPoints = useMemo(() => {
    if (vertices.length === 0) return [];
    return vertices.map(pt => {
      if (transType === 'translasi') return calculateTranslation(pt, transParams, progress);
      if (transType === 'pantulan') return calculateReflection(pt, reflParams, progress);
      if (transType === 'putaran') return calculateRotation(pt, rotParams, progress);
      return pt;
    });
  }, [vertices, transType, transParams, reflParams, rotParams, progress]);

  const finalPoints = useMemo(() => {
    if (vertices.length === 0) return [];
    return vertices.map(pt => {
      if (transType === 'translasi') return calculateTranslation(pt, transParams, 1);
      if (transType === 'pantulan') return calculateReflection(pt, reflParams, 1);
      if (transType === 'putaran') return calculateRotation(pt, rotParams, 1);
      return pt;
    });
  }, [vertices, transType, transParams, reflParams, rotParams]);

  const startAnimation = () => {
    if (vertices.length === 0) return;
    setProgress(0);
    setIsAnimating(true); 
  };

  useEffect(() => {
    if (!isAnimating) return;
    let animationFrameId;
    let startTimestamp;
    const DURATION = 1500;

    const step = (timestamp) => {
      if (startTimestamp === undefined) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      let p = elapsed / DURATION;
      if (p >= 1) {
        p = 1; setProgress(p); setIsAnimating(false);
      } else {
        setProgress(p); animationFrameId = window.requestAnimationFrame(step);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);
    return () => { if (animationFrameId) window.cancelAnimationFrame(animationFrameId); };
  }, [isAnimating]);

  const clearVertices = () => { setVertices([]); setProgress(1); };
  const setPresetShape = (shape) => {
    if (shape === 'segitiga') setVertices([{ x: 2, y: 2 }, { x: 7, y: 2 }, { x: 2, y: 6 }]);
    if (shape === 'segiempat') setVertices([{ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 5 }, { x: 2, y: 5 }]);
    setProgress(1); resetView();
  };

  const makePolygonPath = (points) => {
    if (!points || points.length === 0) return "";
    const svgPts = points.map(p => `${mathToSvgX(p.x)},${mathToSvgY(p.y)}`);
    return `M ${svgPts.join(' L ')} Z`;
  };

  const renderDynamicGrid = () => {
    const lines = [];
    const { minX, maxX, minY, maxY } = visibleBounds;
    const startX = Math.floor(minX / gridStep) * gridStep;
    const startY = Math.floor(minY / gridStep) * gridStep;

    for (let i = startX; i <= maxX; i += gridStep) {
      const svgX = mathToSvgX(i);
      const isAxis = i === 0;
      lines.push(
        <g key={`x-${i}`}>
          <line x1={svgX} y1="0" x2={svgX} y2={SVG_H} stroke={isAxis ? "#334155" : "#f1f5f9"} strokeWidth={isAxis ? "2" : "1"} />
          {!isAxis && <text x={svgX} y={mathToSvgY(0) + 15} fontSize="10" textAnchor="middle" fill="#94a3b8" fontWeight="500">{i}</text>}
        </g>
      );
    }
    for (let i = startY; i <= maxY; i += gridStep) {
      const svgY = mathToSvgY(i);
      const isAxis = i === 0;
      lines.push(
        <g key={`y-${i}`}>
          <line x1="0" y1={svgY} x2={SVG_W} y2={svgY} stroke={isAxis ? "#334155" : "#f1f5f9"} strokeWidth={isAxis ? "2" : "1"} />
          {!isAxis && <text x={mathToSvgX(0) - 15} y={svgY + 4} fontSize="10" textAnchor="middle" fill="#94a3b8" fontWeight="500">{i}</text>}
        </g>
      );
    }
    lines.push(<text key="zero" x={mathToSvgX(0) - 12} y={mathToSvgY(0) + 16} fontSize="12" fontWeight="bold" fill="#334155">0</text>);
    return lines;
  };

  const renderVisualAids = () => {
    if (progress < 1) return null; 
    let aids = [];
    if (transType === 'pantulan') {
      let axisLine = null;
      if (reflParams.type === 'x-axis') axisLine = <line x1="0" y1={mathToSvgY(0)} x2={SVG_W} y2={mathToSvgY(0)} stroke="#16a34a" strokeWidth="3" strokeDasharray="6,6" key="axis" />;
      else if (reflParams.type === 'y-axis') axisLine = <line x1={mathToSvgX(0)} y1="0" x2={mathToSvgX(0)} y2={SVG_H} stroke="#16a34a" strokeWidth="3" strokeDasharray="6,6" key="axis" />;
      else if (reflParams.type === 'x-line') axisLine = <line x1={mathToSvgX(reflParams.val)} y1="0" x2={mathToSvgX(reflParams.val)} y2={SVG_H} stroke="#16a34a" strokeWidth="3" strokeDasharray="6,6" key="axis" />;
      else if (reflParams.type === 'y-line') axisLine = <line x1="0" y1={mathToSvgY(reflParams.val)} x2={SVG_W} y2={mathToSvgY(reflParams.val)} stroke="#16a34a" strokeWidth="3" strokeDasharray="6,6" key="axis" />;
      aids.push(axisLine);

      vertices.forEach((pt, i) => {
        let fPt = finalPoints[i];
        aids.push(<line key={`aid-${i}`} x1={mathToSvgX(pt.x)} y1={mathToSvgY(pt.y)} x2={mathToSvgX(fPt.x)} y2={mathToSvgY(fPt.y)} stroke="rgba(34, 197, 94, 0.3)" strokeWidth="2" strokeDasharray="4,4" />);
      });
    }
    else if (transType === 'translasi') {
      vertices.forEach((pt, i) => {
        let fPt = finalPoints[i];
        aids.push(<line key={`aid-${i}`} x1={mathToSvgX(pt.x)} y1={mathToSvgY(pt.y)} x2={mathToSvgX(fPt.x)} y2={mathToSvgY(fPt.y)} stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" strokeDasharray="5,5" />);
        aids.push(<circle key={`dot-${i}`} cx={mathToSvgX(fPt.x)} cy={mathToSvgY(fPt.y)} r="3" fill="#9333ea" />);
      });
    }
    else if (transType === 'putaran') {
      aids.push(<circle key="center" cx={mathToSvgX(rotParams.cx)} cy={mathToSvgY(rotParams.cy)} r="5" fill="#ea580c" />);
      aids.push(<text key="ctext" x={mathToSvgX(rotParams.cx) + 8} y={mathToSvgY(rotParams.cy) - 8} fill="#ea580c" fontSize="12" fontWeight="bold">{lang === 'en' ? 'Center' : 'Pusat Putaran'}</text>);
      if (vertices.length > 0) {
        let pt = vertices[0]; let fPt = finalPoints[0];
        aids.push(<line key="rad1" x1={mathToSvgX(rotParams.cx)} y1={mathToSvgY(rotParams.cy)} x2={mathToSvgX(pt.x)} y2={mathToSvgY(pt.y)} stroke="rgba(234, 88, 12, 0.4)" strokeWidth="2" strokeDasharray="5,5" />);
        aids.push(<line key="rad2" x1={mathToSvgX(rotParams.cx)} y1={mathToSvgY(rotParams.cy)} x2={mathToSvgX(fPt.x)} y2={mathToSvgY(fPt.y)} stroke="rgba(234, 88, 12, 0.4)" strokeWidth="2" strokeDasharray="5,5" />);
      }
    }
    return aids;
  };

  const generateExplanation = () => {
    if (vertices.length === 0) return (
      <div className="flex items-center justify-center h-32 text-slate-400 italic">
        <Info className="mr-2 w-5 h-5" /> {lang === 'en' ? 'Please draw or generate a shape on the Cartesian plane first.' : 'Sila lukis atau jana bentuk pada satah Cartes dahulu.'}
      </div>
    );

    let explanation = [];
    let isometriText = lang === 'en' 
      ? "This transformation is an isometry because the shape and size of the image are the same as the object (congruence is preserved)."
      : "Transformasi ini adalah suatu isometri kerana bentuk dan saiz imej adalah sama dengan objek (kekongruenan dikekalkan).";

    if (transType === 'translasi') {
      explanation.push(<p key="desc" className="text-lg font-bold mb-4 text-slate-800">{lang === 'en' ? 'Translation with vector' : 'Translasi dengan vektor'} <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded">( {transParams.dx} , {transParams.dy} )</span></p>);
      vertices.forEach((pt, i) => {
        let finalPt = finalPoints[i]; let label = String.fromCharCode(65 + i % 26); 
        explanation.push(
          <div key={i} className="flex items-center gap-3 font-mono text-sm mb-2 bg-slate-50 p-2 rounded border border-slate-100">
            <span className="text-blue-600 font-bold">{label}({pt.x}, {pt.y})</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-red-500 font-bold">{label}'({finalPt.x.toFixed(1)}, {finalPt.y.toFixed(1)})</span>
          </div>
        );
      });
    } 
    else if (transType === 'pantulan') {
      let pDesc = '';
      if (lang === 'en') {
        pDesc = reflParams.type === 'x-axis' ? "X-axis (y = 0)" : reflParams.type === 'y-axis' ? "Y-axis (x = 0)" : reflParams.type === 'x-line' ? `Line x = ${reflParams.val}` : `Line y = ${reflParams.val}`;
      } else {
        pDesc = reflParams.type === 'x-axis' ? "Paksi-x (y = 0)" : reflParams.type === 'y-axis' ? "Paksi-y (x = 0)" : reflParams.type === 'x-line' ? `Garis x = ${reflParams.val}` : `Garis y = ${reflParams.val}`;
      }
      explanation.push(<p key="desc" className="text-lg font-bold mb-4 text-slate-800">{lang === 'en' ? 'Reflection on' : 'Pantulan pada'} <span className="text-green-600 bg-green-50 px-2 py-1 rounded">{pDesc}</span></p>);
      vertices.forEach((pt, i) => {
        let finalPt = finalPoints[i]; let label = String.fromCharCode(65 + i % 26);
        explanation.push(
          <div key={i} className="flex items-center gap-3 font-mono text-sm mb-2 bg-slate-50 p-2 rounded border border-slate-100">
            <span className="text-blue-600 font-bold">{label}({pt.x}, {pt.y})</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-red-500 font-bold">{label}'({finalPt.x.toFixed(1)}, {finalPt.y.toFixed(1)})</span>
          </div>
        );
      });
    }
    else if (transType === 'putaran') {
      let dirDesc = lang === 'en' 
        ? (rotParams.dir === 'cw' ? "Clockwise" : "Anticlockwise")
        : (rotParams.dir === 'cw' ? "Ikut Jam" : "Lawan Jam");
      explanation.push(<p key="desc" className="text-lg font-bold mb-4 text-slate-800">{lang === 'en' ? 'Rotation' : 'Putaran'} <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded">{rotParams.angle}&deg; {dirDesc}</span> {lang === 'en' ? 'at center' : 'di pusat'} <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded">({rotParams.cx}, {rotParams.cy})</span></p>);
      vertices.forEach((pt, i) => {
        let finalPt = finalPoints[i]; let label = String.fromCharCode(65 + i % 26);
        explanation.push(
          <div key={i} className="flex items-center gap-3 font-mono text-sm mb-2 bg-slate-50 p-2 rounded border border-slate-100">
            <span className="text-blue-600 font-bold">{label}({pt.x}, {pt.y})</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-red-500 font-bold">{label}'({finalPt.x.toFixed(1)}, {finalPt.y.toFixed(1)})</span>
          </div>
        );
      });
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">{lang === 'en' ? 'Coordinate Point Mapping' : 'Pemetaan Titik Koordinat'}</h3>
          <div className="max-h-64 overflow-y-auto pr-2">{explanation}</div>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">{lang === 'en' ? 'Transformation Properties' : 'Sifat Transformasi'}</h3>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3 text-indigo-900 shadow-sm">
            <Info className="w-6 h-6 text-indigo-500 shrink-0" />
            <p className="text-sm leading-relaxed">{isometriText}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Shapes className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">1. {lang === 'en' ? 'Build Original Object' : 'Bina Objek Asal'}</h2>
          </div>
          
          <div className="shape-studio mb-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4 rounded-xl border border-purple-100 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-3">
              <label className="text-sm font-bold text-purple-900 flex items-center gap-1.5"><Wand2 className="w-4 h-4"/> {lang === 'en' ? 'Shape Studio' : 'Studio Bentuk'}</label>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${import.meta.env.VITE_GEMINI_API_KEY ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {import.meta.env.VITE_GEMINI_API_KEY 
                  ? (lang === 'en' ? 'AI Active' : 'AI Aktif') 
                  : (lang === 'en' ? 'Local' : 'Tanpa server')}
              </span>
            </div>
            <div className="flex gap-2 relative z-10">
              <input type="text" value={promptText} onChange={(e) => setPromptText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()} placeholder={lang === 'en' ? 'Try: star, house, arrow' : 'Cuba: bintang, rumah, anak panah'} className="flex-1 p-2.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none shadow-sm" />
              <button onClick={handleGenerateAI} disabled={isGenerating || !promptText.trim()} className={`px-4 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm flex items-center justify-center ${isGenerating || !promptText.trim() ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 active:scale-95'}`}>
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : (lang === 'en' ? 'Create' : 'Jana')}
              </button>
            </div>
            <div className="shape-chip-row mt-3">
              {quickShapePrompts.map((shape) => {
                const prompt = lang === 'en' ? shape.en : shape.ms;
                return (
                  <button key={shape.ms} type="button" onClick={() => generateLocalShapeFromText(prompt)} className="shape-chip">
                    {lang === 'en' ? shape.labelEn : shape.labelMs}
                  </button>
                );
              })}
            </div>
          </div>

          {systemMessage && (
            <div className={`p-3 mb-5 text-sm rounded-lg border flex items-start gap-2 shadow-sm ${systemMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {systemMessage.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0"/>}
              <span className="font-medium">{systemMessage.text}</span>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">{lang === 'en' ? 'Preset Shapes' : 'Bentuk Sedia Ada'}</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPresetShape('segitiga')} className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 p-2.5 rounded-lg text-sm font-medium text-slate-700 flex justify-center items-center gap-2">
                <Triangle className="w-4 h-4 fill-current"/> {lang === 'en' ? 'Triangle' : 'Segi Tiga'}
              </button>
              <button onClick={() => setPresetShape('segiempat')} className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 p-2.5 rounded-lg text-sm font-medium text-slate-700 flex justify-center items-center gap-2">
                <Square className="w-4 h-4 fill-current"/> {lang === 'en' ? 'Quadrilateral' : 'Segi Empat'}
              </button>
            </div>
          </div>
          
          <button onClick={clearVertices} className="mt-4 w-full border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 p-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2">
            <Trash2 className="w-4 h-4"/> {lang === 'en' ? 'Clear Grid' : 'Kosongkan Grid'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Move className="w-5 h-5"/>
            </div>
            <h2 className="text-lg font-bold text-slate-800">2. {lang === 'en' ? 'Transformation Settings' : 'Tetapan Transformasi'}</h2>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            {['translasi', 'pantulan', 'putaran'].map(type => {
              let label = type;
              if (lang === 'en') {
                if (type === 'translasi') label = 'Translation';
                else if (type === 'pantulan') label = 'Reflection';
                else if (type === 'putaran') label = 'Rotation';
              }
              return (
                <button key={type} onClick={() => {setTransType(type); setProgress(1);}} className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all ${transType === type ? 'bg-white text-indigo-700 shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>{label}</button>
              )
            })}
          </div>

          <div className="min-h-[140px]">
            {transType === 'translasi' && (
              <div className="space-y-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-700">{lang === 'en' ? 'X-axis Movement (dx)' : 'Pergerakan Paksi-x (dx)'}</label>
                    <input type="number" className="w-16 p-1 border rounded text-center text-sm font-bold text-indigo-700" value={transParams.dx} onChange={e => {setTransParams({...transParams, dx: parseInt(e.target.value)||0}); setProgress(1);}} />
                  </div>
                  <input type="range" className="w-full accent-indigo-600" min="-20" max="20" value={transParams.dx} onChange={e => {setTransParams({...transParams, dx: parseInt(e.target.value)}); setProgress(1);}} />
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-700">{lang === 'en' ? 'Y-axis Movement (dy)' : 'Pergerakan Paksi-y (dy)'}</label>
                    <input type="number" className="w-16 p-1 border rounded text-center text-sm font-bold text-indigo-700" value={transParams.dy} onChange={e => {setTransParams({...transParams, dy: parseInt(e.target.value)||0}); setProgress(1);}} />
                  </div>
                  <input type="range" className="w-full accent-indigo-600" min="-20" max="20" value={transParams.dy} onChange={e => {setTransParams({...transParams, dy: parseInt(e.target.value)}); setProgress(1);}} />
                </div>
              </div>
            )}

            {transType === 'pantulan' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{lang === 'en' ? 'Select Reflection Axis:' : 'Pilih Paksi Pantulan:'}</label>
                  <div className="relative">
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 appearance-none outline-none" value={reflParams.type} onChange={e => {setReflParams({...reflParams, type: e.target.value}); setProgress(1);}}>
                      <option value="x-axis">{lang === 'en' ? 'X-axis (y = 0)' : 'Paksi-x (y = 0)'}</option>
                      <option value="y-axis">{lang === 'en' ? 'Y-axis (x = 0)' : 'Paksi-y (x = 0)'}</option>
                      <option value="x-line">{lang === 'en' ? 'Vertical Line (x = a)' : 'Garis Menegak (x = a)'}</option>
                      <option value="y-line">{lang === 'en' ? 'Horizontal Line (y = b)' : 'Garis Mengufuk (y = b)'}</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 text-slate-400 w-5 h-5 pointer-events-none"/>
                  </div>
                </div>
                {(reflParams.type === 'x-line' || reflParams.type === 'y-line') && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-slate-700">{lang === 'en' ? 'Axis value' : 'Nilai paksi'} ({reflParams.type === 'x-line' ? 'x' : 'y'})</label>
                      <input type="number" className="w-16 p-1 border rounded text-center text-sm font-bold text-indigo-700" value={reflParams.val} onChange={e => {setReflParams({...reflParams, val: parseInt(e.target.value)||0}); setProgress(1);}} />
                    </div>
                    <input type="range" className="w-full accent-indigo-600" min="-20" max="20" value={reflParams.val} onChange={e => {setReflParams({...reflParams, val: parseInt(e.target.value)}); setProgress(1);}} />
                  </div>
                )}
              </div>
            )}

            {transType === 'putaran' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">{lang === 'en' ? 'Center X' : 'Pusat X'}</label>
                    <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none" value={rotParams.cx} onChange={e => {setRotParams({...rotParams, cx: parseInt(e.target.value)||0}); setProgress(1);}} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">{lang === 'en' ? 'Center Y' : 'Pusat Y'}</label>
                    <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none" value={rotParams.cy} onChange={e => {setRotParams({...rotParams, cy: parseInt(e.target.value)||0}); setProgress(1);}} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{lang === 'en' ? 'Rotation Angle' : 'Sudut Putaran'}</label>
                  <div className="flex gap-2">
                    {[90, 180, 270].map(deg => (
                      <button key={deg} onClick={() => {setRotParams({...rotParams, angle: deg}); setProgress(1);}} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${rotParams.angle === deg ? 'bg-indigo-100 border-2 border-indigo-500 text-indigo-700 font-bold' : 'bg-slate-50 border-2 border-transparent text-slate-600 hover:bg-slate-100'}`}>{deg}&deg;</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{lang === 'en' ? 'Rotation Direction' : 'Arah Putaran'}</label>
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-lg">
                    <button onClick={() => {setRotParams({...rotParams, dir: 'cw'}); setProgress(1);}} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${rotParams.dir === 'cw' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>{lang === 'en' ? 'Clockwise' : 'Ikut Jam'}</button>
                    <button onClick={() => {setRotParams({...rotParams, dir: 'ccw'}); setProgress(1);}} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${rotParams.dir === 'ccw' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>{lang === 'en' ? 'Anticlockwise' : 'Lawan Jam'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button onClick={startAnimation} disabled={vertices.length === 0 || isAnimating}
            className={`mt-6 w-full py-3.5 rounded-xl font-bold text-white transition-all transform active:scale-95 flex justify-center items-center gap-2 ${vertices.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-md'}`}>
            {isAnimating ? <Loader2 className="w-5 h-5 animate-spin"/> : <PlayCircle className="w-5 h-5"/>}
            {isAnimating ? (lang === 'en' ? 'Playing...' : 'Sedang Memainkan...') : (lang === 'en' ? 'Play Animation' : 'Mainkan Animasi')}
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 flex flex-col gap-6">
        
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-200 relative">
          <div className="absolute top-8 left-8 z-10 bg-white/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600 flex flex-col gap-1 pointer-events-none">
            <p className="font-bold text-indigo-600 flex items-center gap-1"><Grid className="w-3 h-3 fill-current"/> {lang === 'en' ? 'Infinite Plane' : 'Satah Infiniti'}</p>
            <p>👆 <b>{lang === 'en' ? 'Click' : 'Klik'}</b> {lang === 'en' ? 'to draw vertex' : 'untuk lakar bucu'}</p>
            <p>✋ <b>{lang === 'en' ? 'Drag' : 'Seret'}</b> {lang === 'en' ? 'to move plane' : 'untuk gerak satah'}</p>
            <p>🖱️ <b>{lang === 'en' ? 'Scroll' : 'Tatal'}</b> {lang === 'en' ? 'to zoom' : 'untuk zum'}</p>
          </div>

          <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur p-2 rounded-xl border border-slate-200 shadow-sm">
            <button onClick={zoomIn} title={lang === 'en' ? 'Zoom In' : 'Zum Masuk'} className="w-10 h-10 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex justify-center items-center transition"><ZoomIn className="w-5 h-5"/></button>
            <button onClick={zoomOut} title={lang === 'en' ? 'Zoom Out' : 'Zum Keluar'} className="w-10 h-10 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex justify-center items-center transition"><ZoomOut className="w-5 h-5"/></button>
            <div className="w-full h-px bg-slate-200 my-1"></div>
            <button onClick={resetView} title={lang === 'en' ? 'Back to Center' : 'Kembali ke Pusat'} className="w-10 h-10 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white flex justify-center items-center shadow transition"><Home className="w-5 h-5"/></button>
          </div>

          {isGenerating && (
            <div className="absolute inset-0 z-20 bg-white/70 flex flex-col justify-center items-center backdrop-blur-sm rounded-2xl pointer-events-none">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-lg"></div>
              <p className="mt-4 font-bold text-indigo-800 bg-white px-4 py-1 rounded-full shadow-sm">{lang === 'en' ? 'AI is calculating points...' : 'AI sedang mengira titik...'}</p>
            </div>
          )}

          <div className="w-full aspect-square md:aspect-video lg:aspect-square flex justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-200 shadow-inner">
            <svg 
              ref={svgRef}
              width="100%" 
              height="100%" 
              className={`bg-white touch-none ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-crosshair'}`}
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              preserveAspectRatio="xMidYMid slice"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {renderDynamicGrid()}
              {renderVisualAids()}

              {vertices.length > 0 && progress > 0 && (
                <g>
                  <path d={makePolygonPath(currentPoints)} fill={progress === 1 ? "rgba(239, 68, 68, 0.25)" : "rgba(245, 158, 11, 0.4)"} stroke={progress === 1 ? "#ef4444" : "#f59e0b"} strokeWidth="2.5" strokeLinejoin="round" strokeDasharray={progress === 1 ? "6,4" : ""} />
                  {currentPoints.map((pt, i) => (
                    <g key={`img-pt-${i}`}>
                      <circle cx={mathToSvgX(pt.x)} cy={mathToSvgY(pt.y)} r="5" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
                      <text x={mathToSvgX(pt.x) + 8} y={mathToSvgY(pt.y) - 8} fontSize="14" fontWeight="bold" fill="#ef4444" className="drop-shadow-sm">{String.fromCharCode(65 + i % 26)}'</text>
                    </g>
                  ))}
                </g>
              )}

              {vertices.length > 0 && (
                <g>
                  <path d={makePolygonPath(vertices)} fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
                  {vertices.map((pt, i) => (
                    <g key={`obj-pt-${i}`}>
                      <circle cx={mathToSvgX(pt.x)} cy={mathToSvgY(pt.y)} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="1.5"/>
                      <text x={mathToSvgX(pt.x) + 8} y={mathToSvgY(pt.y) - 8} fontSize="14" fontWeight="bold" fill="#1d4ed8" className="drop-shadow-sm">{String.fromCharCode(65 + i % 26)}</text>
                    </g>
                  ))}
                </g>
              )}
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><TrendingUp className="w-5 h-5"/></div>
            <h2 className="text-lg font-bold text-slate-800">{lang === 'en' ? 'Change Analysis (Solution)' : 'Analisis Perubahan (Penyelesaian)'}</h2>
          </div>
          {generateExplanation()}
        </div>

      </div>
    </div>
  );
};

// =====================================================================
// 3. KOMPONEN KUIZ (SEKSYEN 3)
// =====================================================================

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Fungsi menjana DATA soalan mentah (String diproses semasa render)
const generateQuestionsData = (num = 10) => {
  const qTypes = ['translasi', 'pantulan', 'putaran'];
  const shapeTemplates = [
    [{x:0,y:0}, {x:2,y:-1}, {x:1,y:2}], 
    [{x:0,y:0}, {x:3,y:0}, {x:0,y:3}], 
    [{x:0,y:0}, {x:2,y:0}, {x:2,y:2}, {x:0,y:2}], 
    [{x:0,y:0}, {x:3,y:0}, {x:2,y:2}, {x:1,y:2}], 
    [{x:0,y:0}, {x:1,y:2}, {x:0,y:4}, {x:-1,y:2}], 
    [{x:0,y:0}, {x:2,y:0}, {x:2,y:1}, {x:1,y:1}, {x:1,y:3}, {x:0,y:3}],
    [{x:0,y:0}, {x:1,y:0}, {x:1,y:3}, {x:2,y:3}, {x:2,y:4}, {x:-1,y:4}, {x:-1,y:3}, {x:0,y:3}],
    [{x:-1,y:0}, {x:1,y:0}, {x:1,y:2}, {x:2,y:0}, {x:3,y:2}, {x:3,y:4}, {x:1,y:4}, {x:1,y:3}, {x:-1,y:3}, {x:-1,y:4}, {x:-3,y:4}, {x:-3,y:2}, {x:-2,y:0}],
    [{x:0,y:2}, {x:1,y:4}, {x:-1,y:4}],
    [{x:0,y:-2}, {x:1,y:-4}, {x:-1,y:-4}],
    [{x:0,y:0}, {x:2,y:1}, {x:1,y:3}, {x:-1,y:3}, {x:-2,y:1}],
    [{x:0,y:0}, {x:2,y:0}, {x:3,y:2}, {x:2,y:4}, {x:0,y:4}, {x:-1,y:2}],
    [{x:-2,y:0}, {x:2,y:0}, {x:3,y:1}, {x:1,y:3}, {x:-1,y:3}, {x:-3,y:1}],
    [{x:0,y:3}, {x:1,y:1}, {x:3,y:1}, {x:1,y:-1}, {x:2,y:-3}, {x:0,y:-1}, {x:-2,y:-3}, {x:-1,y:-1}, {x:-3,y:1}, {x:-1,y:1}],
    [{x:-2,y:0}, {x:2,y:0}, {x:2,y:3}, {x:0,y:5}, {x:-2,y:3}],
    [{x:0,y:0}, {x:1,y:1}, {x:2,y:0}, {x:2,y:2}, {x:0,y:2}],
    [{x:0,y:0}, {x:4,y:0}, {x:4,y:1}, {x:1,y:1}, {x:1,y:4}, {x:0,y:4}],
    [{x:-1,y:0}, {x:1,y:0}, {x:1,y:1}, {x:2,y:1}, {x:2,y:3}, {x:1,y:3}, {x:1,y:4}, {x:-1,y:4}, {x:-1,y:3}, {x:-2,y:3}, {x:-2,y:1}, {x:-1,y:1}],
    [{x:0,y:0}, {x:2,y:0}, {x:1,y:-3}],
    [{x:0,y:0}, {x:2,y:2}, {x:0,y:4}, {x:-2,y:2}],
    [{x:0,y:0}, {x:3,y:1}, {x:4,y:3}, {x:1,y:4}],
    [{x:0,y:0}, {x:4,y:0}, {x:5,y:2}, {x:1,y:2}],
    [{x:-1,y:0}, {x:3,y:0}, {x:3,y:1}, {x:2,y:1}, {x:2,y:4}, {x:0,y:4}, {x:0,y:1}, {x:-1,y:1}],
    [{x:0,y:0}, {x:2,y:0}, {x:2,y:4}, {x:0,y:4}, {x:0,y:2}, {x:-2,y:2}, {x:-2,y:0}],
    [{x:0,y:0}, {x:1,y:-2}, {x:3,y:-2}, {x:4,y:0}, {x:2,y:2}]
  ];

  const questions = [];
  for (let i = 0; i < num; i++) {
    const type = i < 3 ? qTypes[i] : qTypes[getRandomInt(0, 2)];
    let x = getRandomInt(-5, 5);
    let y = getRandomInt(-5, 5);
    if (x === 0 && y === 0) { x = 2; y = 3; }

    const selectedTemplate = shapeTemplates[getRandomInt(0, shapeTemplates.length - 1)];
    const vertices = selectedTemplate.map(v => ({ x: v.x + x, y: v.y + y }));
    const targetVertex = vertices[0];
    const targetX = targetVertex.x;
    const targetY = targetVertex.y;

    let q = { id: i, type, x: targetX, y: targetY };
    let correctStr = "";
    let distractors = [];
    let ptLabel = type === 'translasi' ? 'P' : type === 'pantulan' ? 'K' : 'R';
    q.ptLabel = ptLabel;
    let imageVertices = [];

    if (type === 'translasi') {
      const dx = getRandomInt(-5, 5);
      const dy = getRandomInt(-5, 5);
      correctStr = `(${targetX + dx}, ${targetY + dy})`;
      q.dx = dx; q.dy = dy; q.newX = targetX + dx; q.newY = targetY + dy;
      imageVertices = vertices.map(v => ({x: v.x + dx, y: v.y + dy}));
      q.visualData = { type: 'translasi', pt: {x: targetX, y: targetY}, correct: {x: targetX + dx, y: targetY + dy}, detail: `(${dx}, ${dy})`, vertices, imageVertices, ptLabel };
      distractors = [`(${targetX - dx}, ${targetY - dy})`, `(${targetX + dy}, ${targetY + dx})`, `(${targetX - dy}, ${targetY - dx})`];
    } 
    else if (type === 'pantulan') {
      const axes = ['Paksi-x', 'Paksi-y', 'Garis y=x', 'Garis y=-x'];
      const axis = axes[getRandomInt(0, axes.length - 1)];
      let newX, newY;
      if (axis === 'Paksi-x') { newX = targetX; newY = -targetY; distractors = [`(${-targetX}, ${targetY})`, `(${targetY}, ${targetX})`, `(${-targetY}, ${-targetX})`]; }
      else if (axis === 'Paksi-y') { newX = -targetX; newY = targetY; distractors = [`(${targetX}, ${-targetY})`, `(${targetY}, ${targetX})`, `(${-targetY}, ${-targetX})`]; }
      else if (axis === 'Garis y=x') { newX = targetY; newY = targetX; distractors = [`(${targetX}, ${-targetY})`, `(${-targetX}, ${targetY})`, `(${-targetY}, ${-targetX})`]; }
      else { newX = -targetY; newY = -targetX; distractors = [`(${targetX}, ${-targetY})`, `(${-targetX}, ${targetY})`, `(${targetY}, ${targetX})`]; }
      correctStr = `(${newX}, ${newY})`;
      
      q.axis = axis; q.newX = newX; q.newY = newY;
      
      imageVertices = vertices.map(v => {
        let nx = v.x, ny = v.y;
        if (axis === 'Paksi-x') ny = -ny;
        else if (axis === 'Paksi-y') nx = -nx;
        else if (axis === 'Garis y=x') { nx = v.y; ny = v.x; }
        else if (axis === 'Garis y=-x') { nx = -v.y; ny = -v.x; }
        return {x: nx, y: ny};
      });
      q.visualData = { type: 'pantulan', pt: {x: targetX, y: targetY}, correct: {x: newX, y: newY}, detail: axis, vertices, imageVertices, ptLabel };
    } 
    else { 
      const angles = [
        { labelCode: '90cw', label: '90° ikut arah jam', calc: (v, cx, cy) => ({nx: (v.y - cy) + cx, ny: -(v.x - cx) + cy}) },
        { labelCode: '90ccw', label: '90° lawan arah jam', calc: (v, cx, cy) => ({nx: -(v.y - cy) + cx, ny: (v.x - cx) + cy}) },
        { labelCode: '180', label: '180°', calc: (v, cx, cy) => ({nx: -(v.x - cx) + cx, ny: -(v.y - cy) + cy}) }
      ];
      const angleObj = angles[getRandomInt(0, angles.length - 1)];
      const cx = getRandomInt(-3, 3);
      const cy = getRandomInt(-3, 3);
      
      let {nx, ny} = angleObj.calc({x: targetX, y: targetY}, cx, cy);
      correctStr = `(${nx}, ${ny})`;
      distractors = [`(${-targetX + cx}, ${targetY + cy})`, `(${targetX - cy}, ${-targetY + cx})`, `(${nx + 1}, ${ny + 1})`, `(${nx - 2}, ${ny + 2})`];
      
      q.angleCode = angleObj.labelCode; q.newX = nx; q.newY = ny; q.cx = cx; q.cy = cy;
      
      imageVertices = vertices.map(v => {
        let {nx: vnx, ny: vny} = angleObj.calc({x: v.x, y: v.y}, cx, cy);
        return {x: vnx, y: vny};
      });
      q.visualData = { type: 'putaran', pt: {x: targetX, y: targetY}, correct: {x: nx, y: ny}, detail: angleObj.label, vertices, imageVertices, ptLabel, cx, cy };
    }

    let uniqueD = [...new Set(distractors)].filter(d => d !== correctStr);
    while (uniqueD.length < 3) {
      let rStr = `(${getRandomInt(-10, 10)}, ${getRandomInt(-10, 10)})`;
      if (rStr !== correctStr && !uniqueD.includes(rStr)) uniqueD.push(rStr);
    }
    
    let allOpts = [correctStr, uniqueD[0], uniqueD[1], uniqueD[2]];
    for (let j = allOpts.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allOpts[j], allOpts[k]] = [allOpts[k], allOpts[j]];
    }
    
    q.pilihan = allOpts;
    q.jawapanBetul = allOpts.indexOf(correctStr);
    q.kategori_ms = type === 'translasi' ? 'Translasi' : type === 'pantulan' ? 'Pantulan' : 'Putaran';
    q.kategori_en = type === 'translasi' ? 'Translation' : type === 'pantulan' ? 'Reflection' : 'Rotation';
    q.iconString = type === 'translasi' ? 'move' : type === 'pantulan' ? 'flip' : 'rotate';
    q.warna = type === 'translasi' ? 'bg-blue-500' : type === 'pantulan' ? 'bg-purple-500' : 'bg-amber-500';
    questions.push(q);
  }
  return questions;
};

const CartesianGrid = ({ visualData, isAnswered, lang }) => {
  if (!visualData) return null;
  const { type, pt, correct, detail, vertices, imageVertices, ptLabel } = visualData;
  const visualPoints = [...(vertices || []), ...(imageVertices || []), pt, correct].filter(Boolean);
  const maxCoordinate = Math.max(
    6,
    ...visualPoints.flatMap((point) => [Math.abs(point.x), Math.abs(point.y)]),
  );
  const GRID_LIMIT = Math.min(14, Math.max(8, Math.ceil(maxCoordinate + 2)));
  const scale = 119 / GRID_LIMIT; 
  const toSvgX = (val) => val * scale;
  const toSvgY = (val) => -val * scale; 

  const gridLines = [];
  const axisNumbers = [];
  const gridMin = -GRID_LIMIT * scale;
  const gridMax = GRID_LIMIT * scale;
  const numberTextProps = {
    fontSize: 8,
    fill: '#0f172a',
    stroke: 'white',
    strokeWidth: 1,
    paintOrder: 'stroke',
    className: 'font-sans font-bold',
  };

  const pointTextProps = {
    fontSize: 9.5,
    stroke: 'white',
    strokeWidth: 1.2,
    paintOrder: 'stroke',
    className: 'font-sans font-black',
  };

  for (let i = -GRID_LIMIT; i <= GRID_LIMIT; i++) {
    const pos = i * scale;
    const isAxis = i === 0;
    gridLines.push(<line key={`v${i}`} x1={pos} y1={gridMin} x2={pos} y2={gridMax} stroke={isAxis ? "#0f172a" : "#e2e8f0"} strokeWidth={isAxis ? 1.6 : 0.5} />);
    gridLines.push(<line key={`h${i}`} x1={gridMin} y1={pos} x2={gridMax} y2={pos} stroke={isAxis ? "#0f172a" : "#e2e8f0"} strokeWidth={isAxis ? 1.6 : 0.5} />);

    // ticks and labels for every integer coordinate (except origin 0 to avoid overlapping)
    if (i !== 0) {
      axisNumbers.push(<line key={`xtick${i}`} x1={pos} y1="-3" x2={pos} y2="3" stroke="#64748b" strokeWidth="0.9" />);
      axisNumbers.push(<line key={`ytick${i}`} x1="-3" y1={-pos} x2="3" y2={-pos} stroke="#64748b" strokeWidth="0.9" />);
      
      // Draw number labels only for even numbers to prevent crowding
      if (i % 2 === 0) {
        axisNumbers.push(<text key={`xlabel${i}`} x={pos} y="12" textAnchor="middle" {...numberTextProps}>{i}</text>);
        axisNumbers.push(<text key={`ylabel${i}`} x="-12" y={-pos + 3} textAnchor="end" {...numberTextProps}>{i}</text>);
      }
    }
  }

  const makePolygonPath = (points) => {
    if (!points || points.length === 0) return "";
    const svgPts = points.map(p => `${toSvgX(p.x)},${toSvgY(p.y)}`);
    return `M ${svgPts.join(' L ')} Z`;
  };

  return (
    <div className="w-full h-full min-h-[500px] lg:min-h-[700px] flex items-center justify-center bg-white rounded-xl border-2 border-slate-200 overflow-hidden relative">
      <svg viewBox="-132 -132 264 264" className="w-full h-auto aspect-square max-w-[560px] lg:max-w-[680px]">
        {gridLines}
        {axisNumbers}
        <text x="6" y="12" textAnchor="start" {...numberTextProps}>0</text>
        <text x="123" y="12" fontSize="8" fill="#334155" className="font-sans font-bold">x</text>
        <text x="6" y="-122" fontSize="8" fill="#334155" className="font-sans font-bold">y</text>
 
        {type === 'pantulan' && (
          <line 
            x1={detail === 'Paksi-y' ? 0 : detail === 'Garis y=x' ? gridMin : detail === 'Garis y=-x' ? gridMin : gridMin}
            y1={detail === 'Paksi-x' ? 0 : detail === 'Garis y=x' ? gridMax : detail === 'Garis y=-x' ? gridMin : gridMin}
            x2={detail === 'Paksi-y' ? 0 : detail === 'Garis y=x' ? gridMax : detail === 'Garis y=-x' ? gridMax : gridMax}
            y2={detail === 'Paksi-x' ? 0 : detail === 'Garis y=x' ? gridMin : detail === 'Garis y=-x' ? gridMax : gridMax}
            stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6"
          />
        )}
        {type === 'putaran' && <circle cx="0" cy="0" r="2.5" fill="#f59e0b" opacity="0.8" />}
 
        {/* Poligon Objek */}
        <path d={makePolygonPath(vertices)} fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={toSvgX(pt.x)} cy={toSvgY(pt.y)} r="4" fill="#1d4ed8" />
        <text x={toSvgX(pt.x) + 6} y={toSvgY(pt.y) - 6} fill="#1d4ed8" {...pointTextProps}>{ptLabel}({pt.x}, {pt.y})</text>
 
        {isAnswered && (
          <>
            {/* Poligon Imej */}
            <path d={makePolygonPath(imageVertices)} fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4,4" />
            <circle cx={toSvgX(correct.x)} cy={toSvgY(correct.y)} r="4" fill="#15803d" className="animate-pulse" />
            <text x={toSvgX(correct.x) + 6} y={toSvgY(correct.y) - 6} fill="#15803d" {...pointTextProps}>{ptLabel}'({correct.x}, {correct.y})</text>
          </>
        )}
      </svg>
      <div className="absolute bottom-2 left-2 bg-white/90 p-1.5 rounded shadow-sm text-[10px] flex gap-2 border border-slate-100">
        <span className="flex items-center gap-1 text-blue-700"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {lang === 'en' ? 'Object' : 'Objek'}</span>
        {isAnswered && <span className="flex items-center gap-1 text-green-700"><span className="w-2 h-2 rounded-full bg-green-500"></span> {lang === 'en' ? 'Image' : 'Imej'}</span>}
      </div>
    </div>
  );
};

const SectionKuiz = ({ lang, sessionUser }) => {
  const [quizData, setQuizData] = useState(() => generateQuestionsData(10));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [fetchingLeaderboard, setFetchingLeaderboard] = useState(false);

  useEffect(() => {
    if (showScore) {
      const fetchLeaderboard = async () => {
        setFetchingLeaderboard(true);
        try {
          const q = query(collection(db, 'scores'), orderBy('date', 'desc'), limit(100));
          const querySnapshot = await getDocs(q);
          const allScores = [];
          querySnapshot.forEach((doc) => {
            allScores.push({ id: doc.id, ...doc.data() });
          });
          const kuizScores = allScores
            .filter(s => s.type === 'kuiz')
            .sort((a, b) => b.percentage - a.percentage);

          const uniqueUsers = new Set();
          const topScores = [];
          for (const score of kuizScores) {
            if (!uniqueUsers.has(score.userName)) {
              uniqueUsers.add(score.userName);
              topScores.push(score);
              if (topScores.length === 5) break;
            }
          }
          setLeaderboard(topScores);
        } catch (error) {
          console.error("Error fetching leaderboard:", error);
        }
        setFetchingLeaderboard(false);
      };
      fetchLeaderboard();
    }
  }, [showScore]);

  if (quizData.length === 0) return <div className="flex items-center justify-center min-h-[400px] text-slate-500"><Loader2 className="animate-spin mr-2"/> {lang === 'en' ? 'Generating questions...' : 'Menjana soalan...'}</div>;

  const q = quizData[currentQuestion];
  const IconComponent = q.iconString === 'move' ? Move : q.iconString === 'flip' ? FlipHorizontal : RotateCw;

  const handleAnswerClick = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    if (index === q.jawapanBetul) setScore(score + 1);
  };

  const handleNextQuestion = async () => {
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < quizData.length) {
      setCurrentQuestion(nextQuestion);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      if (sessionUser && sessionUser.role !== 'admin') {
        await saveQuizScore(sessionUser, score, quizData.length);
      }
      setShowScore(true);
    }
  };

  const restartQuiz = () => {
    setQuizData(generateQuestionsData(10));
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setLeaderboard([]);
  };

  const getQuestionText = () => {
    if (q.type === 'translasi') {
      return lang === 'en'
        ? `The diagram shows a polygon with vertex ${q.ptLabel}(${q.x}, ${q.y}). If this polygon is translated by vector (${q.dx}, ${q.dy}), what are the coordinates of the image vertex ${q.ptLabel}'?`
        : `Graf menunjukkan sebuah poligon dengan bucu ${q.ptLabel}(${q.x}, ${q.y}). Jika poligon ini melalui translasi vektor (${q.dx}, ${q.dy}), apakah koordinat bagi imej bucu ${q.ptLabel}'?`;
    } else if (q.type === 'pantulan') {
      const axisEn = q.axis === 'Paksi-x' ? 'X-axis' : q.axis === 'Paksi-y' ? 'Y-axis' : q.axis === 'Garis y=x' ? 'Line y=x' : 'Line y=-x';
      return lang === 'en'
        ? `The diagram shows an object with vertex ${q.ptLabel}(${q.x}, ${q.y}). The object is reflected on the ${axisEn}. What are the coordinates of the image vertex ${q.ptLabel}'?`
        : `Graf menunjukkan sebuah objek dengan bucu ${q.ptLabel}(${q.x}, ${q.y}). Objek ini melalui pantulan pada ${q.axis}. Apakah koordinat bagi imej bucu ${q.ptLabel}'?`;
    } else {
      const angleEn = q.angleCode === '90cw' ? '90° clockwise' : q.angleCode === '90ccw' ? '90° anticlockwise' : '180°';
      return lang === 'en'
        ? `The diagram shows an object with vertex ${q.ptLabel}(${q.x}, ${q.y}). The object is rotated ${angleEn} at the center (${q.cx}, ${q.cy}). Find the coordinates of the image vertex ${q.ptLabel}'.`
        : `Graf menunjukkan sebuah objek dengan bucu ${q.ptLabel}(${q.x}, ${q.y}). Objek ini melalui putaran ${q.angleCode === '90cw' ? '90° ikut arah jam' : q.angleCode === '90ccw' ? '90° lawan arah jam' : '180°'} pada pusat (${q.cx}, ${q.cy}). Cari koordinat bagi imej bucu ${q.ptLabel}'.`;
    }
  };

  const getExplanationText = () => {
    if (q.type === 'translasi') {
      return lang === 'en'
        ? `Translation: Add the vector values to the original axis. x = ${q.x} + (${q.dx}) = ${q.newX}, y = ${q.y} + (${q.dy}) = ${q.newY}.`
        : `Translasi: Tambahkan nilai vektor ke paksi asal. x = ${q.x} + (${q.dx}) = ${q.newX}, y = ${q.y} + (${q.dy}) = ${q.newY}.`;
    } else if (q.type === 'pantulan') {
      const axisEn = q.axis === 'Paksi-x' ? 'X-axis' : q.axis === 'Paksi-y' ? 'Y-axis' : q.axis === 'Garis y=x' ? 'Line y=x' : 'Line y=-x';
      return lang === 'en'
        ? `Reflection on ${axisEn} changes coordinates (${q.x}, ${q.y}) to its image at (${q.newX}, ${q.newY}).`
        : `Pantulan pada ${q.axis} menukarkan koordinat (${q.x}, ${q.y}) kepada imej (${q.newX}, ${q.newY}).`;
    } else {
      const angleEn = q.angleCode === '90cw' ? '90° clockwise' : q.angleCode === '90ccw' ? '90° anticlockwise' : '180°';
      return lang === 'en'
        ? `Rotation ${angleEn} at center (${q.cx}, ${q.cy}). The point moves from (${q.x}, ${q.y}) to its image at (${q.newX}, ${q.newY}).`
        : `Putaran ${q.angleCode === '90cw' ? '90° ikut arah jam' : q.angleCode === '90ccw' ? '90° lawan arah jam' : '180°'} pada pusat (${q.cx}, ${q.cy}) mengubah kedudukan dari (${q.x}, ${q.y}) kepada (${q.newX}, ${q.newY}).`;
    }
  };

  if (showScore) {
    const percentage = Math.round((score / quizData.length) * 100);
    let message = "";
    if (lang === 'en') {
      message = percentage === 100 ? "Outstanding! You have mastered the Cartesian Plane!" 
                : percentage >= 60 ? "Congratulations! Your understanding is very good." 
                : "Don't give up! Continuous practice will pay off.";
    } else {
      message = percentage === 100 ? "Luar Biasa! Anda menguasai Satah Cartes!" 
                : percentage >= 60 ? "Tahniah! Pemahaman anda sangat baik." 
                : "Jangan putus asa! Latihan berterusan akan membuahkan hasil.";
    }

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
            <Trophy className="text-yellow-500 w-12 h-12" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{lang === 'en' ? 'Session Completed!' : 'Sesi Tamat!'}</h2>
        <p className="text-slate-500 mb-6">{message}</p>
        
        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200">
          <div className="text-5xl font-extrabold text-blue-600 mb-2">
            {score} <span className="text-2xl text-slate-400">/ {quizData.length}</span>
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{lang === 'en' ? 'Current Score' : 'Skor Semasa'}</p>
        </div>

        {/* Leaderboard Section */}
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-800 text-white p-3 font-semibold text-sm tracking-wide uppercase flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            {lang === 'en' ? 'Top 5 Leaderboard' : 'Papan Pendahulu Teratas (Top 5)'}
          </div>
          <div className="p-0">
            {fetchingLeaderboard ? (
              <div className="p-6 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : leaderboard.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {leaderboard.map((item, index) => (
                  <li key={item.id} className={`flex items-center justify-between p-4 ${index === 0 ? 'bg-yellow-50/50' : index === 1 ? 'bg-slate-50/50' : index === 2 ? 'bg-orange-50/30' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-slate-300 text-slate-700' : index === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {index + 1}
                      </div>
                      <div className="font-semibold text-slate-700">{item.userName || 'Unknown'}</div>
                    </div>
                    <div className="font-mono font-bold text-blue-600">{item.percentage}%</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-sm text-slate-400">{lang === 'en' ? 'No records yet. Be the first!' : 'Belum ada rekod. Jadilah yang pertama!'}</div>
            )}
          </div>
        </div>

        <button onClick={restartQuiz} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
          <RefreshCw className="w-5 h-5" /> {lang === 'en' ? 'Play Again (New Questions)' : 'Main Semula (Soalan Baharu)'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className={`${q.warna} p-5 md:px-10 text-white flex justify-between items-center transition-colors duration-500`}>
        <div className="flex items-center gap-3">
          <IconComponent className="w-7 h-7 text-white/90" />
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide">{lang === 'en' ? q.kategori_en : q.kategori_ms}</h2>
        </div>
        <div className="text-sm md:text-base font-medium bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
          {lang === 'en' ? 'Question' : 'Soalan'} {currentQuestion + 1} / {quizData.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)] p-4 md:p-8 gap-8">
        <div className="w-full flex flex-col gap-3">
          <div className="text-base font-semibold text-slate-500 uppercase tracking-wider pl-1">{lang === 'en' ? 'Numbered Coordinate Graph' : 'Graf Koordinat Bernombor'}</div>
          <CartesianGrid visualData={q.visualData} isAnswered={isAnswered} lang={lang} />
          {isAnswered && <div className="text-sm text-center text-slate-500 italic mt-1">{lang === 'en' ? 'Image (green color) appears after you answer.' : 'Imej (warna hijau) muncul selepas anda menjawab.'}</div>}
        </div>

        <div className="w-full flex flex-col">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-8 leading-relaxed">{getQuestionText()}</h2>
          <div className="grid grid-cols-1 gap-4 mb-8">
            {q.pilihan.map((pilihan, index) => {
              let btnStyle = "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700";
              let icon = null;
              if (isAnswered) {
                if (index === q.jawapanBetul) {
                  btnStyle = "bg-green-50 border-green-500 text-green-700 shadow-sm";
                  icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                } else if (index === selectedAnswer) {
                  btnStyle = "bg-red-50 border-red-400 text-red-700";
                  icon = <XCircle className="w-5 h-5 text-red-500" />;
                } else {
                  btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                }
              }
              return (
                <button
                  key={index} onClick={() => handleAnswerClick(index)} disabled={isAnswered}
                  className={`w-full text-left px-6 py-4 rounded-xl border-2 font-mono text-xl font-semibold transition-all duration-200 flex items-center justify-between group ${btnStyle} ${!isAnswered && 'hover:border-blue-400 hover:shadow-md'}`}
                >
                  <span>{pilihan}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className={`p-4 rounded-xl mb-6 flex-grow animate-in slide-in-from-bottom-2 fade-in ${selectedAnswer === q.jawapanBetul ? 'bg-green-100 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-100'}`}>
              <p className="font-bold mb-2 flex items-center gap-2">
                {selectedAnswer === q.jawapanBetul ? <><CheckCircle2 className="w-5 h-5 text-green-600"/> {lang === 'en' ? 'Exactly Right!' : 'Tepat Sekali!'}</> : <><XCircle className="w-5 h-5 text-red-500"/> {lang === 'en' ? 'Incorrect.' : 'Kurang Tepat.'}</>}
              </p>
              <p className="text-sm opacity-90 leading-relaxed font-medium">{getExplanationText()}</p>
            </div>
          )}

          <div className="mt-auto flex justify-end">
            <button
              onClick={handleNextQuestion} disabled={!isAnswered}
              className={`flex items-center gap-2 font-bold py-3 px-6 rounded-xl transition-all duration-200 ${isAnswered ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              {currentQuestion === quizData.length - 1 ? (lang === 'en' ? 'See Results' : 'Lihat Keputusan') : (lang === 'en' ? 'Next' : 'Seterusnya')} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



// =====================================================================
// 4. GAME RRGs (RUNNING RANGERS GAME: SUPER)
// =====================================================================

const RRG_CARD_IMAGE = (deck, page) => `/assets/rrgs/cards/${deck}-page-${page}.png`;
const makeRrgCard = (deck, page, card) => ({ ...card, deck, page, cardImage: RRG_CARD_IMAGE(deck, page) });

const RRG_DECK_META = {
  red: { deck: 'merah', label: 'Merah', label_en: 'Red', cardName: 'Kad Translasi', cardName_en: 'Translation Card', symbol: '🔴', color: '#ef4444' },
  green: { deck: 'hijau', label: 'Hijau', label_en: 'Green', cardName: 'Kad Pantulan', cardName_en: 'Reflection Card', symbol: '🟢', color: '#16a34a' },
  blue: { deck: 'biru', label: 'Biru', label_en: 'Blue', cardName: 'Kad Putaran', cardName_en: 'Rotation Card', symbol: '🔵', color: '#2563eb' },
  reward: { deck: 'kuning', label: 'Kuning', label_en: 'Yellow', cardName: 'Kad Ganjaran', cardName_en: 'Reward Card', symbol: '🟡', color: '#facc15' },
  penalty: { deck: 'hitam', label: 'Hitam', label_en: 'Black', cardName: 'Kad Denda', cardName_en: 'Penalty Card', symbol: '⚫', color: '#111827' },
};

const RRG_TRANSFORM_CARDS = {
  red: [
    makeRrgCard('merah', 2, { title: 'Translasi (-3, -2)', text: 'Translasi dengan vektor (-3, -2).', type: 'translasi', dx: -3, dy: -2 }),
    makeRrgCard('merah', 4, { title: 'Translasi (2, 2)', text: 'Translasi dengan vektor (2, 2).', type: 'translasi', dx: 2, dy: 2 }),
    makeRrgCard('merah', 6, { title: 'Translasi (0, 4)', text: 'Translasi dengan vektor (0, 4).', type: 'translasi', dx: 0, dy: 4 }),
    makeRrgCard('merah', 8, { title: 'Translasi (5, -6)', text: 'Translasi dengan vektor (5, -6).', type: 'translasi', dx: 5, dy: -6 }),
    makeRrgCard('merah', 10, { title: 'Translasi (-6, 0)', text: 'Translasi dengan vektor (-6, 0).', type: 'translasi', dx: -6, dy: 0 }),
    makeRrgCard('merah', 12, { title: 'Translasi (0, -4)', text: 'Translasi dengan vektor (0, -4).', type: 'translasi', dx: 0, dy: -4 }),
    makeRrgCard('merah', 14, { title: 'Translasi (4, -6)', text: 'Translasi dengan vektor (4, -6).', type: 'translasi', dx: 4, dy: -6 }),
    makeRrgCard('merah', 16, { title: 'Translasi (-7, 0)', text: 'Translasi dengan vektor (-7, 0).', type: 'translasi', dx: -7, dy: 0 }),
    makeRrgCard('merah', 18, { title: 'Translasi (0, -6)', text: 'Translasi dengan vektor (0, -6).', type: 'translasi', dx: 0, dy: -6 }),
    makeRrgCard('merah', 20, { title: 'Translasi (-4, -6)', text: 'Translasi dengan vektor (-4, -6).', type: 'translasi', dx: -4, dy: -6 }),
    makeRrgCard('merah', 22, { title: 'Translasi (6, 5)', text: 'Translasi dengan vektor (6, 5).', type: 'translasi', dx: 6, dy: 5 }),
    makeRrgCard('merah', 24, { title: 'Translasi (0, 8)', text: 'Translasi dengan vektor (0, 8).', type: 'translasi', dx: 0, dy: 8 }),
    makeRrgCard('merah', 26, { title: 'Translasi (1, 3)', text: 'Translasi dengan vektor (1, 3).', type: 'translasi', dx: 1, dy: 3 }),
    makeRrgCard('merah', 28, { title: 'Translasi (-1, -2)', text: 'Translasi dengan vektor (-1, -2).', type: 'translasi', dx: -1, dy: -2 }),
    makeRrgCard('merah', 30, { title: 'Translasi (-8, -1)', text: 'Translasi dengan vektor (-8, -1).', type: 'translasi', dx: -8, dy: -1 }),
    makeRrgCard('merah', 32, { title: 'Translasi (2, -3)', text: 'Translasi dengan vektor (2, -3).', type: 'translasi', dx: 2, dy: -3 }),
    makeRrgCard('merah', 34, { title: 'Translasi (-2, -5)', text: 'Translasi dengan vektor (-2, -5).', type: 'translasi', dx: -2, dy: -5 }),
    makeRrgCard('merah', 36, { title: 'Translasi (-5, 2)', text: 'Translasi dengan vektor (-5, 2).', type: 'translasi', dx: -5, dy: 2 }),
    makeRrgCard('merah', 38, { title: 'Translasi (-4, 1)', text: 'Translasi dengan vektor (-4, 1).', type: 'translasi', dx: -4, dy: 1 }),
    makeRrgCard('merah', 40, { title: 'Translasi (-1, 3)', text: 'Translasi dengan vektor (-1, 3).', type: 'translasi', dx: -1, dy: 3 }),
  ],
  green: [
    makeRrgCard('hijau', 2, { title: 'Pantulan paksi-x', text: 'Pantulan pada paksi-x.', type: 'pantulan', axis: 'x' }),
    makeRrgCard('hijau', 4, { title: 'Pantulan x = 2', text: 'Pantulan pada garis x = 2.', type: 'pantulan', axis: 'xLine', value: 2 }),
    makeRrgCard('hijau', 6, { title: 'Pantulan x = y', text: 'Pantulan pada garis x = y.', type: 'pantulan', axis: 'yx' }),
    makeRrgCard('hijau', 8, { title: 'Pantulan y = -1', text: 'Pantulan pada garis y = -1.', type: 'pantulan', axis: 'yLine', value: -1 }),
    makeRrgCard('hijau', 10, { title: 'Pantulan paksi-y', text: 'Pantulan pada paksi-y.', type: 'pantulan', axis: 'y' }),
    makeRrgCard('hijau', 12, { title: 'Pantulan x = -2', text: 'Pantulan pada garis x = -2.', type: 'pantulan', axis: 'xLine', value: -2 }),
    makeRrgCard('hijau', 14, { title: 'Pantulan y = -3', text: 'Pantulan pada garis y = -3.', type: 'pantulan', axis: 'yLine', value: -3 }),
    makeRrgCard('hijau', 16, { title: 'Pantulan x = 4', text: 'Pantulan pada garis x = 4.', type: 'pantulan', axis: 'xLine', value: 4 }),
    makeRrgCard('hijau', 18, { title: 'Pantulan x = -y', text: 'Pantulan pada garis x = -y.', type: 'pantulan', axis: 'ynx' }),
    makeRrgCard('hijau', 20, { title: 'Pantulan x = 3', text: 'Pantulan pada garis x = 3.', type: 'pantulan', axis: 'xLine', value: 3 }),
    makeRrgCard('hijau', 22, { title: 'Pantulan y = 2', text: 'Pantulan pada garis y = 2.', type: 'pantulan', axis: 'yLine', value: 2 }),
    makeRrgCard('hijau', 24, { title: 'Pantulan y = 4', text: 'Pantulan pada garis y = 4.', type: 'pantulan', axis: 'yLine', value: 4 }),
    makeRrgCard('hijau', 26, { title: 'Pantulan x = -1', text: 'Pantulan pada garis x = -1.', type: 'pantulan', axis: 'xLine', value: -1 }),
    makeRrgCard('hijau', 28, { title: 'Pantulan x = -3', text: 'Pantulan pada garis x = -3.', type: 'pantulan', axis: 'xLine', value: -3 }),
    makeRrgCard('hijau', 30, { title: 'Pantulan x = -4', text: 'Pantulan pada garis x = -4.', type: 'pantulan', axis: 'xLine', value: -4 }),
    makeRrgCard('hijau', 32, { title: 'Pantulan x = 1', text: 'Pantulan pada garis x = 1.', type: 'pantulan', axis: 'xLine', value: 1 }),
    makeRrgCard('hijau', 34, { title: 'Pantulan y = 1', text: 'Pantulan pada garis y = 1.', type: 'pantulan', axis: 'yLine', value: 1 }),
    makeRrgCard('hijau', 36, { title: 'Pantulan y = 3', text: 'Pantulan pada garis y = 3.', type: 'pantulan', axis: 'yLine', value: 3 }),
    makeRrgCard('hijau', 38, { title: 'Pantulan y = -2', text: 'Pantulan pada garis y = -2.', type: 'pantulan', axis: 'yLine', value: -2 }),
    makeRrgCard('hijau', 40, { title: 'Pantulan y = -4', text: 'Pantulan pada garis y = -4.', type: 'pantulan', axis: 'yLine', value: -4 }),
  ],
  blue: [
    makeRrgCard('biru', 2, { title: 'Putaran 90° ikut jam', text: 'Putaran 90° ikut arah jam pada titik (1, 1).', type: 'putaran', angle: 90, dir: 'cw', cx: 1, cy: 1 }),
    makeRrgCard('biru', 4, { title: 'Putaran 90° lawan jam', text: 'Putaran 90° lawan arah jam pada titik (0, 0).', type: 'putaran', angle: 90, dir: 'ccw', cx: 0, cy: 0 }),
    makeRrgCard('biru', 6, { title: 'Putaran 180° ikut jam', text: 'Putaran 180° ikut arah jam pada titik (0, 0).', type: 'putaran', angle: 180, dir: 'cw', cx: 0, cy: 0 }),
    makeRrgCard('biru', 8, { title: 'Putaran 180° ikut jam', text: 'Putaran 180° ikut arah jam pada titik (-1, -1).', type: 'putaran', angle: 180, dir: 'cw', cx: -1, cy: -1 }),
    makeRrgCard('biru', 10, { title: 'Putaran 270° lawan jam', text: 'Putaran 270° lawan arah jam pada titik (2, 1).', type: 'putaran', angle: 270, dir: 'ccw', cx: 2, cy: 1 }),
    makeRrgCard('biru', 12, { title: 'Putaran 90° ikut jam', text: 'Putaran 90° ikut arah jam pada titik (0, 0).', type: 'putaran', angle: 90, dir: 'cw', cx: 0, cy: 0 }),
    makeRrgCard('biru', 14, { title: 'Putaran 270° ikut jam', text: 'Putaran 270° ikut arah jam pada titik (-2, -2).', type: 'putaran', angle: 270, dir: 'cw', cx: -2, cy: -2 }),
    makeRrgCard('biru', 16, { title: 'Putaran 180° lawan jam', text: 'Putaran 180° lawan arah jam pada titik (0, 0).', type: 'putaran', angle: 180, dir: 'ccw', cx: 0, cy: 0 }),
    makeRrgCard('biru', 18, { title: 'Putaran 90° lawan jam', text: 'Putaran 90° lawan arah jam pada titik (0, 3).', type: 'putaran', angle: 90, dir: 'ccw', cx: 0, cy: 3 }),
    makeRrgCard('biru', 20, { title: 'Putaran 180° ikut jam', text: 'Putaran 180° ikut arah jam pada titik (1, -1).', type: 'putaran', angle: 180, dir: 'cw', cx: 1, cy: -1 }),
    makeRrgCard('biru', 22, { title: 'Putaran 270° lawan jam', text: 'Putaran 270° lawan arah jam pada titik (2, 3).', type: 'putaran', angle: 270, dir: 'ccw', cx: 2, cy: 3 }),
    makeRrgCard('biru', 24, { title: 'Putaran 180° ikut jam', text: 'Putaran 180° ikut arah jam pada titik (-2, -3).', type: 'putaran', angle: 180, dir: 'cw', cx: -2, cy: -3 }),
    makeRrgCard('biru', 26, { title: 'Putaran 270° lawan jam', text: 'Putaran 270° lawan arah jam pada titik (0, 0).', type: 'putaran', angle: 270, dir: 'ccw', cx: 0, cy: 0 }),
    makeRrgCard('biru', 28, { title: 'Putaran 270° ikut jam', text: 'Putaran 270° ikut arah jam pada titik (0, 0).', type: 'putaran', angle: 270, dir: 'cw', cx: 0, cy: 0 }),
    makeRrgCard('biru', 30, { title: 'Putaran 180° lawan jam', text: 'Putaran 180° lawan arah jam pada titik (1, 1).', type: 'putaran', angle: 180, dir: 'ccw', cx: 1, cy: 1 }),
    makeRrgCard('biru', 32, { title: 'Putaran 180° lawan jam', text: 'Putaran 180° lawan arah jam pada titik (2, 1).', type: 'putaran', angle: 180, dir: 'ccw', cx: 2, cy: 1 }),
    makeRrgCard('biru', 34, { title: 'Putaran 90° ikut jam', text: 'Putaran 90° ikut arah jam pada titik (2, 1).', type: 'putaran', angle: 90, dir: 'cw', cx: 2, cy: 1 }),
    makeRrgCard('biru', 36, { title: 'Putaran 90° lawan jam', text: 'Putaran 90° lawan arah jam pada titik (-1, 2).', type: 'putaran', angle: 90, dir: 'ccw', cx: -1, cy: 2 }),
    makeRrgCard('biru', 38, { title: 'Putaran 270° ikut jam', text: 'Putaran 270° ikut arah jam pada titik (1, 0).', type: 'putaran', angle: 270, dir: 'cw', cx: 1, cy: 0 }),
    makeRrgCard('biru', 40, { title: 'Putaran 270° lawan jam', text: 'Putaran 270° lawan arah jam pada titik (2, 2).', type: 'putaran', angle: 270, dir: 'ccw', cx: 2, cy: 2 }),
  ],
};

const RRG_REWARD_CARDS = [
  makeRrgCard('kuning', 2, {
    title: 'Ganjaran RM65',
    title_en: 'RM65 Reward',
    text: 'Wang terkumpul anda bertambah sebanyak RM65 kerana berjaya menjual sayuran kepada para nelayan.',
    text_en: 'Your accumulated money increases by RM65 from selling vegetables to fishermen.',
    effect: { score: 65 }
  }),
  makeRrgCard('kuning', 4, {
    title: 'Giliran Tambahan',
    title_en: 'Extra Turn',
    text: 'Hari ini adalah hari ulang tahun kelahiran anda. Anda diberi giliran bermain sekali lagi.',
    text_en: 'Today is your birthday! You are granted an extra turn.',
    effect: { extraTurn: 1 }
  }),
  makeRrgCard('kuning', 6, {
    title: 'Peti Harta Karun',
    title_en: 'Treasure Chest',
    text: 'Anda berjaya menemui peti harta karun. Anda menerima wang ganjaran sebanyak RM300.',
    text_en: 'You discovered a treasure chest. You receive a reward of RM300.',
    effect: { score: 300 }
  }),
  makeRrgCard('kuning', 8, {
    title: 'Sekarung Syiling Emas',
    title_en: 'Sack of Gold Coins',
    text: 'Anda berjaya menemui sekarung syiling emas. Anda menerima wang ganjaran sebanyak RM200.',
    text_en: 'You found a sack of gold coins. You receive a reward of RM200.',
    effect: { score: 200 }
  }),
  makeRrgCard('kuning', 10, {
    title: 'Bantu Baca Peta',
    title_en: 'Map Reading Assistance',
    text: 'Anda menerima RM10 daripada setiap pemain lain kerana membantu mereka membaca peta.',
    text_en: 'You receive RM10 from each other player for helping them read the map.',
    effect: { transferFromAll: 10 }
  }),
  makeRrgCard('kuning', 12, {
    title: 'Upah Gerai Tasik',
    title_en: 'Lakeside Stall Wages',
    text: 'Anda menerima RM80 sebagai upah mempromosi gerai jualan di tasik.',
    text_en: 'You receive RM80 wages for promoting sales stalls at the lake.',
    effect: { score: 80 }
  }),
  makeRrgCard('kuning', 14, {
    title: 'Wang Sagu Hati',
    title_en: 'Consolation Reward',
    text: 'Anda menerima wang sagu hati sebanyak RM20 daripada setiap pemain lain.',
    text_en: 'You receive a consolation sum of RM20 from each other player.',
    effect: { transferFromAll: 20 }
  }),
  makeRrgCard('kuning', 16, {
    title: 'Bekukan Semua Pemain',
    title_en: 'Freeze All Players',
    text: 'Anda berpeluang membekukan satu giliran semua pemain lain.',
    text_en: 'You get to freeze one turn of all other players.',
    effect: { freezeOthers: 1 }
  }),
  makeRrgCard('kuning', 18, {
    title: 'Jumpa Kuda Hilang',
    title_en: 'Found Lost Horse',
    text: 'Anda menerima RM100 daripada pemilik ladang kuda kerana berjaya menjumpai seekor kuda yang hilang.',
    text_en: 'You receive RM100 from the horse ranch owner for finding a lost horse.',
    effect: { score: 100 }
  }),
  makeRrgCard('kuning', 20, {
    title: 'Menyiram Sayur',
    title_en: 'Watering Vegetables',
    text: 'Anda menerima RM50 daripada pemilik kebun sayur kerana membantu menyiram sayur.',
    text_en: 'You receive RM50 from the vegetable farm owner for helping to water vegetables.',
    effect: { score: 50 }
  }),
  makeRrgCard('kuning', 22, {
    title: 'Memerah Susu Lembu',
    title_en: 'Milking Cows',
    text: 'Anda menerima RM50 daripada pemilik ladang lembu kerana membantu memerah susu lembu.',
    text_en: 'You receive RM50 from the cattle ranch owner for helping to milk cows.',
    effect: { score: 50 }
  }),
  makeRrgCard('kuning', 24, {
    title: 'Selamatkan Kanak-kanak',
    title_en: 'Rescue Children',
    text: 'Anda menerima RM100 daripada Ketua Bomba Pulau Idaman sebagai ganjaran menyelamatkan dua orang kanak-kanak.',
    text_en: 'You receive RM100 from the Dream Island Fire Chief for rescuing two children.',
    effect: { score: 100 }
  }),
  makeRrgCard('kuning', 26, {
    title: 'Jumpa Artifak',
    title_en: 'Found Ancient Artifact',
    text: 'Anda menerima RM150 daripada Ketua Polis Pulau Idaman sebagai ganjaran menjumpai artifak berharga.',
    text_en: 'You receive RM150 from the Dream Island Police Chief for discovering a valuable artifact.',
    effect: { score: 150 }
  }),
  makeRrgCard('kuning', 28, {
    title: 'Bersihkan Air Terjun',
    title_en: 'Clean Waterfall',
    text: 'Anda menerima RM100 kerana membantu membersihkan kawasan rekreasi air terjun.',
    text_en: 'You receive RM100 for helping clean up the waterfall recreation area.',
    effect: { score: 100 }
  }),
  makeRrgCard('kuning', 30, {
    title: 'Jumpa Anak Hilang',
    title_en: 'Found Lost Child',
    text: 'Anda menerima RM100 daripada pelancong asing kerana menjumpai anaknya yang hilang.',
    text_en: 'You receive RM100 from a tourist for finding their lost child.',
    effect: { score: 100 }
  }),
  makeRrgCard('kuning', 32, {
    title: 'Jual Kelapa Laut',
    title_en: 'Sea Coconut Sales',
    text: 'Hasil jualan kelapa laut, anda menerima RM55.',
    text_en: 'From selling sea coconuts, you earn RM55.',
    effect: { score: 55 }
  }),
  makeRrgCard('kuning', 34, {
    title: 'Bekukan Seorang Pemain',
    title_en: 'Freeze a Player',
    text: 'Anda berpeluang membekukan giliran bermain seorang pemain lain yang anda pilih.',
    text_en: 'You get to freeze the turn of the next player.',
    effect: { freezeNext: 1 }
  }),
  makeRrgCard('kuning', 36, {
    title: 'Kad Ganjaran Lagi',
    title_en: 'Bonus Reward Card',
    text: 'Sebagai penghargaan sukarelawan bomba, anda berpeluang mendapatkan satu lagi kad ganjaran.',
    text_en: 'As a volunteer appreciation bonus, you draw another reward card.',
    effect: { drawRewardAgain: true }
  }),
  makeRrgCard('kuning', 38, {
    title: 'Dibantu Pemain Sebelum',
    title_en: 'Helped by Previous Player',
    text: 'Anda menerima RM15 daripada pemain sebelum anda kerana anda telah membantunya ketika tercedera.',
    text_en: 'You receive RM15 from the player before you for aiding them when injured.',
    effect: { transferFromPrevious: 15 }
  }),
  makeRrgCard('kuning', 40, {
    title: 'Selamatkan Rakan',
    title_en: 'Rescue a Friend',
    text: 'Anda menerima wang ganjaran sebanyak RM100 daripada Ketua Bomba Pulau Idaman.',
    text_en: 'You receive a reward of RM100 from the Dream Island Fire Chief.',
    effect: { score: 100 }
  }),
];

const RRG_PENALTY_CARDS = [
  makeRrgCard('hitam', 2, {
    title: 'Beri Wang Kepada Pemain Lain',
    title_en: 'Give Money to Other Players',
    text: 'Beri RM20 daripada wang terkumpul anda kepada setiap pemain lain.',
    text_en: 'Pay RM20 from your accumulated money to each other player.',
    effect: { payAll: 20 }
  }),
  makeRrgCard('hitam', 4, {
    title: 'Telefon Jatuh Ke Tasik',
    title_en: 'Phone Dropped into Lake',
    text: 'Telefon pintar anda terjatuh ke dalam tasik. Anda hilang satu giliran bermain yang berikutnya.',
    text_en: 'Your smartphone fell into the lake. You lose your next turn.',
    effect: { skipSelf: 1 }
  }),
  makeRrgCard('hitam', 6, {
    title: 'Kompaun Sampah',
    title_en: 'Littering Fine',
    text: 'Wang terkumpul anda dikurangkan sebanyak RM50 untuk membayar kompaun.',
    text_en: 'Your money is reduced by RM50 to pay a littering fine.',
    effect: { score: -50 }
  }),
  makeRrgCard('hitam', 8, {
    title: 'Beg Dilarikan Monyet',
    title_en: 'Bag Snatched by Monkey',
    text: 'Monyet di hutan melarikan beg anda. Anda kehilangan RM70.',
    text_en: 'A forest monkey snatched your bag. You lose RM70.',
    effect: { score: -70 }
  }),
  makeRrgCard('hitam', 10, {
    title: 'Sewa Kuda',
    title_en: 'Horse Rental',
    text: 'Wang terkumpul anda dikurangkan sebanyak RM60 kerana membayar kos sewaan kuda.',
    text_en: 'Your money is reduced by RM60 to pay horse rental costs.',
    effect: { score: -60 }
  }),
  makeRrgCard('hitam', 12, {
    title: 'Wang Dicuri',
    title_en: 'Stolen Money',
    text: 'Wang terkumpul anda telah dicuri sebanyak RM40.',
    text_en: 'RM40 of your accumulated money has been stolen.',
    effect: { score: -40 }
  }),
  makeRrgCard('hitam', 14, {
    title: 'Kos Rawatan',
    title_en: 'Medical Treatment',
    text: 'Anda tercedera. Wang terkumpul anda dikurangkan sebanyak RM65 untuk kos rawatan.',
    text_en: 'You got injured. Your money is reduced by RM65 for treatment costs.',
    effect: { score: -65 }
  }),
  makeRrgCard('hitam', 16, {
    title: 'Tertinggal Kunci',
    title_en: 'Keys Left Behind',
    text: 'Anda tertinggal kunci di rumah asap. Anda hilang satu giliran berikutnya.',
    text_en: 'You left your keys behind. You lose your next turn.',
    effect: { skipSelf: 1 }
  }),
  makeRrgCard('hitam', 18, {
    title: 'Beli Rumput Lembu',
    title_en: 'Buy Cattle Feed',
    text: 'Wang terkumpul anda dikurangkan sebanyak RM45 untuk membeli rumput.',
    text_en: 'Your money is reduced by RM45 to purchase cattle feed.',
    effect: { score: -45 }
  }),
  makeRrgCard('hitam', 20, {
    title: 'Wang Tercicir',
    title_en: 'Lost Money',
    text: 'Wang terkumpul anda telah tercicir sebanyak RM80.',
    text_en: 'You dropped and lost RM80 from your pocket.',
    effect: { score: -80 }
  }),
  makeRrgCard('hitam', 22, {
    title: 'Denda Pulau Idaman',
    title_en: 'Dream Island Fine',
    text: 'Anda melanggar peraturan Pulau Idaman. Wang dikurangkan RM70 untuk membayar denda.',
    text_en: 'You violated island regulations. Money reduced by RM70 to pay the fine.',
    effect: { score: -70 }
  }),
  makeRrgCard('hitam', 24, {
    title: 'Tertidur',
    title_en: 'Fell Asleep',
    text: 'Anda tertidur. Anda hilang dua giliran bermain yang seterusnya.',
    text_en: 'You overslept. You lose your next two turns.',
    effect: { skipSelf: 2 }
  }),
  makeRrgCard('hitam', 26, {
    title: 'Beli Air',
    title_en: 'Buy Water',
    text: 'Anda terhidrat. Wang terkumpul dikurangkan sebanyak RM10 untuk membeli air.',
    text_en: 'You are dehydrated. Money reduced by RM10 to buy bottled water.',
    effect: { score: -10 }
  }),
  makeRrgCard('hitam', 28, {
    title: 'Kembali Ke Mula',
    title_en: 'Return to Start',
    text: 'Anda tertinggal kad pengenalan di Bukit Kristal. Sila kembali ke tempat mula bermain.',
    text_en: 'You left your ID card at Crystal Hill. Return to the starting point.',
    effect: { resetStart: true }
  }),
  makeRrgCard('hitam', 30, {
    title: 'Sesat Jalan',
    title_en: 'Lost the Way',
    text: 'Anda sesat jalan kerana tersalah membaca peta. Anda hilang dua giliran bermain.',
    text_en: 'You got lost after misreading the map. You lose two turns.',
    effect: { skipSelf: 2 }
  }),
  makeRrgCard('hitam', 32, {
    title: 'Putaran 360°',
    title_en: '360° Rotation',
    text: 'Putarkan token anda 360° lawan arah jam pada titik (0, 0).',
    text_en: 'Rotate your token 360° anticlockwise about the point (0, 0).',
    effect: { rotate360: true }
  }),
  makeRrgCard('hitam', 34, {
    title: 'Sewa Kayak',
    title_en: 'Kayak Rental',
    text: 'Wang terkumpul anda dikurangkan sebanyak RM55 kerana membayar kos sewaan kayak.',
    text_en: 'Your money is reduced by RM55 to pay kayak rental fees.',
    effect: { score: -55 }
  }),
  makeRrgCard('hitam', 36, {
    title: 'Beli Makanan',
    title_en: 'Buy Food',
    text: 'Kurangkan RM60 daripada wang terkumpul anda untuk membeli pizza dan ayam goreng.',
    text_en: 'Deduct RM60 from your money to buy pizza and fried chicken.',
    effect: { score: -60 }
  }),
  makeRrgCard('hitam', 38, {
    title: 'Selenggara Lampu',
    title_en: 'Lantern Maintenance',
    text: 'Wang terkumpul anda dikurangkan sebanyak RM30 kerana membayar kos penyelenggaraan lampu.',
    text_en: 'Your money is reduced by RM30 for lantern maintenance fees.',
    effect: { score: -30 }
  }),
  makeRrgCard('hitam', 40, {
    title: 'Sakit Perut',
    title_en: 'Stomach Ache',
    text: 'Anda hilang satu giliran yang berikutnya kerana perlu ke tandas.',
    text_en: 'You lose your next turn because you need to rush to the restroom.',
    effect: { skipSelf: 1 }
  }),
];

const RRG_ITEMS = [
  // Beg Duit (Money Bags "RM" on physical board)
  { x: -3, y: 11, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: 9, y: 11, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: -2, y: 8, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: 5, y: 6, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: -7, y: 3, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: 7, y: 2, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: -4, y: -2, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: 7, y: -3, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: 12, y: -3, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: -13, y: -4, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: 12, y: -5, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: -4, y: -6, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: 6, y: -7, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: -7, y: -11, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: -2, y: -12, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: 7, y: -12, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },
  { x: 12, y: -12, kind: 'money', label: 'Beg Duit RM', label_en: 'Money Bag RM', amount: 50 },

  // Berlian (Diamonds on physical board)
  { x: -6, y: 5, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },
  { x: -1, y: 4, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },
  { x: 4, y: 4, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },
  { x: 11, y: 4, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },
  { x: 12, y: 10, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },
  { x: -1, y: -4, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },
  { x: 3, y: -4, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },
  { x: -7, y: -7, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },
  { x: 4, y: -7, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },
  { x: 10, y: -7, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },
  { x: 12, y: -9, kind: 'diamond', label: 'Berlian', label_en: 'Diamond', amount: 100 },

  // Peti Emas (Gold Chests on physical board)
  { x: -12, y: 11, kind: 'chest', label: 'Peti Emas', label_en: 'Gold Chest', amount: 200 },
  { x: 7, y: 8, kind: 'chest', label: 'Peti Emas', label_en: 'Gold Chest', amount: 200 },
  { x: -8, y: 6, kind: 'chest', label: 'Peti Emas', label_en: 'Gold Chest', amount: 200 },
  { x: 11, y: 6, kind: 'chest', label: 'Peti Emas', label_en: 'Gold Chest', amount: 200 },
  { x: -9, y: -2, kind: 'chest', label: 'Peti Emas', label_en: 'Gold Chest', amount: 200 },
  { x: 6, y: -1, kind: 'chest', label: 'Peti Emas', label_en: 'Gold Chest', amount: 200 },
  { x: -5, y: -4, kind: 'chest', label: 'Peti Emas', label_en: 'Gold Chest', amount: 200 },
  { x: 5, y: -7, kind: 'chest', label: 'Peti Emas', label_en: 'Gold Chest', amount: 200 },
  { x: -12, y: -8, kind: 'chest', label: 'Peti Emas', label_en: 'Gold Chest', amount: 200 },
  { x: 13, y: -8, kind: 'chest', label: 'Peti Emas', label_en: 'Gold Chest', amount: 200 },

  // Checkpoints / Titik Sasaran (Green circles with dark center on physical board)
  { x: 1, y: 6, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },
  { x: -6, y: 7, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },
  { x: 11, y: 9, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },
  { x: -10, y: 8, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },
  { x: -11, y: 4, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },
  { x: -10, y: -2, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },
  { x: 8, y: -2, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },
  { x: -4, y: -4, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },
  { x: 8, y: -8, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },
  { x: -10, y: -9, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },
  { x: 8, y: -12, kind: 'reward', label: 'Kad Ganjaran', label_en: 'Reward Card' },

  // Zon Bahaya Bukit Kristal (Volcano radiation perimeter)
  { x: -2, y: 2, kind: 'penalty', label: 'Zon Bahaya', label_en: 'Hazard Zone' },
  { x: 2, y: 2, kind: 'penalty', label: 'Zon Bahaya', label_en: 'Hazard Zone' },
  { x: -2, y: -2, kind: 'penalty', label: 'Zon Bahaya', label_en: 'Hazard Zone' },
  { x: 2, y: -2, kind: 'penalty', label: 'Zon Bahaya', label_en: 'Hazard Zone' },
];

const RRG_LANDMARKS = [
  { x: 0, y: 0, type: 'crystal', label: 'Bukit Kristal', label_en: 'Crystal Hill' },
  { x: -5, y: -6, type: 'waterfall', label: 'Air Terjun', label_en: 'Waterfall' },
  { x: 14, y: 7, type: 'lighthouse', label: 'Rumah Api', label_en: 'Lighthouse' },
  { x: 6, y: 3, type: 'factory', label: 'Kilang', label_en: 'Factory' },
  { x: 8, y: -4, type: 'clinic', label: 'Klinik', label_en: 'Clinic' },
  { x: 5, y: -7, type: 'village', label: 'Kampung', label_en: 'Village' },
  { x: 8, y: 10, type: 'harbor', label: 'Pelabuhan', label_en: 'Harbor' },
  { x: 6, y: 8, type: 'bridge', label: 'Jambatan', label_en: 'Bridge' },
  { x: -9, y: 8, type: 'ranch', label: 'Ladang Ternakan', label_en: 'Ranch' },
  { x: -8, y: 5, type: 'farm', label: 'Kebun', label_en: 'Farm' },
  { x: 10, y: 0, type: 'market', label: 'Pasar', label_en: 'Market' },
];

const RRG_COLORS = [
  { bg: '#ef4444', ring: '#fecaca', name: 'Merah' },
  { bg: '#2563eb', ring: '#bfdbfe', name: 'Biru' },
  { bg: '#16a34a', ring: '#bbf7d0', name: 'Hijau' },
  { bg: '#f59e0b', ring: '#fde68a', name: 'Kuning' },
  { bg: '#9333ea', ring: '#e9d5ff', name: 'Ungu' },
  { bg: '#0f766e', ring: '#99f6e4', name: 'Teal' },
];

const RRG_PLAYER_SHAPES = [
  { name: 'Rumah Pentagon', points: [[-0.56, 0.48], [0.56, 0.48], [0.56, -0.38], [0, -0.92], [-0.56, -0.38]] },
  { name: 'Menara Condong', points: [[-0.56, 0.56], [0.1, 0.56], [0.1, -0.08], [0.68, -0.58], [0.68, -0.88], [-0.56, -0.88]] },
  { name: 'Blok Takuk', points: [[-0.56, 0.56], [0.2, 0.56], [0.2, 0.08], [0.62, 0.08], [0.62, -0.56], [-0.56, -0.56]] },
  { name: 'Anak Panah', points: [[-0.56, 0.56], [0.18, 0.56], [0.18, 0.08], [0.72, 0.08], [0.44, -0.3], [0.18, -0.56], [-0.56, -0.56]] },
  { name: 'Menara Segitiga', points: [[-0.45, 0.62], [0.46, 0.62], [0.46, -0.18], [-0.45, -0.92]] },
  { name: 'Tangga L', points: [[-0.62, 0.52], [0.14, 0.52], [0.52, 0.15], [0.52, -0.28], [0.1, -0.58], [-0.62, -0.58]] },
];

const RRG_PLAYER_OFFSETS = [
  { x: -0.2, y: -0.16 },
  { x: 0, y: -0.2 },
  { x: 0.2, y: -0.16 },
  { x: -0.2, y: 0.16 },
  { x: 0, y: 0.2 },
  { x: 0.2, y: 0.16 },
];

const RRG_SHAPE_VERTICES = [
  {
    name: 'Rumah Pentagon',
    name_en: 'Pentagon House',
    labels: ['A', 'B', 'C', 'D', 'E'],
    relative: [
      { dx: 0, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 2 },
      { dx: 2, dy: 1 },
      { dx: 2, dy: 0 },
    ],
  },
  {
    name: 'Menara L',
    name_en: 'L-Tower',
    labels: ['A', 'B', 'C', 'D', 'E', 'F'],
    relative: [
      { dx: 0, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: 1, dy: 2 },
      { dx: 1, dy: 1 },
      { dx: 2, dy: 1 },
      { dx: 2, dy: 0 },
    ],
  },
  {
    name: 'Segitiga Tiga Bucu',
    name_en: 'Triangle',
    labels: ['A', 'B', 'C'],
    relative: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 2 },
      { dx: 2, dy: 0 },
    ],
  },
  {
    name: 'Trapezium Segi Empat',
    name_en: 'Trapezium',
    labels: ['A', 'B', 'C', 'D'],
    relative: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 1 },
      { dx: 2, dy: 1 },
      { dx: 3, dy: 0 },
    ],
  },
  {
    name: 'Segi Empat Selari',
    name_en: 'Parallelogram',
    labels: ['A', 'B', 'C', 'D'],
    relative: [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 2 },
      { dx: 3, dy: 2 },
      { dx: 2, dy: 0 },
    ],
  },
  {
    name: 'Anak Panah Poligon',
    name_en: 'Polygon Arrow',
    labels: ['A', 'B', 'C', 'D', 'E'],
    relative: [
      { dx: 0, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: 2, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: 0 },
    ],
  },
];

const getPlayerDisplayName = (player, lang = 'ms') => {
  if (!player) return '';
  const name = player.name || '';
  if (lang === 'en') {
    if (name.startsWith('Pemain ')) return name.replace('Pemain ', 'Player ');
  } else {
    if (name.startsWith('Player ')) return name.replace('Player ', 'Pemain ');
  }
  return name;
};

const getPlayerObjectPolygon = (player, index = 0, lang = 'ms') => {
  if (!player) return null;
  const shapeDef = RRG_SHAPE_VERTICES[index % RRG_SHAPE_VERTICES.length];
  const vertices = shapeDef.relative.map((rel, i) => ({
    label: shapeDef.labels[i],
    x: player.x + rel.dx,
    y: player.y + rel.dy,
  }));
  const name = lang === 'en' ? (shapeDef.name_en || shapeDef.name) : shapeDef.name;
  return { name, vertices };
};

const getTransformedPolygon = (polygon, card, lang = 'ms') => {
  if (!polygon || !card) return null;
  const transformedVertices = polygon.vertices.map((v) => {
    const raw = getRrgRawTransformPoint({ x: v.x, y: v.y }, card);
    return {
      label: `${v.label}'`,
      x: clampBoard(raw.x),
      y: clampBoard(raw.y),
    };
  });
  const suffix = lang === 'en' ? 'Image' : 'Imej';
  return { name: `${polygon.name} (${suffix})`, vertices: transformedVertices };
};

const HINT_COST = 30;
const WRONG_COST = 20;
const RRG_ACTION_ZONE_RADIUS = 2.25;
const RRG_GRID_MIN = -15;
const RRG_GRID_MAX = 15;
const clampBoard = (value) => Math.max(RRG_GRID_MIN, Math.min(RRG_GRID_MAX, Math.round(value)));
const randomFrom = (items) => items[Math.floor(Math.random() * items.length)];

const getRrgRawTransformPoint = (point, card) => {
  if (!card) return { x: point.x, y: point.y };
  if (card.type === 'translasi') return { x: point.x + card.dx, y: point.y + card.dy };
  if (card.type === 'pantulan') {
    if (card.axis === 'x') return { x: point.x, y: -point.y };
    if (card.axis === 'y') return { x: -point.x, y: point.y };
    if (card.axis === 'yx') return { x: point.y, y: point.x };
    if (card.axis === 'ynx') return { x: -point.y, y: -point.x };
    if (card.axis === 'xLine') return { x: (2 * card.value) - point.x, y: point.y };
    if (card.axis === 'yLine') return { x: point.x, y: (2 * card.value) - point.y };
  }
  if (card.type === 'putaran') {
    const quarterTurns = Math.round((card.angle || 0) / 90) % 4;
    const turns = card.dir === 'ccw' ? (4 - quarterTurns) % 4 : quarterTurns;
    let x = point.x - card.cx;
    let y = point.y - card.cy;
    for (let i = 0; i < turns; i++) [x, y] = [y, -x];
    return { x: x + card.cx, y: y + card.cy };
  }
  return { x: point.x, y: point.y };
};

const transformRrgPoint = (point, card) => {
  if (!card) return point;
  const raw = getRrgRawTransformPoint(point, card);
  return { x: clampBoard(raw.x), y: clampBoard(raw.y) };
};

const getRrgReflectionLineLabel = (card, lang = 'ms') => {
  if (lang === 'en') {
    return ({
      x: 'x-axis',
      y: 'y-axis',
      yx: 'line y = x',
      ynx: 'line y = -x',
      xLine: `line x = ${card?.value}`,
      yLine: `line y = ${card?.value}`,
    }[card?.axis] || 'reflection line');
  }
  return ({
    x: 'paksi-x',
    y: 'paksi-y',
    yx: 'garis y = x',
    ynx: 'garis y = -x',
    xLine: `garis x = ${card?.value}`,
    yLine: `garis y = ${card?.value}`,
  }[card?.axis] || 'garis pantulan');
};

const getRrgCardTitle = (card, lang = 'ms') => {
  if (!card) return '';
  if (lang === 'en') {
    if (card.title_en) return card.title_en;
    if (card.type === 'translasi') return `Translation (${card.dx}, ${card.dy})`;
    if (card.type === 'pantulan') return `Reflection ${getRrgReflectionLineLabel(card, 'en')}`;
    if (card.type === 'putaran') {
      const dir = card.dir === 'cw' ? 'clockwise' : 'anticlockwise';
      return `Rotation ${card.angle}° ${dir}`;
    }
  }
  return card.title || '';
};

const getRrgCardText = (card, lang = 'ms') => {
  if (!card) return '';
  if (lang === 'en') {
    if (card.text_en) return card.text_en;
    if (card.type === 'translasi') return `Translation by vector (${card.dx}, ${card.dy}).`;
    if (card.type === 'pantulan') {
      const axisName = getRrgReflectionLineLabel(card, 'en');
      if (card.axis === 'x' || card.axis === 'y') return `Reflection across the ${axisName}.`;
      return `Reflection in ${axisName}.`;
    }
    if (card.type === 'putaran') {
      const dir = card.dir === 'cw' ? 'clockwise' : 'anticlockwise';
      return `Rotation of ${card.angle}° ${dir} about point (${card.cx}, ${card.cy}).`;
    }
  }
  return card.text || '';
};

const getRrgReflectionGuideSegment = (card) => {
  if (!card || card.type !== 'pantulan') return null;
  if (card.axis === 'x') return { from: { x: RRG_GRID_MIN, y: 0 }, to: { x: RRG_GRID_MAX, y: 0 } };
  if (card.axis === 'y') return { from: { x: 0, y: RRG_GRID_MIN }, to: { x: 0, y: RRG_GRID_MAX } };
  if (card.axis === 'xLine') return { from: { x: card.value, y: RRG_GRID_MIN }, to: { x: card.value, y: RRG_GRID_MAX } };
  if (card.axis === 'yLine') return { from: { x: RRG_GRID_MIN, y: card.value }, to: { x: RRG_GRID_MAX, y: card.value } };
  if (card.axis === 'yx') return { from: { x: RRG_GRID_MIN, y: RRG_GRID_MIN }, to: { x: RRG_GRID_MAX, y: RRG_GRID_MAX } };
  if (card.axis === 'ynx') return { from: { x: RRG_GRID_MIN, y: RRG_GRID_MAX }, to: { x: RRG_GRID_MAX, y: RRG_GRID_MIN } };
  return null;
};

const getRrgReflectionFoot = (point, card) => {
  if (!card || card.type !== 'pantulan') return null;
  if (card.axis === 'x') return { x: point.x, y: 0 };
  if (card.axis === 'y') return { x: 0, y: point.y };
  if (card.axis === 'xLine') return { x: card.value, y: point.y };
  if (card.axis === 'yLine') return { x: point.x, y: card.value };
  if (card.axis === 'yx') {
    const value = (point.x + point.y) / 2;
    return { x: value, y: value };
  }
  if (card.axis === 'ynx') {
    const value = (point.x - point.y) / 2;
    return { x: value, y: -value };
  }
  return null;
};

const getRrgRotationSignedRadians = (card) => {
  if (!card || card.type !== 'putaran') return 0;
  const degrees = card.dir === 'cw' ? -(card.angle || 0) : (card.angle || 0);
  return (degrees * Math.PI) / 180;
};

const getRrgPositiveRadians = (radians) => ((radians % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

const getRrgGuessSignedRadians = (from, destination, card) => {
  if (!card || card.type !== 'putaran') return 0;
  const startAngle = Math.atan2(from.y - card.cy, from.x - card.cx);
  const endAngle = Math.atan2(destination.y - card.cy, destination.x - card.cx);
  return card.dir === 'cw'
    ? -getRrgPositiveRadians(startAngle - endAngle)
    : getRrgPositiveRadians(endAngle - startAngle);
};

const getRrgMovementMessage = (player, card, destination, lang = 'ms') => {
  const pName = getPlayerDisplayName(player, lang);
  if (lang === 'en') {
    if (!card) return `${pName} moves to (${destination.x}, ${destination.y})...`;
    if (card.type === 'translasi') {
      return `${pName} moves by vector (${card.dx}, ${card.dy}) to (${destination.x}, ${destination.y})...`;
    }
    if (card.type === 'pantulan') {
      return `${pName} reflects across ${getRrgReflectionLineLabel(card, 'en')} to (${destination.x}, ${destination.y})...`;
    }
    const dir = card.dir === 'cw' ? 'clockwise' : 'anticlockwise';
    return `${pName} rotates ${card.angle}° ${dir} about (${card.cx}, ${card.cy}) to (${destination.x}, ${destination.y})...`;
  }
  if (!card) return `${pName} bergerak ke (${destination.x}, ${destination.y})...`;
  if (card.type === 'translasi') {
    return `${pName} bergerak ikut vektor (${card.dx}, ${card.dy}) ke (${destination.x}, ${destination.y})...`;
  }
  if (card.type === 'pantulan') {
    return `${pName} dipantulkan pada ${getRrgReflectionLineLabel(card)} ke (${destination.x}, ${destination.y})...`;
  }
  const dir = card.dir === 'cw' ? 'ikut jam' : 'lawan jam';
  return `${pName} berputar ${card.angle}° ${dir} pada (${card.cx}, ${card.cy}) ke (${destination.x}, ${destination.y})...`;
};

const isRrgActionZoneItem = (item) => item.kind === 'reward' || item.kind === 'penalty';
const getRrgItemRadius = (item) => isRrgActionZoneItem(item) ? (item.radius ?? RRG_ACTION_ZONE_RADIUS) : 0;
const getRrgItemAt = (point) => {
  const exactItem = RRG_ITEMS.find(item => item.x === point.x && item.y === point.y);
  if (exactItem) return exactItem;
  return RRG_ITEMS
    .filter(isRrgActionZoneItem)
    .map(item => ({ item, distance: Math.hypot(point.x - item.x, point.y - item.y) }))
    .filter(({ item, distance }) => distance <= getRrgItemRadius(item))
    .sort((a, b) => a.distance - b.distance)[0]?.item || null;
};
const isRrgSafeZone = (point) => Math.abs(point.x) >= 14 || Math.abs(point.y) >= 14;

const playRrgSound = (kind) => {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  if (kind === 'coin') {
    [880, 1175, 1568].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.07);
      osc.connect(gain);
      osc.start(ctx.currentTime + index * 0.07);
      osc.stop(ctx.currentTime + index * 0.07 + 0.12);
    });
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42);
  } else if (kind === 'boom') {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.55);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.58);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.58);
  } else if (kind === 'click') {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.04);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
  } else {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(kind === 'correct' ? 740 : 180, ctx.currentTime);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
  }
};

const getRrgHint = (player, card, level, lang = 'ms') => {
  if (!card) return '';
  if (lang === 'en') {
    if (card.type === 'translasi') {
      return level === 1
        ? `Add ${card.dx} to x and ${card.dy} to y. Calculate from (${player.x}, ${player.y}).`
        : `The final x coordinate is ${clampBoard(player.x + card.dx)}. Find y on your own.`;
    }
    if (card.type === 'pantulan') {
      const axisText = {
        x: 'x-axis: x stays the same, y sign changes',
        y: 'y-axis: y stays the same, x sign changes',
        yx: 'line y = x: x and y swap places',
        ynx: 'line y = -x: swap x and y, then flip both signs',
        xLine: `line x = ${card.value}: distance left/right from the line must be equal`,
        yLine: `line y = ${card.value}: distance above/below the line must be equal`,
      }[card.axis];
      return level === 1 ? `Use ${axisText}.` : `One final coordinate is x = ${transformRrgPoint(player, card).x}. Find y on your own.`;
    }
    const dir = card.dir === 'cw' ? 'clockwise' : 'anticlockwise';
    return level === 1
      ? `Shift point so centre of rotation (${card.cx}, ${card.cy}) is reference, rotate ${card.angle}° ${dir}, then shift back.`
      : `After rotation, the final x is ${transformRrgPoint(player, card).x}. Find y on your own.`;
  }
  if (card.type === 'translasi') {
    return level === 1
      ? `Tambah x dengan ${card.dx} dan tambah y dengan ${card.dy}. Kira dari (${player.x}, ${player.y}).`
      : `Koordinat x akhir ialah ${clampBoard(player.x + card.dx)}. Cari y sendiri.`;
  }
  if (card.type === 'pantulan') {
    const axisText = {
      x: 'paksi-x: x kekal, tanda y bertukar',
      y: 'paksi-y: y kekal, tanda x bertukar',
      yx: 'garis y = x: x dan y bertukar tempat',
      ynx: 'garis y = -x: tukar tempat x dan y, kemudian tukar tanda kedua-duanya',
      xLine: `garis x = ${card.value}: jarak kiri/kanan daripada garis mesti sama`,
      yLine: `garis y = ${card.value}: jarak atas/bawah daripada garis mesti sama`,
    }[card.axis];
    return level === 1 ? `Gunakan ${axisText}.` : `Satu koordinat akhir ialah ${transformRrgPoint(player, card).x} untuk x. Cari y sendiri.`;
  }
  const dir = card.dir === 'cw' ? 'ikut jam' : 'lawan jam';
  return level === 1
    ? `Alih titik supaya pusat putaran (${card.cx}, ${card.cy}) menjadi rujukan, putar ${card.angle} darjah ${dir}, kemudian alih semula.`
    : `Selepas putaran, x akhir ialah ${transformRrgPoint(player, card).x}. Cari y sendiri.`;
};

const SectionRRGs = () => {
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState(() => Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    name: `Pemain ${i + 1}`,
    x: 0,
    y: 0,
    score: 100,
    skipTurns: 0,
    extraTurns: 0,
    finished: false,
    finishOrder: null,
  })));
  const [current, setCurrent] = useState(0);
  const [card, setCard] = useState(null);
  const [dice, setDice] = useState(null);
  const [message, setMessage] = useState('Lambung dadu untuk mengambil Kad Transformasi.');
  const [history, setHistory] = useState(['Misi bermula di Bukit Kristal. Semua pemain menerima RM100.']);
  const [finishCount, setFinishCount] = useState(0);
  const [answerInput, setAnswerInput] = useState({ x: '', y: '' });
  const [hintLevel, setHintLevel] = useState(0);
  const [effects, setEffects] = useState([]);

  const activePlayer = players[current];
  const chosenPoint = answerInput.x !== '' && answerInput.y !== ''
    ? { x: clampBoard(Number(answerInput.x)), y: clampBoard(Number(answerInput.y)) }
    : null;

  const addEffect = (type, point) => {
    const effect = { id: `${Date.now()}-${Math.random()}`, type, x: point.x, y: point.y };
    setEffects(prev => [...prev, effect]);
    window.setTimeout(() => setEffects(prev => prev.filter(item => item.id !== effect.id)), 950);
  };

  const resetGame = (count = playerCount) => {
    setPlayerCount(count);
    setPlayers(Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Pemain ${i + 1}`,
      x: 0,
      y: 0,
      score: 100,
      finished: false,
      finishOrder: null,
    })));
    setCurrent(0);
    setCard(null);
    setDice(null);
    setFinishCount(0);
    setAnswerInput({ x: '', y: '' });
    setHintLevel(0);
    setEffects([]);
    setMessage('Lambung dadu untuk mengambil Kad Transformasi.');
    setHistory(['Misi bermula di Bukit Kristal. Semua pemain menerima RM100.']);
  };

  const nextActiveIndex = (fromIndex, list = players) => {
    for (let step = 1; step <= list.length; step++) {
      const next = (fromIndex + step) % list.length;
      if (!list[next].finished) return next;
    }
    return fromIndex;
  };

  const rollDice = () => {
    if (!activePlayer || activePlayer.finished) return;
    const rolled = randomFrom([
      { key: 'red', label: 'Merah', cardName: 'Kad Translasi' },
      { key: 'green', label: 'Hijau', cardName: 'Kad Pantulan' },
      { key: 'blue', label: 'Biru', cardName: 'Kad Putaran' },
    ]);
    const nextCard = randomFrom(RRG_TRANSFORM_CARDS[rolled.key]);
    setDice(rolled);
    setCard(nextCard);
    setHintLevel(0);
    setAnswerInput({ x: '', y: '' });
    setMessage(`${activePlayer.name} mendapat warna ${rolled.label}. Pilih koordinat destinasi token.`);
  };

  const buyHint = () => {
    if (!card || !activePlayer || activePlayer.score < HINT_COST) return;
    const nextHintLevel = Math.min(2, hintLevel + 1);
    setHintLevel(nextHintLevel);
    setPlayers(prev => prev.map((player, index) => index === current ? { ...player, score: player.score - HINT_COST } : player));
    setHistory(prev => [`${activePlayer.name} membeli hint (-RM${HINT_COST}).`, ...prev].slice(0, 8));
    setMessage(getRrgHint(activePlayer, card, nextHintLevel));
    playRrgSound('correct');
  };

  const endTurn = (log, updated = players) => {
    setHistory(prev => [log, ...prev].slice(0, 8));
    setCard(null);
    setDice(null);
    setAnswerInput({ x: '', y: '' });
    setHintLevel(0);
    setCurrent(nextActiveIndex(current, updated));
  };

  const resolveCorrectMove = (destination) => {
    const item = getRrgItemAt(destination);
    let log = `${activePlayer.name}: (${activePlayer.x}, ${activePlayer.y}) -> (${destination.x}, ${destination.y}) melalui jawapan sendiri.`;
    let scoreDelta = 0;
    let cardNote = '';
    let effectType = 'correct';

    if (item?.kind === 'money' || item?.kind === 'diamond' || item?.kind === 'chest') {
      scoreDelta += item.amount;
      cardNote = `${item.label}: +RM${item.amount}`;
      effectType = 'coin';
    }
    if (item?.kind === 'reward') {
      const reward = randomFrom(RRG_REWARD_CARDS);
      scoreDelta += reward.amount;
      cardNote = `${reward.title}: ${reward.text}`;
      effectType = 'coin';
    }
    if (item?.kind === 'penalty') {
      const penalty = randomFrom(RRG_PENALTY_CARDS);
      scoreDelta += penalty.amount;
      cardNote = `${penalty.title}: ${penalty.text}`;
      effectType = 'boom';
    }

    let nextFinishCount = finishCount;
    const updated = players.map((player, index) => {
      if (index !== current) return player;
      const reachedSafe = isRrgSafeZone(destination);
      let bonus = 0;
      let finishOrder = player.finishOrder;
      if (reachedSafe && !player.finished) {
        nextFinishCount += 1;
        finishOrder = nextFinishCount;
        bonus = finishOrder === 1 ? 1000 : finishOrder === 2 ? 700 : finishOrder === 3 ? 400 : 0;
      }
      if (bonus) log += ` Bonus Zon Selamat: +RM${bonus}.`;
      return {
        ...player,
        x: destination.x,
        y: destination.y,
        score: player.score + scoreDelta + bonus,
        finished: reachedSafe || player.finished,
        finishOrder,
      };
    });

    if (cardNote) log += ` ${cardNote}.`;
    setPlayers(updated);
    setFinishCount(nextFinishCount);
    setMessage(cardNote || 'Jawapan betul. Tiada gambar khas pada grid ini.');
    addEffect(effectType, destination);
    playRrgSound(effectType);
    endTurn(log, updated);
  };

  const submitAnswer = () => {
    if (!card || !activePlayer || activePlayer.finished || !chosenPoint) return;
    const correct = transformRrgPoint(activePlayer, card);
    const isCorrect = chosenPoint.x === correct.x && chosenPoint.y === correct.y;
    if (!isCorrect) {
      const updated = players.map((player, index) => index === current ? { ...player, score: player.score - WRONG_COST } : player);
      setPlayers(updated);
      setMessage(`Jawapan belum tepat. ${activePlayer.name} kehilangan RM${WRONG_COST} dan giliran tamat.`);
      playRrgSound('wrong');
      endTurn(`${activePlayer.name} memilih (${chosenPoint.x}, ${chosenPoint.y}) tetapi jawapan tidak tepat. Denda RM${WRONG_COST}.`, updated);
      return;
    }
    resolveCorrectMove(correct);
  };

  const handleBoardClick = (event) => {
    if (!card || gameOver) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 32 - 16;
    const y = 16 - ((event.clientY - rect.top) / rect.height) * 32;
    setAnswerInput({ x: String(clampBoard(x)), y: String(clampBoard(y)) });
  };

  const leaderBoard = [...players].sort((a, b) => b.score - a.score);
  const gameOver = players.filter(p => p.finished).length >= Math.min(3, players.length);

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-blue-600 tracking-wide uppercase">Running Rangers Game: Super</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">Misi Keluar dari Bukit Kristal</h2>
            <p className="text-slate-600 mt-2 max-w-3xl">Pemain mesti kira sendiri koordinat destinasi. Klik grid atau taip jawapan, gunakan hint berbayar jika perlu, kemudian semak.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[2, 3, 4, 5, 6].map(count => (
              <button key={count} onClick={() => resetGame(count)} className={`px-3 py-2 rounded-lg text-sm font-bold border ${playerCount === count ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>{count} pemain</button>
            ))}
            <button onClick={() => resetGame()} className="px-3 py-2 rounded-lg text-sm font-bold bg-slate-900 text-white flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Reset</button>
          </div>
        </div>
      </section>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative bg-cyan-100 overflow-auto">
            <svg onClick={handleBoardClick} viewBox="-16 -16 32 32" className={`w-full min-w-[760px] block ${card ? 'cursor-crosshair' : ''}`} role="img" aria-label="Papan permainan RRGs berdasarkan fail PDF">
              <defs>
                <linearGradient id="rrgWave" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.16" />
                  <stop offset="55%" stopColor="#0ea5e9" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.12" />
                </linearGradient>
              </defs>
              <image href="/rrgs-board.png" x="-16" y="-16" width="32" height="32" preserveAspectRatio="none" />
              <g className="rrg-water-layer" pointerEvents="none">
                <path d="M -16 -16 H 16 V -13 C 9 -14 5 -13 -1 -14 C -8 -15 -12 -14 -16 -13 Z" fill="url(#rrgWave)" />
                <path d="M -16 12 C -11 13 -9 14 -4 13 C 2 12 5 13 10 12 C 13 11 15 12 16 13 V 16 H -16 Z" fill="url(#rrgWave)" />
                <path d="M -16 -16 V 16 H -13 C -14 9 -13 2 -14 -3 C -15 -9 -14 -13 -13 -16 Z" fill="url(#rrgWave)" />
                <path d="M 13 -16 C 14 -10 13 -5 14 0 C 15 6 14 10 13 16 H 16 V -16 Z" fill="url(#rrgWave)" />
              </g>
              <rect x="-3" y="-3" width="6" height="6" fill="rgba(239,68,68,0.22)" stroke="rgba(185,28,28,0.7)" strokeWidth="0.08" rx="0.2" pointerEvents="none" />
              <text x="0" y="0.45" textAnchor="middle" fontSize="0.72" fontWeight="800" fill="#111827" pointerEvents="none">START</text>
              {chosenPoint && (
                <g pointerEvents="none">
                  <circle cx={chosenPoint.x} cy={-chosenPoint.y} r="0.45" fill="rgba(255,255,255,0.82)" stroke="#0f172a" strokeWidth="0.09" strokeDasharray="0.12 0.1" />
                  <text x={chosenPoint.x} y={-chosenPoint.y - 0.62} textAnchor="middle" fontSize="0.42" fontWeight="800" fill="#0f172a">pilihan</text>
                </g>
              )}
              {effects.map(effect => effect.type === 'boom' ? (
                <g key={effect.id} className="rrg-explosion" transform={`translate(${effect.x} ${-effect.y})`} pointerEvents="none">
                  <circle r="0.25" fill="#f97316" />
                  <circle r="0.62" fill="none" stroke="#facc15" strokeWidth="0.12" />
                  <path d="M0,-1.05 L0.22,-0.38 L0.9,-0.72 L0.45,-0.1 L1.1,0.15 L0.36,0.26 L0.62,0.95 L0,0.48 L-0.62,0.95 L-0.36,0.26 L-1.1,0.15 L-0.45,-0.1 L-0.9,-0.72 L-0.22,-0.38 Z" fill="#ef4444" opacity="0.86" />
                </g>
              ) : (
                <g key={effect.id} className="rrg-coin-pop" transform={`translate(${effect.x} ${-effect.y})`} pointerEvents="none">
                  <circle r="0.55" fill="#facc15" stroke="#a16207" strokeWidth="0.08" />
                  <text y="0.15" textAnchor="middle" fontSize="0.46" fontWeight="900" fill="#78350f">RM</text>
                </g>
              ))}
              {players.map((player, index) => {
                const color = RRG_COLORS[index % RRG_COLORS.length];
                const poly = getPlayerObjectPolygon(player, index);
                if (!poly) return null;
                const pointsString = poly.vertices.map(v => `${v.x},${-v.y}`).join(' ');
                return (
                  <g key={player.id} className="rrg-token" pointerEvents="none">
                    <polygon points={pointsString} fill={color.bg} fillOpacity="0.4" stroke={color.bg} strokeWidth="0.12" />
                    {poly.vertices.map(v => (
                      <g key={v.label}>
                        <circle cx={v.x} cy={-v.y} r="0.22" fill={color.bg} stroke="white" strokeWidth="0.06" />
                        <text x={v.x} y={-v.y - 0.28} textAnchor="middle" fontSize="0.32" fontWeight="900" fill="#0f172a">{v.label}</text>
                      </g>
                    ))}
                  </g>
                );
              })}
              {(() => {
                const activePoly = getPlayerObjectPolygon(activePlayer, current);
                const targetPoly = getTransformedPolygon(activePoly, card);
                if (!targetPoly) return null;
                const targetPointsString = targetPoly.vertices.map(v => `${v.x},${-v.y}`).join(' ');
                return (
                  <g pointerEvents="none">
                    <polygon points={targetPointsString} fill="rgba(37,99,235,0.18)" stroke="#2563eb" strokeWidth="0.1" strokeDasharray="0.15 0.1" />
                    {targetPoly.vertices.map(v => (
                      <g key={v.label}>
                        <circle cx={v.x} cy={-v.y} r="0.2" fill="#2563eb" stroke="white" strokeWidth="0.05" />
                        <text x={v.x} y={-v.y - 0.28} textAnchor="middle" fontSize="0.3" fontWeight="900" fill="#1d4ed8">{v.label}</text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Giliran Semasa</p>
                <h3 className="text-xl font-extrabold text-slate-900">{activePlayer?.name}</h3>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-black text-lg" style={{ background: RRG_COLORS[current]?.bg }}>{activePlayer?.id}</div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Kedudukan: <b>({activePlayer?.x}, {activePlayer?.y})</b> | Wang: <b>RM{activePlayer?.score}</b></p>
            
            {(() => {
              const activePoly = getPlayerObjectPolygon(activePlayer, current);
              const targetPoly = getTransformedPolygon(activePoly, card);
              if (!activePoly) return null;
              return (
                <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                  <p className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">Bentuk 2D & Koordinat Bucu (Silibus Tkt 2)</p>
                  <p className="text-xs font-bold text-blue-700 mt-1">Bentuk Objek: <b>{activePoly.name}</b></p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {activePoly.vertices.map(v => (
                      <span key={v.label} className="px-2 py-1 rounded bg-white text-blue-900 text-xs font-mono font-bold border border-blue-100 shadow-sm">
                        {v.label}({v.x}, {v.y})
                      </span>
                    ))}
                  </div>

                  {targetPoly && (
                    <div className="mt-3 pt-3 border-t border-blue-200/80">
                      <p className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">Pemetaan Bucu Imej Hasil Transformasi:</p>
                      <div className="space-y-1 mt-2">
                        {activePoly.vertices.map((v, i) => {
                          const tv = targetPoly.vertices[i];
                          return (
                            <div key={v.label} className="flex items-center justify-between text-xs font-mono font-bold bg-white/90 px-2 py-1 rounded border border-blue-100">
                              <span className="text-slate-700">{v.label}({v.x}, {v.y})</span>
                              <span className="text-blue-600 font-sans">➔</span>
                              <span className="text-blue-800">{tv.label}({tv.x}, {tv.y})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 min-h-[130px]">
              <p className="text-sm font-bold text-slate-800">{dice ? `Dadu: ${dice.label}` : 'Dadu belum dilambung'}</p>
              <p className="mt-2 text-sm text-slate-600">{card ? `${card.title}: ${card.text}` : message}</p>
              {hintLevel > 0 && <p className="mt-2 text-sm font-bold text-blue-700">Hint {hintLevel}: {getRrgHint(activePlayer, card, hintLevel)}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <label className="text-xs font-bold text-slate-500 uppercase">Jawapan x
                <input type="number" min="-15" max="15" value={answerInput.x} onChange={e => setAnswerInput(prev => ({ ...prev, x: e.target.value }))} className="mt-1 w-full p-3 rounded-lg border border-slate-200 text-center text-lg font-black" />
              </label>
              <label className="text-xs font-bold text-slate-500 uppercase">Jawapan y
                <input type="number" min="-15" max="15" value={answerInput.y} onChange={e => setAnswerInput(prev => ({ ...prev, y: e.target.value }))} className="mt-1 w-full p-3 rounded-lg border border-slate-200 text-center text-lg font-black" />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <button onClick={rollDice} disabled={!!card || activePlayer?.finished || gameOver} className="py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold flex items-center justify-center gap-2"><PlayCircle className="w-5 h-5"/> Dadu</button>
              <button onClick={buyHint} disabled={!card || hintLevel >= 2 || activePlayer?.score < HINT_COST || gameOver} className="py-3 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold">Hint RM{HINT_COST}</button>
              <button onClick={submitAnswer} disabled={!card || !chosenPoint || gameOver} className="py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold">Semak</button>
            </div>
            <p className="mt-3 text-xs text-slate-500">Tip: klik terus pada board untuk mengisi koordinat pilihan pemain.</p>
            {gameOver && <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold flex gap-2"><AlertCircle className="w-5 h-5 shrink-0"/> Tiga pemain telah tiba di Zon Selamat. Pemenang ikut jumlah wang tertinggi.</div>}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-extrabold text-slate-900 mb-3 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500"/> Skor Pemain</h3>
            <div className="space-y-2">
              {leaderBoard.map((player) => (
                <div key={player.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg text-white text-sm font-black flex items-center justify-center" style={{ background: RRG_COLORS[player.id - 1].bg }}>{player.id}</span>
                    <span className="font-bold text-slate-800">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">RM{player.score}</p>
                    {player.finished && <p className="text-xs text-emerald-700 font-bold">Selamat #{player.finishOrder}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-extrabold text-slate-900 mb-3">Log Permainan</h3>
            <div className="space-y-2 max-h-56 overflow-auto pr-1">
              {history.map((entry, index) => <p key={index} className="text-sm text-slate-600 border-b border-slate-100 pb-2 last:border-b-0">{entry}</p>)}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const RRGCardVisual = ({ card, lang = 'ms', className = '', isThumbnail = false, onClick }) => {
  if (!card || typeof card !== 'object') return null;
  const isEn = lang === 'en';
  const title = getRrgCardTitle(card, lang);
  const cardImgSrc = card.cardImage || (card.deck && card.page ? RRG_CARD_IMAGE(card.deck, card.page) : '');

  if (!isEn) {
    if (!cardImgSrc) return null;
    return (
      <img
        className={className}
        src={cardImgSrc}
        alt={title}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      className={`rrg-card-visual ${isThumbnail ? 'rrg-card-visual-thumb' : ''} ${className}`}
      title={title}
      onClick={onClick}
    >
      {cardImgSrc && (
        <img
          src={cardImgSrc}
          alt={title}
          className="rrg-card-visual-bg"
        />
      )}
      <div className="rrg-card-visual-overlay">
        {card.type === 'translasi' && (
          <div className="rrg-card-content">
            <span className="rrg-card-type-label text-red-600 font-black">Translation</span>
            <div className="rrg-card-vector">
              <span className="rrg-vector-paren">(</span>
              <div className="rrg-vector-vals text-red-700 font-bold">
                <span>{card.dx > 0 ? `+${card.dx}` : card.dx}</span>
                <span>{card.dy > 0 ? `+${card.dy}` : card.dy}</span>
              </div>
              <span className="rrg-vector-paren">)</span>
            </div>
          </div>
        )}

        {card.type === 'pantulan' && (
          <div className="rrg-card-content">
            <span className="rrg-card-type-label text-green-700 font-black">Reflection</span>
            <span className="rrg-card-sublabel text-slate-500 italic">across</span>
            <span className="rrg-card-highlight text-slate-900 font-mono font-bold">
              {getRrgReflectionLineLabel(card, 'en')}
            </span>
          </div>
        )}

        {card.type === 'putaran' && (
          <div className="rrg-card-content">
            <span className="rrg-card-type-label text-blue-600 font-black">
              Rotation {card.angle}°
            </span>
            <span className="rrg-card-sublabel text-slate-800 font-bold">
              {card.dir === 'cw' ? 'clockwise' : 'anticlockwise'}
            </span>
            <span className="rrg-card-highlight text-slate-600 font-mono text-[9px] sm:text-[10px]">
              about point ({card.cx}, {card.cy})
            </span>
          </div>
        )}

        {card.deck === 'kuning' && (
          <div className="rrg-card-content">
            <span className="rrg-card-type-label text-amber-600 font-black">
              ⭐ {card.title_en || 'Reward'}
            </span>
            <p className="rrg-card-desc text-slate-800 font-semibold">
              {card.text_en || card.text}
            </p>
          </div>
        )}

        {card.deck === 'hitam' && (
          <div className="rrg-card-content">
            <span className="rrg-card-type-label text-slate-900 font-black">
              ⚠️ {card.title_en || 'Penalty'}
            </span>
            <p className="rrg-card-desc text-slate-800 font-semibold">
              {card.text_en || card.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

class RRGErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("RRGErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      const isEn = this.props.lang === 'en';
      return (
        <div className="p-8 text-center bg-white rounded-2xl shadow-xl border border-red-200 max-w-lg mx-auto my-12">
          <div className="text-4xl mb-3">🏝️⚠️</div>
          <h2 className="text-xl font-black text-slate-800 mb-2">
            {isEn ? 'Game Encountered an Issue' : 'Ralat Permainan Dikesan'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {isEn
              ? 'An unexpected error occurred while loading the game canvas. You can reset current game data to resume playing.'
              : 'Terdapat ralat semasa memuatkan kanvas permainan. Anda boleh menetapkan semula sesi permainan untuk bermain seperti biasa.'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                try {
                  const saveKey = `rrg_save_${this.props.sessionUser?.uid || 'guest'}`;
                  localStorage.removeItem(saveKey);
                  localStorage.removeItem('rrg_save');
                } catch (_) {}
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow transition text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {isEn ? 'Reset & Reload Game' : 'Set Semula & Muat Semula Permainan'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const RRGCanvasGame = ({ lang = 'ms', sessionUser }) => {
  const [resetTrigger, setResetTrigger] = useState(0);
  const [zoomedCard, setZoomedCard] = useState(null);
  const canvasRef = useRef(null);
  const miniMapRef = useRef(null);
  const gameRef = useRef(null);
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const [playerCount, setPlayerCount] = useState(6);
  const [hud, setHud] = useState({
    currentPlayer: 0,
    players: [],
    dice: null,
    card: null,
    selected: null,
    hintLevel: 0,
    message: lang === 'en' ? 'Roll color dice to draw Transformation Card.' : 'Roll dadu warna untuk ambil Kad Transformasi.',
    popup: null,
    drawCard: null,
    lastActionCard: null,
    solutionPreview: null,
    gameOver: false,
  });

  const makePlayers = useCallback((count = playerCount) => Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: lang === 'en' ? `Player ${index + 1}` : `Pemain ${index + 1}`,
    x: 0,
    y: 0,
    drawX: 0,
    drawY: 0,
    score: 100,
    skipTurns: 0,
    extraTurns: 0,
    finished: false,
    finishOrder: null,
    color: RRG_COLORS[index].bg,
    ring: RRG_COLORS[index].ring,
    trail: [],
    motion: null,
    motionLift: 0,
    motionTilt: 0,
    motionStretch: 0,
    motionTransformRotation: 0,
    landingPulseAt: 0,
  })), [playerCount, lang]);

  const syncHud = useCallback((game, popup = game?.popup || null) => {
    if (!game) return;
    setHud({
      currentPlayer: game.currentPlayer,
      players: (game.players || []).map((player) => ({ ...player })),
      dice: game.dice,
      card: game.card,
      selected: game.selected,
      hintLevel: game.hintLevel,
      message: game.message,
      popup,
      drawCard: game.drawCard,
      lastActionCard: game.lastActionCard,
      solutionPreview: game.solutionPreview,
      gameOver: game.gameOver,
      animating: !!game.animating,
      diceRolling: !!game.diceRolling,
    });

    // Auto-Save Logic
    const saveKey = `rrg_save_${sessionUser?.uid || 'guest'}`;
    if (game.gameOver) {
      localStorage.removeItem(saveKey);
    } else if (!game.animating && !game.diceRolling) {
      try {
        const saveData = {
          currentPlayer: game.currentPlayer,
          players: (game.players || []).map(p => ({
            id: p.id, name: p.name, x: p.x, y: p.y, score: p.score, skipTurns: p.skipTurns, extraTurns: p.extraTurns, finished: p.finished, finishOrder: p.finishOrder, color: p.color, ring: p.ring
          })),
          dice: game.dice,
          card: game.card,
          selected: game.selected,
          hintLevel: game.hintLevel,
          finishCount: game.finishCount,
          message: game.message,
          drawCard: game.drawCard,
          lastActionCard: game.lastActionCard,
          solutionPreview: game.solutionPreview
        };
        localStorage.setItem(saveKey, JSON.stringify(saveData));
      } catch (e) {
        console.warn("Failed to auto-save game", e);
      }
    }
  }, [sessionUser?.uid]);

  // Synchronize language changes with in-progress game state
  useEffect(() => {
    const game = gameRef.current;
    if (!game || !game.players || !game.players.length) return;

    // Update players
    game.players.forEach((p, idx) => {
      p.name = lang === 'en' ? `Player ${idx + 1}` : `Pemain ${idx + 1}`;
    });

    if (game.card) {
      const p = game.players[game.currentPlayer] || game.players[0];
      const pName = getPlayerDisplayName(p, lang);
      const dLabel = lang === 'en' ? (game.dice?.label_en || game.dice?.label) : game.dice?.label;
      const cTitle = getRrgCardTitle(game.card, lang);
      game.message = lang === 'en'
        ? `${pName} got ${dLabel}: ${cTitle}. Click destination coordinate on grid.`
        : `${pName} mendapat ${game.dice?.label || ''}: ${cTitle}. Klik koordinat destinasi pada grid.`;
    } else if (!game.gameOver) {
      if (!game.message || game.message.includes('Bukit Kristal') || game.message.includes('Crystal Hill') || game.message.includes('Roll dadu') || game.message.includes('Roll color') || game.message.includes('Misi bermula') || game.message.includes('Mission begins')) {
        game.message = lang === 'en'
          ? 'Roll color dice to draw Transformation Card.'
          : 'Roll dadu warna untuk ambil Kad Transformasi.';
      }
    }

    syncHud(game);
  }, [lang, syncHud]);

  // Save game record when game is over
  useEffect(() => {
    if (hud.gameOver && sessionUser && sessionUser.role !== 'admin') {
      // Find winner (highest score)
      const sortedPlayers = [...hud.players].sort((a, b) => b.score - a.score);
      const winner = sortedPlayers[0];
      if (winner) {
        saveGameRecord(sessionUser, getPlayerDisplayName(winner, lang), winner.score, hud.players.length);
      }
    }
  }, [hud.gameOver, sessionUser, hud.players, lang]);

  const nextActiveIndex = (game, fromIndex) => {
    for (let step = 1; step <= game.players.length * 2; step++) {
      const next = (fromIndex + step) % game.players.length;
      const candidate = game.players[next];
      if (candidate.finished) continue;
      if (candidate.skipTurns > 0) {
        candidate.skipTurns -= 1;
        const cName = getPlayerDisplayName(candidate, lang);
        game.message = lang === 'en'
          ? `${cName} is frozen/skips turn. Remaining skips: ${candidate.skipTurns}.`
          : `${cName} dibekukan/terlepas giliran. Baki skip: ${candidate.skipTurns}.`;
        continue;
      }
      return next;
    }
    return fromIndex;
  };

  const showPopup = useCallback((emoji, title, text) => {
    const game = gameRef.current;
    if (!game) return;
    window.clearTimeout(game.popupTimer);
    game.popup = { emoji, title, text };
    syncHud(game, game.popup);
    game.popupTimer = window.setTimeout(() => {
      game.popup = null;
      syncHud(game, null);
    }, 1700);
  }, [syncHud]);

  const showCardDraw = useCallback((deckKey, card) => {
    const game = gameRef.current;
    if (!game || !card) return;
    window.clearTimeout(game.drawCardTimer);
    game.drawCard = { deckKey, card, token: `${deckKey}-${card.page}-${Date.now()}` };
    syncHud(game);
    game.drawCardTimer = window.setTimeout(() => {
      game.drawCard = null;
      syncHud(game);
    }, 1650);
  }, [syncHud]);

  const centerOnPlayer = (game, player, instant = false) => {
    const pos = game.gridToPixel(player.x, player.y);
    game.camTargetX = pos.px;
    game.camTargetY = pos.py;
    if (instant || !Number.isFinite(game.camX) || !Number.isFinite(game.camY)) {
      game.camX = pos.px;
      game.camY = pos.py;
    }
  };

  const centerOnPoints = (game, points, instant = false) => {
    const visiblePoints = points.filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!visiblePoints.length) return;
    const pixels = visiblePoints.map(point => game.gridToPixel(point.x, point.y));
    const avg = pixels.reduce((sum, point) => ({ px: sum.px + point.px, py: sum.py + point.py }), { px: 0, py: 0 });
    game.camTargetX = avg.px / pixels.length;
    game.camTargetY = avg.py / pixels.length;
    if (instant || !Number.isFinite(game.camX) || !Number.isFinite(game.camY)) {
      game.camX = game.camTargetX;
      game.camY = game.camTargetY;
    }
  };

  const kickCamera = useCallback((game, strength = 12, duration = 380) => {
    if (!game) return;
    game.cameraKick = { startedAt: performance.now(), strength, duration };
  }, []);

  const buildTravelPath = useCallback((from, to) => {
    const path = [];
    let x = from.x;
    let y = from.y;
    const dx = Math.abs(to.x - x);
    const dy = Math.abs(to.y - y);
    const sx = x < to.x ? 1 : x > to.x ? -1 : 0;
    const sy = y < to.y ? 1 : y > to.y ? -1 : 0;
    let err = dx - dy;

    while (x !== to.x || y !== to.y) {
      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
      path.push({ x, y });
    }

    return path.length ? path : [{ x: to.x, y: to.y }];
  }, []);

  const buildAxisTravelPath = useCallback((from, to) => {
    const path = [];
    let x = from.x;
    let y = from.y;
    while (x !== to.x) {
      x += x < to.x ? 1 : -1;
      path.push({ x, y });
    }
    while (y !== to.y) {
      y += y < to.y ? 1 : -1;
      path.push({ x, y });
    }
    return path.length ? path : [{ x: to.x, y: to.y }];
  }, []);

  const getSegmentDuration = useCallback((from, to, totalSegments) => {
    const diagonal = from.x !== to.x && from.y !== to.y;
    const cadenceDrop = Math.min(90, Math.max(0, totalSegments - 4) * 10);
    return Math.max(680, (diagonal ? 980 : 860) - cadenceDrop);
  }, []);

  const getTransformMotionDuration = useCallback((from, destination, card) => {
    const distance = Math.hypot(destination.x - from.x, destination.y - from.y);
    if (card?.type === 'putaran') return Math.min(5200, Math.max(2400, Math.abs(card.angle || 0) * 13 + distance * 170));
    if (card?.type === 'pantulan') return Math.min(4400, Math.max(2200, distance * 310));
    return Math.min(4000, Math.max(2100, distance * 280));
  }, []);

  const getAxisSegmentDuration = useCallback((from, destination) => {
    const distance = Math.hypot(destination.x - from.x, destination.y - from.y);
    return Math.min(1100, Math.max(780, distance * 860));
  }, []);

  const animatePlayerMove = useCallback((game, player, destination, card = null, options = {}) => new Promise((resolve) => {
    const from = { x: player.x, y: player.y };
    if (from.x === destination.x && from.y === destination.y) {
      player.landingPulseAt = performance.now();
      resolve();
      return;
    }
    const startedAt = performance.now();
    const done = () => {
      player.landingPulseAt = performance.now();
      kickCamera(game, 11, 340);
      resolve();
    };
    if (card?.type === 'translasi' || card?.type === 'pantulan' || card?.type === 'putaran') {
      const fromPixel = game.gridToPixel(from.x, from.y);
      const toPixel = game.gridToPixel(destination.x, destination.y);
      if (card.type === 'translasi') {
        const xStep = { x: destination.x, y: from.y };
        const path = buildAxisTravelPath(from, destination);
        const firstTarget = path[0] || destination;
        const firstPixel = game.gridToPixel(firstTarget.x, firstTarget.y);
        player.motion = {
          path,
          segmentIndex: 0,
          card,
          axisStep: true,
          from,
          to: firstTarget,
          destination,
          rawDestination: getRrgRawTransformPoint(from, card),
          previewOnly: !!options.previewOnly,
          returnTo: options.previewOnly ? from : null,
          segmentStartedAt: startedAt,
          segmentDuration: getAxisSegmentDuration(from, firstTarget),
          diagonal: false,
          pixelVector: { x: firstPixel.px - fromPixel.px, y: firstPixel.py - fromPixel.py },
          onDone: done,
        };
        player.motionTilt = 0;
        player.motionStretch = 0;
        player.motionTransformRotation = 0;
        game.animating = true;
        const pName = getPlayerDisplayName(player, lang);
        game.message = options.previewOnly
          ? (lang === 'en'
            ? `${pName} testing choice (${destination.x}, ${destination.y}) grid by grid...`
            : `${pName} menguji pilihan (${destination.x}, ${destination.y}) satu petak demi satu petak...`)
          : (lang === 'en'
            ? `${pName} moving by vector (${card.dx}, ${card.dy}) grid by grid...`
            : `${pName} bergerak ikut vektor (${card.dx}, ${card.dy}) satu petak demi satu petak...`);
        centerOnPoints(game, [from, xStep, destination]);
        syncHud(game);
        return;
      }
      const motion = {
        mode: card.type === 'putaran' ? 'rotation' : 'direct',
        card,
        from,
        to: destination,
        destination,
        rawDestination: getRrgRawTransformPoint(from, card),
        previewOnly: !!options.previewOnly,
        returnTo: options.previewOnly ? from : null,
        startedAt,
        duration: getTransformMotionDuration(from, destination, card),
        pixelVector: { x: toPixel.px - fromPixel.px, y: toPixel.py - fromPixel.py },
        onDone: done,
      };
      if (card.type === 'putaran') {
        motion.center = { x: card.cx, y: card.cy };
        motion.startAngle = Math.atan2(from.y - card.cy, from.x - card.cx);
        motion.signedAngle = options.previewOnly
          ? getRrgGuessSignedRadians(from, destination, card)
          : getRrgRotationSignedRadians(card);
        motion.radius = Math.hypot(from.x - card.cx, from.y - card.cy);
      }
      player.motion = motion;
      player.motionTilt = 0;
      player.motionStretch = 0;
      player.motionTransformRotation = 0;
      game.animating = true;
      const pName = getPlayerDisplayName(player, lang);
      game.message = options.previewOnly
        ? (lang === 'en'
          ? `${pName} testing choice (${destination.x}, ${destination.y})...`
          : `${pName} menguji pilihan (${destination.x}, ${destination.y})...`)
        : getRrgMovementMessage(player, card, destination, lang);
      centerOnPoints(game, [
        from,
        destination,
        card.type === 'putaran' ? { x: card.cx, y: card.cy } : null,
        card.type === 'pantulan' ? getRrgReflectionFoot(from, card) : null,
      ]);
      syncHud(game);
      return;
    }
    const path = buildTravelPath(from, destination);
    const firstTarget = path[0];
    const fromPixel = game.gridToPixel(from.x, from.y);
    const toPixel = game.gridToPixel(firstTarget.x, firstTarget.y);
    player.motion = {
      path,
      segmentIndex: 0,
      from,
      to: firstTarget,
      destination,
      segmentStartedAt: performance.now(),
      segmentDuration: getSegmentDuration(from, firstTarget, path.length),
      diagonal: from.x !== firstTarget.x && from.y !== firstTarget.y,
      pixelVector: { x: toPixel.px - fromPixel.px, y: toPixel.py - fromPixel.py },
      onDone: done,
    };
    player.motionTilt = 0;
    player.motionStretch = 0;
    player.motionTransformRotation = 0;
    game.animating = true;
    game.message = getRrgMovementMessage(player, card, destination, lang);
    centerOnPoints(game, [from, destination]);
    syncHud(game);
  }), [buildAxisTravelPath, buildTravelPath, getAxisSegmentDuration, getSegmentDuration, getTransformMotionDuration, kickCamera, lang, syncHud]);

  const endTurn = useCallback((game, message) => {
    const endingPlayer = game.players[game.currentPlayer];
    game.card = null;
    game.dice = null;
    game.selected = null;
    game.hintLevel = 0;
    game.message = message || (lang === 'en' ? 'Next turn.' : 'Giliran seterusnya.');
    if (!game.gameOver && endingPlayer?.extraTurns > 0 && !endingPlayer.finished) {
      endingPlayer.extraTurns -= 1;
      const pName = getPlayerDisplayName(endingPlayer, lang);
      game.message += lang === 'en' ? ` ${pName} receives an extra turn.` : ` ${pName} mendapat giliran tambahan.`;
      centerOnPlayer(game, endingPlayer);
      syncHud(game);
      return;
    }
    game.currentPlayer = nextActiveIndex(game, game.currentPlayer);
    centerOnPlayer(game, game.players[game.currentPlayer]);
    syncHud(game);
  }, [lang, syncHud]);

  const rollDice = useCallback(() => {
    const game = gameRef.current;
    if (!game || game.card || game.gameOver) return;
    const player = game.players[game.currentPlayer];
    if (player.finished || game.animating) return;

    const rolls = [
      { key: 'red', ...RRG_DECK_META.red },
      { key: 'green', ...RRG_DECK_META.green },
      { key: 'blue', ...RRG_DECK_META.blue },
    ];

    game.animating = true;
    game.diceRolling = true;
    game.solutionPreview = null;
    window.clearTimeout(game.rollTimer);
    const cadence = [55, 55, 60, 65, 72, 80, 92, 105, 122, 142, 165, 192, 224, 260];
    const runRoll = (index = 0) => {
      game.dice = randomFrom(rolls);
      syncHud(game);
      if (index >= cadence.length - 1) {
        game.dice = randomFrom(rolls);
        game.card = randomFrom(RRG_TRANSFORM_CARDS[game.dice.key]);
        game.selected = null;
        game.hintLevel = 0;
        game.animating = false;
        game.diceRolling = false;
        game.rollTimer = null;
        const pName = getPlayerDisplayName(player, lang);
        const dLabel = lang === 'en' ? (game.dice.label_en || game.dice.label) : game.dice.label;
        const dCardName = lang === 'en' ? (game.dice.cardName_en || game.dice.cardName) : game.dice.cardName;
        const cTitle = getRrgCardTitle(game.card, lang);
        const cText = getRrgCardText(game.card, lang);
        game.message = lang === 'en'
          ? `${pName} got ${dLabel}: ${cTitle}. Click destination coordinate on grid.`
          : `${pName} mendapat ${game.dice.label}: ${game.card.title}. Klik koordinat destinasi pada grid.`;
        showCardDraw(game.dice.deck, game.card);
        showPopup(game.dice.symbol, dCardName, cText);
        syncHud(game);
        return;
      }
      game.rollTimer = window.setTimeout(() => runRoll(index + 1), cadence[index]);
    };

    runRoll();
  }, [lang, showCardDraw, showPopup, syncHud]);

  const buyHint = useCallback(() => {
    const game = gameRef.current;
    if (!game || !game.card || game.gameOver) return;
    const player = game.players[game.currentPlayer];
    if (player.score < HINT_COST || game.hintLevel >= 2) return;
    player.score -= HINT_COST;
    game.hintLevel += 1;
    game.message = getRrgHint(player, game.card, game.hintLevel, lang);
    playRrgSound('correct');
    showPopup('💡', `Hint ${game.hintLevel} (-RM${HINT_COST})`, game.message);
    syncHud(game);
  }, [lang, showPopup, syncHud]);

  const resetGame = useCallback((requestedCount = playerCount) => {
    const game = gameRef.current;
    if (!game) return;
    const nextCount = Number.isFinite(requestedCount) ? Math.max(2, Math.min(6, requestedCount)) : playerCount;
    setPlayerCount(nextCount);
    game.players = makePlayers(nextCount);
    game.currentPlayer = 0;
    game.dice = null;
    game.card = null;
    game.selected = null;
    game.hintLevel = 0;
    game.finishCount = 0;
    game.gameOver = false;
    game.drawCard = null;
    game.lastActionCard = null;
    game.solutionPreview = null;
    game.effects = [];
    game.diceRolling = false;
    game.cameraKick = null;
    window.clearTimeout(game.rollTimer);
    game.rollTimer = null;
    window.clearTimeout(game.drawCardTimer);
    game.message = lang === 'en'
      ? 'Mission begins at Crystal Hill. All players receive RM100.'
      : 'Misi bermula di Bukit Kristal. Semua pemain menerima RM100.';
    centerOnPlayer(game, game.players[0], true);
    showPopup('☢️', lang === 'en' ? 'Mission Begins' : 'Misi Bermula', lang === 'en' ? 'Escape Crystal Hill towards the Safe Zone.' : 'Selamatkan diri dari Bukit Kristal menuju Zon Selamat.');
    syncHud(game);
  }, [lang, makePlayers, playerCount, showPopup, syncHud]);

  const updatePlayerCount = useCallback((event) => {
    const count = Number(event.target.value);
    if (!Number.isFinite(count)) return;
    resetGame(count);
  }, [resetGame]);

  const findPreviousPlayer = useCallback((game) => {
    for (let step = 1; step < game.players.length; step++) {
      const index = (game.currentPlayer - step + game.players.length) % game.players.length;
      if (!game.players[index].finished) return game.players[index];
    }
    return null;
  }, []);

  const findNextTargetPlayer = useCallback((game) => {
    for (let step = 1; step < game.players.length; step++) {
      const index = (game.currentPlayer + step) % game.players.length;
      if (!game.players[index].finished) return game.players[index];
    }
    return null;
  }, []);

  const applyActionCard = useCallback((game, player, actionCard, depth = 0) => {
    const pName = getPlayerDisplayName(player, lang);
    const applyCard = (card, currentDepth) => {
      const effect = card.effect || {};
      const cardText = lang === 'en' ? (card.text_en || card.text) : card.text;
      const notes = [cardText];
      if (effect.score) {
        player.score += effect.score;
        notes.push(`${effect.score > 0 ? '+' : ''}RM${effect.score}.`);
      }
      if (effect.transferFromAll) {
        let total = 0;
        game.players.forEach((other) => {
          if (other.id !== player.id && !other.finished) {
            other.score -= effect.transferFromAll;
            total += effect.transferFromAll;
          }
        });
        player.score += total;
        notes.push(lang === 'en' ? `${pName} receives RM${total} from other players.` : `${pName} menerima RM${total} daripada pemain lain.`);
      }
      if (effect.payAll) {
        let total = 0;
        game.players.forEach((other) => {
          if (other.id !== player.id && !other.finished) {
            other.score -= effect.payAll;
            total += effect.payAll;
          }
        });
        player.score += total;
        notes.push(lang === 'en' ? `${pName} pays RM${total} to other players.` : `${pName} membayar RM${total} kepada pemain lain.`);
      }
      if (effect.transferFromPrevious) {
        const previous = findPreviousPlayer(game);
        if (previous) {
          const prevName = getPlayerDisplayName(previous, lang);
          previous.score -= effect.transferFromPrevious;
          player.score += effect.transferFromPrevious;
          notes.push(lang === 'en' ? `${prevName} gives RM${effect.transferFromPrevious}.` : `${prevName} memberi RM${effect.transferFromPrevious}.`);
        }
      }
      if (effect.freezeOthers) {
        game.players.forEach((other) => {
          if (other.id !== player.id && !other.finished) other.skipTurns += effect.freezeOthers;
        });
        notes.push(lang === 'en' ? 'All other players lose one turn.' : 'Semua pemain lain hilang satu giliran.');
      }
      if (effect.freezeNext) {
        const target = findNextTargetPlayer(game);
        if (target) {
          const targetName = getPlayerDisplayName(target, lang);
          target.skipTurns += effect.freezeNext;
          notes.push(lang === 'en' ? `${targetName} is frozen for one turn.` : `${targetName} dibekukan satu giliran.`);
        }
      }
      if (effect.extraTurn) {
        player.extraTurns += effect.extraTurn;
        notes.push(lang === 'en' ? `${pName} receives ${effect.extraTurn} extra turn(s).` : `${pName} mendapat ${effect.extraTurn} giliran tambahan.`);
      }
      if (effect.skipSelf) {
        player.skipTurns += effect.skipSelf;
        notes.push(lang === 'en' ? `${pName} will lose ${effect.skipSelf} turn(s).` : `${pName} akan hilang ${effect.skipSelf} giliran.`);
      }
      if (effect.resetStart) {
        player.trail.push({ x: player.x, y: player.y, time: performance.now() });
        player.x = 0;
        player.y = 0;
        notes.push(lang === 'en' ? `${pName} returns to Crystal Hill (0, 0).` : `${pName} kembali ke Bukit Kristal (0, 0).`);
      }
      if (effect.rotate360) {
        game.effects.push({ type: 'correct', x: player.x, y: player.y, startedAt: performance.now() });
        notes.push(lang === 'en' ? 'Token rotated 360° and remains at the same coordinates.' : 'Token diputar 360° dan kekal pada koordinat yang sama.');
      }
      if (effect.drawRewardAgain && currentDepth < 1) {
        const nextReward = randomFrom(RRG_REWARD_CARDS.filter(card => !card.effect?.drawRewardAgain));
        showCardDraw(nextReward.deck, nextReward);
        game.lastActionCard = nextReward;
        const prefix = lang === 'en' ? 'Additional reward card: ' : 'Kad ganjaran tambahan: ';
        notes.push(`${prefix}${applyCard(nextReward, currentDepth + 1)}`);
      }
      return notes.join(' ');
    };

    return applyCard(actionCard, depth);
  }, [findNextTargetPlayer, findPreviousPlayer, lang, showCardDraw]);

  const resolveItem = useCallback((game, player, destination) => {
    const item = getRrgItemAt(destination);
    let effectType = 'correct';
    let note = lang === 'en' ? 'No item on this grid intersection.' : 'Tiada item pada persilangan grid ini.';
    if (item?.kind === 'money' || item?.kind === 'diamond' || item?.kind === 'chest') {
      player.score += item.amount;
      effectType = 'coin';
      const itemLabel = lang === 'en' ? (item.label_en || item.label) : item.label;
      note = `${itemLabel}: +RM${item.amount}`;
    }
    if (item?.kind === 'reward') {
      const reward = randomFrom(RRG_REWARD_CARDS);
      showCardDraw(reward.deck, reward);
      game.lastActionCard = reward;
      effectType = 'coin';
      const rTitle = getRrgCardTitle(reward, lang);
      note = `${rTitle}: ${applyActionCard(game, player, reward)}`;
    }
    if (item?.kind === 'penalty') {
      const penalty = randomFrom(RRG_PENALTY_CARDS);
      showCardDraw(penalty.deck, penalty);
      game.lastActionCard = penalty;
      effectType = 'boom';
      const pTitle = getRrgCardTitle(penalty, lang);
      note = `${pTitle}: ${applyActionCard(game, player, penalty)}`;
    }

    if (isRrgSafeZone(destination) && !player.finished) {
      game.finishCount += 1;
      player.finished = true;
      player.finishOrder = game.finishCount;
      const bonus = player.finishOrder === 1 ? 1000 : player.finishOrder === 2 ? 700 : player.finishOrder === 3 ? 400 : 0;
      if (bonus) {
        player.score += bonus;
        note += lang === 'en' ? ` Safe Zone Bonus: +RM${bonus}` : ` Bonus Zon Selamat: +RM${bonus}`;
      }
      if (game.finishCount >= Math.min(3, game.players.length)) game.gameOver = true;
    }

    game.effects.push({ type: effectType, x: destination.x, y: destination.y, startedAt: performance.now() });
    playRrgSound(effectType);
    return { effectType, note };
  }, [applyActionCard, lang, showCardDraw]);

  const submitAnswer = useCallback(async () => {
    const game = gameRef.current;
    if (!game || !game.card || !game.selected || game.gameOver || game.animating) return;
    const player = game.players[game.currentPlayer];
    const pName = getPlayerDisplayName(player, lang);
    const correct = transformRrgPoint(player, game.card);
    const selected = game.selected;
    if (selected.x !== correct.x || selected.y !== correct.y) {
      game.message = lang === 'en'
        ? `${pName} testing choice (${selected.x}, ${selected.y})...`
        : `${pName} menguji pilihan (${selected.x}, ${selected.y})...`;
      syncHud(game);
      await animatePlayerMove(game, player, selected, game.card, { previewOnly: true });
      player.score -= WRONG_COST;
      game.effects.push({ type: 'wrong', x: selected.x, y: selected.y, startedAt: performance.now() });
      kickCamera(game, 8, 260);
      playRrgSound('wrong');
      showPopup('❌', lang === 'en' ? 'Incorrect Answer' : 'Jawapan belum tepat', lang === 'en' ? `${pName} lost RM${WRONG_COST}. Turn ended.` : `${pName} kehilangan RM${WRONG_COST}. Giliran tamat.`);
      game.animating = false;
      endTurn(game, lang === 'en' ? `${pName} chose (${selected.x}, ${selected.y}) but it was incorrect.` : `${pName} memilih (${selected.x}, ${selected.y}) tetapi tidak tepat.`);
      return;
    }

    const destination = { ...correct };
    game.solutionPreview = null;
    player.trail.push({ x: player.x, y: player.y, time: performance.now() });
    await animatePlayerMove(game, player, destination, game.card);
    const { note, effectType } = resolveItem(game, player, destination);
    const emoji = effectType === 'boom' ? '💣' : effectType === 'coin' ? '💰' : '✅';
    showPopup(emoji, lang === 'en' ? 'Correct Answer!' : 'Jawapan Tepat!', note);
    syncHud(game);
    await new Promise((resolve) => window.setTimeout(resolve, 280));
    game.animating = false;
    endTurn(game, lang === 'en' ? `${pName} successfully moved to (${destination.x}, ${destination.y}). ${note}` : `${pName} berjaya bergerak ke (${destination.x}, ${destination.y}). ${note}`);
  }, [animatePlayerMove, endTurn, kickCamera, lang, resolveItem, showPopup, syncHud]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const miniMap = miniMapRef.current;
    if (!canvas || !miniMap) return undefined;

    const ctx = canvas.getContext('2d');
    const mmCtx = miniMap.getContext('2d');
    const BOARD_W = 2758;
    const BOARD_H = 2758;
    const BOARD_CX = 1376.0;
    const BOARD_CY = 1376.0;
    const CELL = 86.5;
    const MAP_W = BOARD_W;
    const MAP_H = BOARD_H;
    const gridToPixel = (gx, gy) => ({
      px: BOARD_CX + gx * CELL,
      py: BOARD_CY - gy * CELL,
    });
    const screenToGrid = (clientX, clientY, game) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const sx = (clientX - rect.left) * dpr;
      const sy = (clientY - rect.top) * dpr;
      const mapX = (sx - canvas.width / 2) / (game.zoom * dpr) + game.camX;
      const mapY = (sy - canvas.height / 2) / (game.zoom * dpr) + game.camY;
      return {
        x: clampBoard(Math.round((mapX - BOARD_CX) / CELL)),
        y: clampBoard(Math.round((BOARD_CY - mapY) / CELL)),
      };
    };

    const textureSources = {
      officialBoard: '/rrg-board-official.webp',
      water: '/assets/rrgs/textures/air_new.jpg',
    };
    const textures = Object.fromEntries(Object.entries(textureSources).map(([key, src]) => {
      const image = new Image();
      image.src = src;
      return [key, image];
    }));
    const isTextureReady = (image) => image?.complete && image.naturalWidth > 0;

    let savedState = null;
    try {
      const saveKey = `rrg_save_${sessionUser?.uid || 'guest'}`;
      const saved = localStorage.getItem(saveKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
          savedState = parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load saved game", e);
    }

    const getFitZoom = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth || 1200;
      const h = rect.height || (window.innerHeight - 120) || 600;
      return Math.min(w / BOARD_W, h / BOARD_H) * 0.94;
    };

    const game = {
      canvas,
      ctx,
      gridToPixel,
      camX: BOARD_CX,
      camY: BOARD_CY,
      camTargetX: BOARD_CX,
      camTargetY: BOARD_CY,
      zoom: 0.22,
      dragStartX: 0,
      dragStartY: 0,
      camStartX: 0,
      camStartY: 0,
      dragDistance: 0,
      isDragging: false,
      currentPlayer: savedState ? savedState.currentPlayer : 0,
      dice: savedState ? savedState.dice : null,
      card: savedState ? savedState.card : null,
      selected: savedState ? savedState.selected : null,
      hintLevel: savedState ? savedState.hintLevel : 0,
      finishCount: savedState ? savedState.finishCount : 0,
      gameOver: false,
      animating: false,
      message: savedState ? savedState.message : (lang === 'en' ? 'Mission begins at Crystal Hill. All players receive RM100.' : 'Misi bermula di Bukit Kristal. Semua pemain menerima RM100.'),
      players: (savedState && Array.isArray(savedState.players) && savedState.players.length > 0)
        ? savedState.players.map(p => ({ ...p, trail: [], motion: null, motionLift: 0, motionTilt: 0, motionStretch: 0, motionTransformRotation: 0, landingPulseAt: 0, drawX: p.x, drawY: p.y }))
        : makePlayers(),
      drawCard: savedState ? savedState.drawCard : null,
      lastActionCard: savedState ? savedState.lastActionCard : null,
      solutionPreview: savedState ? savedState.solutionPreview : null,
      effects: [],
      cameraKick: null,
      diceRolling: false,
      rollTimer: null,
      time: 0,
      lastTime: performance.now(),
    };
    gameRef.current = game;
    syncHud(game);

    let hasFitZoomInitially = false;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      if (!hasFitZoomInitially && rect.width > 0 && rect.height > 0) {
        hasFitZoomInitially = true;
        const fit = getFitZoom();
        game.zoom = fit;
        game.camX = BOARD_CX;
        game.camY = BOARD_CY;
        game.camTargetX = BOARD_CX;
        game.camTargetY = BOARD_CY;
      }
    };
    resize();

    const activePointers = new Map();
    let pinchStartDist = 0;
    let pinchStartZoom = 1;

    const onPointerDown = (event) => {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (e) {}
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size === 1) {
        game.isDragging = true;
        game.dragStartX = event.clientX;
        game.dragStartY = event.clientY;
        game.camStartX = game.camX;
        game.camStartY = game.camY;
        game.camTargetX = game.camX;
        game.camTargetY = game.camY;
        game.dragDistance = 0;
      } else if (activePointers.size === 2) {
        game.isDragging = false;
        const pts = Array.from(activePointers.values());
        pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartZoom = game.zoom;
      }
    };

    const onPointerMove = (event) => {
      if (!game.isDragging) {
        game.hoverCoord = screenToGrid(event.clientX, event.clientY, game);
      }

      if (!activePointers.has(event.pointerId)) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (activePointers.size === 2 && pinchStartDist > 0) {
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const scale = dist / pinchStartDist;
        const minZ = Math.min(0.08, getFitZoom() * 0.6);
        game.zoom = Math.max(minZ, Math.min(3.0, pinchStartZoom * scale));
      } else if (game.isDragging && activePointers.size === 1) {
        const dx = event.clientX - game.dragStartX;
        const dy = event.clientY - game.dragStartY;
        game.dragDistance = Math.max(game.dragDistance, Math.abs(dx) + Math.abs(dy));
        game.camX = game.camStartX - dx / game.zoom;
        game.camY = game.camStartY - dy / game.zoom;
        game.camTargetX = game.camX;
        game.camTargetY = game.camY;
      }
    };

    const onPointerUp = (event) => {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (e) {}
      const wasDragging = game.isDragging;
      const dragDist = game.dragDistance;
      activePointers.delete(event.pointerId);

      if (activePointers.size === 0) {
        game.isDragging = false;
        if (wasDragging && dragDist < 8 && !game.gameOver && !game.animating) {
          const clickedGrid = screenToGrid(event.clientX, event.clientY, game);
          game.selected = clickedGrid;

          // Add interactive ripple shockwave
          game.effects.push({
            id: Math.random().toString(),
            type: 'ripple',
            x: clickedGrid.x,
            y: clickedGrid.y,
            startedAt: performance.now(),
            duration: 750,
          });

          const item = RRG_ITEMS.find((it) => it.x === clickedGrid.x && it.y === clickedGrid.y);
          const landmark = RRG_LANDMARKS.find((lm) => Math.hypot(lm.x - clickedGrid.x, lm.y - clickedGrid.y) < 1.4);

          if (game.card) {
            game.message = lang === 'en'
              ? `Selected coordinate: (${clickedGrid.x}, ${clickedGrid.y}). Press Check Answer.`
              : `Pilihan koordinat: (${clickedGrid.x}, ${clickedGrid.y}). Tekan Semak Jawapan.`;
            playRrgSound('coin');
          } else {
            const activeP = game.players[game.currentPlayer];
            const dist = Math.hypot(clickedGrid.x - activeP.x, clickedGrid.y - activeP.y).toFixed(1);
            let detail = '';
            if (item) {
              detail = lang === 'en'
                ? ` · ${item.label_en || item.label} (+RM${item.amount || 0})`
                : ` · ${item.label} (+RM${item.amount || 0})`;
              playRrgSound('coin');
            } else if (landmark) {
              detail = ` · ${lang === 'en' ? landmark.label_en : landmark.label}`;
              playRrgSound('correct');
            } else {
              detail = isRrgSafeZone(clickedGrid)
                ? (lang === 'en' ? ' · 🚤 Safe Zone (Rescue Boat)' : ' · 🚤 Zon Selamat (Bot Penyelamat)')
                : '';
              playRrgSound('click');
            }
            game.message = lang === 'en'
              ? `Coordinate (${clickedGrid.x}, ${clickedGrid.y})${detail} · Distance from ${activeP.name}: ${dist} units`
              : `Koordinat (${clickedGrid.x}, ${clickedGrid.y})${detail} · Jarak dari ${activeP.name}: ${dist} unit`;
          }
          syncHud(game);
        }
      } else if (activePointers.size === 1) {
        const remaining = Array.from(activePointers.values())[0];
        game.isDragging = true;
        game.dragStartX = remaining.x;
        game.dragStartY = remaining.y;
        game.camStartX = game.camX;
        game.camStartY = game.camY;
        game.dragDistance = 20;
      }
    };

    const onWheel = (event) => {
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      const minZ = Math.min(0.08, getFitZoom() * 0.6);
      game.zoom = Math.max(minZ, Math.min(3.0, game.zoom * delta));
      event.preventDefault();
    };

    const onKeyDown = (event) => {
      if (!game.card || !game.selected || game.animating) return;
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') game.selected.y = clampBoard(game.selected.y + 1);
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') game.selected.y = clampBoard(game.selected.y - 1);
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') game.selected.x = clampBoard(game.selected.x - 1);
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') game.selected.x = clampBoard(game.selected.x + 1);
      if (event.key === 'Enter') submitAnswer();
      syncHud(game);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const drawRoundRect = (context, x, y, w, h, r) => {
      context.beginPath();
      context.moveTo(x + r, y);
      context.lineTo(x + w - r, y);
      context.quadraticCurveTo(x + w, y, x + w, y + r);
      context.lineTo(x + w, y + h - r);
      context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      context.lineTo(x + r, y + h);
      context.quadraticCurveTo(x, y + h, x, y + h - r);
      context.lineTo(x, y + r);
      context.quadraticCurveTo(x, y, x + r, y);
    };

    const drawTiledImage = (image, x, y, width, height, tileWidth, tileHeight, offsetX = 0, offsetY = 0, alpha = 1) => {
      if (!isTextureReady(image)) return false;
      const startX = x + ((offsetX % tileWidth) + tileWidth) % tileWidth - tileWidth;
      const startY = y + ((offsetY % tileHeight) + tileHeight) % tileHeight - tileHeight;
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let tx = startX; tx < x + width + tileWidth; tx += tileWidth) {
        for (let ty = startY; ty < y + height + tileHeight; ty += tileHeight) {
          ctx.drawImage(image, tx, ty, tileWidth, tileHeight);
        }
      }
      ctx.restore();
      return true;
    };

    const makeTokenPath = (context, shape, size) => {
      context.beginPath();
      shape.points.forEach(([x, y], pointIndex) => {
        const px = x * size;
        const py = y * size;
        if (pointIndex === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      });
      context.closePath();
    };

    const drawPlayerToken = (player, index, x, y, mode = 'object', options = {}) => {
      const shape = RRG_PLAYER_SHAPES[index % RRG_PLAYER_SHAPES.length];
      const size = options.size ?? 20;
      const bounce = options.bounce ?? 0;
      const alpha = options.alpha ?? 1;
      const isImage = mode === 'image';
      const scaleX = options.scaleX ?? 1;
      const scaleY = options.scaleY ?? 1;
      const shadowScale = options.shadowScale ?? 1;
      ctx.save();
      ctx.translate(x, y + bounce - size * 0.64);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, size * 0.64, size * 0.72 * shadowScale, size * 0.22 * Math.max(0.78, shadowScale * 0.92), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(options.rotation ?? 0);
      ctx.scale(scaleX, scaleY);
      makeTokenPath(ctx, shape, size);
      ctx.fillStyle = isImage ? 'rgba(96, 165, 250, 0.88)' : 'rgba(255, 255, 255, 0.94)';
      ctx.fill();
      ctx.lineWidth = isImage ? 3 : 2.6;
      ctx.strokeStyle = isImage ? '#1d4ed8' : (player.finished ? '#22c55e' : player.color);
      ctx.stroke();
      ctx.save();
      makeTokenPath(ctx, shape, size);
      ctx.clip();
      const shine = ctx.createLinearGradient(-size, -size, size, size);
      shine.addColorStop(0, 'rgba(255,255,255,0.38)');
      shine.addColorStop(0.45, 'rgba(255,255,255,0.08)');
      shine.addColorStop(1, 'rgba(15,23,42,0.12)');
      ctx.fillStyle = shine;
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.restore();
      if (options.label !== false) {
        ctx.fillStyle = isImage ? '#eff6ff' : player.color;
        ctx.strokeStyle = isImage ? '#1e3a8a' : '#ffffff';
        ctx.lineWidth = 3;
        ctx.font = 'bold 11px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(player.id, 0, 1);
        ctx.fillText(player.id, 0, 1);
      }
      ctx.restore();
    };

    const drawSelectedImageToken = () => {
      if (!game.selected) return;
      const player = game.players[game.currentPlayer];
      const pos = gridToPixel(game.selected.x, game.selected.y);
      const pulse = 1 + Math.sin(game.time * 4) * 0.05;
      ctx.save();
      ctx.strokeStyle = 'rgba(29, 78, 216, 0.7)';
      ctx.fillStyle = 'rgba(96, 165, 250, 0.16)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(pos.px, pos.py, 28 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      drawPlayerToken(player, game.currentPlayer, pos.px, pos.py, 'image', { size: 22 * pulse, alpha: 0.92, label: true });
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`${langRef.current === 'en' ? 'Selected image' : 'Imej pilihan'} (${game.selected.x}, ${game.selected.y})`, pos.px, pos.py - 36);
      ctx.restore();
    };

    const drawLivingBukitKristal = (context, g) => {
      const pos = gridToPixel(0, 0);
      const t = g.time;
      context.save();
      context.translate(pos.px, pos.py);

      const pulse = 1 + Math.sin(t * 2.5) * 0.12;
      const aura = context.createRadialGradient(0, 0, 8, 0, 0, 95 * pulse);
      aura.addColorStop(0, 'rgba(239, 68, 68, 0.42)');
      aura.addColorStop(0.35, 'rgba(244, 63, 94, 0.22)');
      aura.addColorStop(0.7, 'rgba(217, 70, 239, 0.08)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = aura;
      context.beginPath();
      context.arc(0, 0, 95 * pulse, 0, Math.PI * 2);
      context.fill();

      context.rotate(t * 0.22);
      context.strokeStyle = 'rgba(254, 205, 211, 0.38)';
      context.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        context.beginPath();
        context.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
        context.lineTo(Math.cos(a) * 70 * pulse, Math.sin(a) * 70 * pulse);
        context.stroke();
      }

      for (let i = 0; i < 7; i++) {
        const pPhase = (t * 0.4 + i * 0.14) % 1;
        const sx = Math.sin(i * 37.5) * (32 * pPhase);
        const sy = -pPhase * 65 + Math.cos(i * 12.3) * 8;
        const sAlpha = (1 - pPhase) * Math.sin(pPhase * Math.PI);
        context.fillStyle = `rgba(255, 255, 255, ${sAlpha})`;
        context.beginPath();
        context.arc(sx, sy, 1.8 * (1 - pPhase * 0.4), 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    };

    const drawLivingLighthouse = (context, g) => {
      const pos = gridToPixel(14, 7);
      const t = g.time;
      context.save();
      context.translate(pos.px, pos.py);

      const beamAngle = t * 0.65;
      context.save();
      context.rotate(beamAngle);
      const beam = context.createRadialGradient(0, 0, 5, 120, 0, 240);
      beam.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      beam.addColorStop(0.35, 'rgba(253, 224, 71, 0.3)');
      beam.addColorStop(0.7, 'rgba(250, 204, 21, 0.1)');
      beam.addColorStop(1, 'rgba(250, 204, 21, 0)');
      context.fillStyle = beam;
      context.beginPath();
      context.moveTo(0, 0);
      context.arc(0, 0, 250, -0.24, 0.24);
      context.closePath();
      context.fill();
      context.restore();

      const flare = context.createRadialGradient(0, -6, 2, 0, -6, 18);
      flare.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      flare.addColorStop(0.5, 'rgba(250, 204, 21, 0.55)');
      flare.addColorStop(1, 'rgba(250, 204, 21, 0)');
      context.fillStyle = flare;
      context.beginPath();
      context.arc(0, -6, 18, 0, Math.PI * 2);
      context.fill();

      context.restore();
    };

    const drawLivingWaterfallAndRiver = (context, g) => {
      const t = g.time;
      const riverPts = [
        { x: -4.8, y: -4.5 },
        { x: -5.4, y: -6.0 },
        { x: -6.8, y: -8.0 },
        { x: -8.8, y: -10.2 },
        { x: -11.5, y: -12.6 },
        { x: -13.5, y: -14.2 }
      ].map(pt => gridToPixel(pt.x, pt.y));

      context.save();
      context.lineCap = 'round';
      context.lineJoin = 'round';

      context.strokeStyle = 'rgba(56, 189, 248, 0.52)';
      context.lineWidth = 14;
      context.beginPath();
      context.moveTo(riverPts[0].px, riverPts[0].py);
      for (let i = 1; i < riverPts.length; i++) {
        context.lineTo(riverPts[i].px, riverPts[i].py);
      }
      context.stroke();

      context.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      context.lineWidth = 4;
      context.setLineDash([8, 16]);
      context.lineDashOffset = -t * 65;
      context.beginPath();
      context.moveTo(riverPts[0].px, riverPts[0].py);
      for (let i = 1; i < riverPts.length; i++) {
        context.lineTo(riverPts[i].px, riverPts[i].py);
      }
      context.stroke();
      context.setLineDash([]);

      const wfPos = gridToPixel(-5, -6);
      context.save();
      context.translate(wfPos.px, wfPos.py);

      for (let i = 0; i < 3; i++) {
        const rPhase = (t * 0.9 + i * 0.33) % 1;
        context.strokeStyle = `rgba(224, 242, 254, ${(1 - rPhase) * 0.6})`;
        context.lineWidth = 2;
        context.beginPath();
        context.ellipse(0, 10, rPhase * 36, rPhase * 16, 0, 0, Math.PI * 2);
        context.stroke();
      }

      for (let i = 0; i < 8; i++) {
        const dPhase = (t * 2.2 + i * 0.25) % 1;
        const dx = Math.sin(i * 18.5) * (18 * dPhase);
        const dy = 10 - Math.sin(dPhase * Math.PI) * 22;
        context.fillStyle = `rgba(255, 255, 255, ${1 - dPhase})`;
        context.beginPath();
        context.arc(dx, dy, 1.8 * (1 - dPhase * 0.5), 0, Math.PI * 2);
        context.fill();
      }

      for (let i = 0; i < 5; i++) {
        const mPhase = (t * 0.35 + i * 0.2) % 1;
        const mx = Math.sin(i * 24.3) * 14 + Math.sin(t + i) * 6;
        const my = 8 - mPhase * 44;
        const mist = context.createRadialGradient(mx, my, 0, mx, my, 18 + mPhase * 16);
        mist.addColorStop(0, `rgba(240, 249, 255, ${(1 - mPhase) * 0.32})`);
        mist.addColorStop(1, 'rgba(255, 255, 255, 0)');
        context.fillStyle = mist;
        context.beginPath();
        context.arc(mx, my, 18 + mPhase * 16, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();

      context.restore();
    };

    const drawLivingFactorySmoke = (context, g) => {
      const pos = gridToPixel(6, 3);
      const t = g.time;
      context.save();
      context.translate(pos.px, pos.py);
      for (let i = 0; i < 5; i++) {
        const sPhase = (t * 0.28 + i * 0.2) % 1;
        const sx = 14 + Math.sin(t * 1.2 + i) * 8 + sPhase * 18;
        const sy = -28 - sPhase * 55;
        const sSize = 8 + sPhase * 20;
        const sAlpha = (1 - sPhase) * 0.35;
        context.fillStyle = `rgba(226, 232, 240, ${sAlpha})`;
        context.beginPath();
        context.arc(sx, sy, sSize, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    };

    const drawLivingClinic = (context, g) => {
      const pos = gridToPixel(8, -4);
      const t = g.time;
      const pulse = 1 + Math.sin(t * 3) * 0.15;
      context.save();
      context.translate(pos.px, pos.py);
      context.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      context.lineWidth = 2.2;
      context.beginPath();
      context.arc(0, 0, 18 * pulse, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    };

    const drawLivingRescueBoats = (context, g) => {
      const boatCoords = [
        { x: -11, y: 14.2, angle: 0 },
        { x: -4, y: 14.2, angle: 0 },
        { x: 4, y: 14.2, angle: 0 },
        { x: 11, y: 14.2, angle: 0 },
        { x: -11, y: -14.2, angle: Math.PI },
        { x: -4, y: -14.2, angle: Math.PI },
        { x: 4, y: -14.2, angle: Math.PI },
        { x: 11, y: -14.2, angle: Math.PI },
        { x: -14.2, y: 8, angle: -Math.PI / 2 },
        { x: -14.2, y: 0, angle: -Math.PI / 2 },
        { x: -14.2, y: -8, angle: -Math.PI / 2 },
        { x: 14.2, y: 2, angle: Math.PI / 2 },
        { x: 14.2, y: -4, angle: Math.PI / 2 },
        { x: 14.2, y: -10, angle: Math.PI / 2 },
      ];

      boatCoords.forEach((b, idx) => {
        const pos = gridToPixel(b.x, b.y);
        const bob = Math.sin(g.time * 2.2 + idx * 0.8) * 3;
        const roll = Math.cos(g.time * 1.5 + idx * 0.8) * 0.08;

        context.save();
        context.translate(pos.px, pos.py + bob);
        context.rotate(b.angle + roll);

        context.strokeStyle = `rgba(255, 255, 255, ${0.45 + Math.sin(g.time * 3 + idx) * 0.25})`;
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(-16, -6);
        context.quadraticCurveTo(-28, -12, -40, -16);
        context.moveTo(-16, 6);
        context.quadraticCurveTo(-28, 12, -40, 18);
        context.stroke();

        context.fillStyle = 'rgba(3, 30, 45, 0.35)';
        context.beginPath();
        context.ellipse(0, 8, 22, 9, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#ffffff';
        context.beginPath();
        context.moveTo(18, 0);
        context.quadraticCurveTo(8, -9, -16, -8);
        context.lineTo(-18, 8);
        context.quadraticCurveTo(8, 9, 18, 0);
        context.fill();
        context.strokeStyle = '#0284c7';
        context.lineWidth = 1.8;
        context.stroke();

        context.fillStyle = '#f97316';
        context.fillRect(-6, -4, 12, 8);

        context.fillStyle = '#38bdf8';
        context.beginPath();
        context.moveTo(6, -3);
        context.lineTo(10, 0);
        context.lineTo(6, 3);
        context.closePath();
        context.fill();

        context.restore();
      });
    };

    const drawLivingPalmTrees = (context, g) => {
      const treeCoords = [
        { x: -12.5, y: 12 },
        { x: 12.5, y: 12 },
        { x: -13.5, y: -6 },
        { x: 13.5, y: -6 },
        { x: -8, y: 13 },
        { x: 8, y: 13 },
        { x: -13, y: 5 },
        { x: 13, y: 5 },
      ];

      treeCoords.forEach((tree, idx) => {
        const pos = gridToPixel(tree.x, tree.y);
        const sway = Math.sin(g.time * 1.6 + idx) * 0.12;
        context.save();
        context.translate(pos.px, pos.py);

        context.rotate(sway * 0.5);
        context.strokeStyle = '#78350f';
        context.lineWidth = 4.5;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(0, 0);
        context.quadraticCurveTo(sway * 15, -12, sway * 25, -24);
        context.stroke();

        context.translate(sway * 25, -24);
        for (let f = 0; f < 5; f++) {
          const a = -Math.PI / 2 + (f - 2) * 0.55 + sway * 0.4;
          context.fillStyle = '#16a34a';
          context.beginPath();
          context.moveTo(0, 0);
          context.quadraticCurveTo(Math.cos(a - 0.2) * 14, Math.sin(a - 0.2) * 14, Math.cos(a) * 20, Math.sin(a) * 20);
          context.quadraticCurveTo(Math.cos(a + 0.2) * 14, Math.sin(a + 0.2) * 14, 0, 0);
          context.fill();
        }
        context.restore();
      });
    };

    const drawLivingItems = (context, g) => {
      RRG_ITEMS.forEach((item) => {
        const pos = gridToPixel(item.x, item.y);
        const t = g.time;
        const seed = item.x * 17 + item.y * 31;
        const bob = Math.sin(t * 3 + seed) * 3;

        context.save();
        context.translate(pos.px, pos.py + bob);

        if (item.kind === 'diamond') {
          const dScale = 1 + Math.sin(t * 3.5 + seed) * 0.08;
          const spin = Math.sin(t * 2.2 + seed) * 0.25;
          context.scale(dScale * (1 - Math.abs(spin) * 0.15), dScale);

          const dGlow = context.createRadialGradient(0, 0, 4, 0, 0, 24);
          dGlow.addColorStop(0, 'rgba(168, 85, 247, 0.75)');
          dGlow.addColorStop(0.6, 'rgba(56, 189, 248, 0.3)');
          dGlow.addColorStop(1, 'rgba(0,0,0,0)');
          context.fillStyle = dGlow;
          context.beginPath();
          context.arc(0, 0, 24, 0, Math.PI * 2);
          context.fill();

          context.fillStyle = '#38bdf8';
          context.beginPath();
          context.moveTo(0, -13);
          context.lineTo(10, -4);
          context.lineTo(0, 13);
          context.lineTo(-10, -4);
          context.closePath();
          context.fill();

          context.fillStyle = '#93c5fd';
          context.beginPath();
          context.moveTo(0, -13);
          context.lineTo(10, -4);
          context.lineTo(0, 13);
          context.closePath();
          context.fill();

          context.strokeStyle = '#ffffff';
          context.lineWidth = 1.4;
          context.stroke();

          const glintPhase = (t * 0.6 + seed * 0.1) % 1;
          if (glintPhase < 0.35) {
            const gAlpha = Math.sin((glintPhase / 0.35) * Math.PI);
            context.fillStyle = `rgba(255, 255, 255, ${gAlpha})`;
            context.beginPath();
            context.arc(-3, -6, 2.5, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = `rgba(255, 255, 255, ${gAlpha})`;
            context.beginPath();
            context.moveTo(-8, -6); context.lineTo(2, -6);
            context.moveTo(-3, -11); context.lineTo(-3, -1);
            context.stroke();
          }
        } else if (item.kind === 'chest') {
          const cPulse = 1 + Math.sin(t * 3.2 + seed) * 0.08;
          context.scale(cPulse, cPulse);

          const cGlow = context.createRadialGradient(0, 0, 6, 0, 0, 25);
          cGlow.addColorStop(0, 'rgba(250, 204, 21, 0.8)');
          cGlow.addColorStop(0.6, 'rgba(249, 115, 22, 0.35)');
          cGlow.addColorStop(1, 'rgba(0,0,0,0)');
          context.fillStyle = cGlow;
          context.beginPath();
          context.arc(0, 0, 25, 0, Math.PI * 2);
          context.fill();

          context.fillStyle = '#b45309';
          context.fillRect(-10, -5, 20, 14);
          context.fillStyle = '#fbbf24';
          context.fillRect(-11, -9, 22, 6);
          context.fillStyle = '#fef08a';
          context.fillRect(-2, -3, 4, 5);
          context.strokeStyle = '#78350f';
          context.lineWidth = 1.5;
          context.strokeRect(-10, -5, 20, 14);
          context.strokeRect(-11, -9, 22, 6);

          for (let s = 0; s < 2; s++) {
            const sP = (t * 0.7 + seed + s * 0.5) % 1;
            const starX = Math.sin(s * 15 + seed) * 12;
            const starY = -12 - sP * 16;
            context.fillStyle = `rgba(254, 240, 138, ${(1 - sP) * 0.85})`;
            context.beginPath();
            context.arc(starX, starY, 1.8, 0, Math.PI * 2);
            context.fill();
          }
        } else if (item.kind === 'money') {
          const mPulse = 1 + Math.sin(t * 3.8 + seed) * 0.07;
          context.scale(mPulse, mPulse);

          context.fillStyle = 'rgba(234, 179, 8, 0.22)';
          context.beginPath();
          context.arc(0, 0, 18, 0, Math.PI * 2);
          context.fill();

          context.fillStyle = '#dc2626';
          context.beginPath();
          context.arc(0, 3, 9, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = '#f59e0b';
          context.fillRect(-4, -6, 8, 4);

          const cP = (t * 0.8 + seed) % 1;
          const cY = -8 - cP * 16;
          context.fillStyle = `rgba(250, 204, 21, ${(1 - cP) * 0.9})`;
          context.font = 'bold 9px Inter';
          context.textAlign = 'center';
          context.fillText('+RM', 0, cY);
        } else if (item.kind === 'reward') {
          const rP = (t * 1.5 + seed) % 1;
          context.strokeStyle = `rgba(34, 197, 94, ${(1 - rP) * 0.85})`;
          context.lineWidth = 2.4;
          context.beginPath();
          context.arc(0, 0, 8 + rP * 18, 0, Math.PI * 2);
          context.stroke();

          context.fillStyle = '#22c55e';
          context.beginPath();
          context.arc(0, 0, 7, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = '#ffffff';
          context.lineWidth = 1.6;
          context.stroke();
        } else if (item.kind === 'penalty') {
          const hPulse = 1 + Math.sin(t * 4.5 + seed) * 0.15;
          context.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          context.lineWidth = 2.2;
          context.setLineDash([4, 4]);
          context.lineDashOffset = t * 14;
          context.beginPath();
          context.arc(0, 0, 18 * hPulse, 0, Math.PI * 2);
          context.stroke();
          context.setLineDash([]);
          context.fillStyle = 'rgba(239, 68, 68, 0.25)';
          context.fill();
        }

        context.restore();
      });
    };

    const drawInteractiveCursorAndRipples = (context, g) => {
      g.effects = g.effects.filter((eff) => {
        if (eff.type !== 'ripple') return true;
        const age = performance.now() - eff.startedAt;
        if (age > (eff.duration || 750)) return false;
        const p = age / (eff.duration || 750);
        const pos = gridToPixel(eff.x, eff.y);
        context.save();
        context.strokeStyle = `rgba(56, 189, 248, ${(1 - p) * 0.95})`;
        context.lineWidth = 3.5 * (1 - p * 0.6);
        context.beginPath();
        context.arc(pos.px, pos.py, p * 55, 0, Math.PI * 2);
        context.stroke();
        context.restore();
        return true;
      });

      if (g.hoverCoord && !g.isDragging) {
        const pos = gridToPixel(g.hoverCoord.x, g.hoverCoord.y);
        const item = RRG_ITEMS.find((it) => it.x === g.hoverCoord.x && it.y === g.hoverCoord.y);
        const landmark = RRG_LANDMARKS.find((lm) => Math.hypot(lm.x - g.hoverCoord.x, lm.y - g.hoverCoord.y) < 1.4);

        context.save();
        context.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        context.fillStyle = 'rgba(56, 189, 248, 0.16)';
        context.lineWidth = 1.8;
        context.strokeRect(pos.px - CELL / 2, pos.py - CELL / 2, CELL, CELL);
        context.fillRect(pos.px - CELL / 2, pos.py - CELL / 2, CELL, CELL);

        const bLen = 9;
        context.strokeStyle = '#38bdf8';
        context.lineWidth = 2.4;
        [
          [pos.px - CELL / 2, pos.py - CELL / 2, 1, 1],
          [pos.px + CELL / 2, pos.py - CELL / 2, -1, 1],
          [pos.px - CELL / 2, pos.py + CELL / 2, 1, -1],
          [pos.px + CELL / 2, pos.py + CELL / 2, -1, -1]
        ].forEach(([cx, cy, sx, sy]) => {
          context.beginPath();
          context.moveTo(cx, cy + sy * bLen);
          context.lineTo(cx, cy);
          context.lineTo(cx + sx * bLen, cy);
          context.stroke();
        });

        const tag = item
          ? `${item.label} (${g.hoverCoord.x}, ${g.hoverCoord.y})`
          : landmark
          ? `${landmark.label} (${g.hoverCoord.x}, ${g.hoverCoord.y})`
          : isRrgSafeZone(g.hoverCoord)
          ? `🚤 Zon Selamat (${g.hoverCoord.x}, ${g.hoverCoord.y})`
          : `(${g.hoverCoord.x}, ${g.hoverCoord.y})`;

        drawGuideLabel(tag, { px: pos.px, py: pos.py - 30 }, {
          background: 'rgba(15, 23, 42, 0.92)',
          border: 'rgba(56, 189, 248, 0.7)',
          color: '#38bdf8',
          font: 'bold 11px Inter'
        });

        context.restore();
      }
    };

    const drawGuideLabel = (text, point, options = {}) => {
      const pos = Number.isFinite(point?.px) ? point : gridToPixel(point.x, point.y);
      const alpha = options.alpha ?? 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = options.font || 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const paddingX = 8;
      const width = Math.max(38, ctx.measureText(text).width + paddingX * 2);
      const height = 22;
      const x = pos.px - width / 2;
      const y = pos.py + (options.offsetY ?? -34) - height / 2;
      drawRoundRect(ctx, x, y, width, height, 7);
      ctx.fillStyle = options.background || 'rgba(15, 23, 42, 0.86)';
      ctx.fill();
      ctx.strokeStyle = options.border || 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = options.color || '#ffffff';
      ctx.fillText(text, pos.px, pos.py + (options.offsetY ?? -34));
      ctx.restore();
    };

    const drawArrowHead = (start, end, color, alpha = 1, size = 11) => {
      const angle = Math.atan2(end.py - start.py, end.px - start.px);
      if (!Number.isFinite(angle)) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(end.px, end.py);
      ctx.lineTo(end.px - Math.cos(angle - 0.52) * size, end.py - Math.sin(angle - 0.52) * size);
      ctx.lineTo(end.px - Math.cos(angle + 0.52) * size, end.py - Math.sin(angle + 0.52) * size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawGridLine = (from, to, color, options = {}) => {
      const start = gridToPixel(from.x, from.y);
      const end = gridToPixel(to.x, to.y);
      const distance = Math.hypot(end.px - start.px, end.py - start.py);
      if (distance < 2) return;
      ctx.save();
      ctx.globalAlpha = options.alpha ?? 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = options.width ?? 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (options.dash) ctx.setLineDash(options.dash);
      ctx.lineDashOffset = options.dashOffset ?? 0;
      ctx.beginPath();
      ctx.moveTo(start.px, start.py);
      ctx.lineTo(end.px, end.py);
      ctx.stroke();
      if (options.arrow) drawArrowHead(start, end, color, options.alpha ?? 1, options.arrowSize ?? 11);
      ctx.restore();
    };

    const drawPointMarker = (point, color, label, options = {}) => {
      const pos = gridToPixel(point.x, point.y);
      const alpha = options.alpha ?? 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = options.fill || color;
      ctx.strokeStyle = options.stroke || '#ffffff';
      ctx.lineWidth = options.lineWidth ?? 2.5;
      ctx.beginPath();
      ctx.arc(pos.px, pos.py, options.radius ?? 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (label) {
        drawGuideLabel(label, pos, {
          alpha,
          offsetY: options.labelOffsetY ?? -32,
          background: options.labelBackground || color,
          border: 'rgba(255,255,255,0.72)',
        });
      }
      ctx.restore();
    };

    const drawReflectionLineGuide = (card, alpha = 1) => {
      const segment = getRrgReflectionGuideSegment(card);
      if (!segment) return;
      drawGridLine(segment.from, segment.to, '#10b981', {
        alpha,
        width: 4,
        dash: [16, 10],
        dashOffset: -game.time * 28,
      });
      const mid = { x: (segment.from.x + segment.to.x) / 2, y: (segment.from.y + segment.to.y) / 2 };
      drawGuideLabel(getRrgReflectionLineLabel(card, langRef.current), mid, {
        alpha,
        background: 'rgba(5, 150, 105, 0.9)',
        offsetY: card.axis === 'x' || card.axis === 'yLine' ? -24 : -34,
      });
    };

    const drawRotationArcGuide = (from, card, options = {}) => {
      const center = { x: card.cx, y: card.cy };
      const radius = Math.hypot(from.x - center.x, from.y - center.y);
      const signedAngle = options.signedAngle ?? getRrgRotationSignedRadians(card);
      const progress = options.progress ?? 1;
      const alpha = options.alpha ?? 1;
      const color = options.color || '#2563eb';
      drawPointMarker(center, '#2563eb', `${langRef.current === 'en' ? 'Center' : 'Pusat'} (${card.cx}, ${card.cy})`, {
        alpha,
        radius: 7,
        labelBackground: 'rgba(37, 99, 235, 0.9)',
      });
      if (radius < 0.05 || Math.abs(signedAngle) < 0.01) return;
      drawGridLine(center, from, '#1d4ed8', { alpha: alpha * 0.45, width: 2, dash: [6, 7] });
      const startAngle = Math.atan2(from.y - center.y, from.x - center.x);
      const steps = Math.max(8, Math.ceil(Math.abs(signedAngle * progress) / (Math.PI / 20)));
      let prev = null;
      let last = null;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = options.width ?? 4;
      ctx.lineCap = 'round';
      ctx.setLineDash(options.dash || []);
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = startAngle + signedAngle * progress * t;
        const point = {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        };
        const pos = gridToPixel(point.x, point.y);
        if (i === 0) ctx.moveTo(pos.px, pos.py);
        else ctx.lineTo(pos.px, pos.py);
        prev = last;
        last = pos;
      }
      ctx.stroke();
      ctx.restore();
      if (prev && last) drawArrowHead(prev, last, color, alpha, 12);
      const dir = langRef.current === 'en' ? (card.dir === 'cw' ? 'clockwise' : 'anticlockwise') : (card.dir === 'cw' ? 'ikut jam' : 'lawan jam');
      drawGuideLabel(options.label || `${card.angle}° ${dir}`, {
        x: center.x + Math.cos(startAngle + signedAngle * progress * 0.5) * Math.max(1.25, radius * 0.72),
        y: center.y + Math.sin(startAngle + signedAngle * progress * 0.5) * Math.max(1.25, radius * 0.72),
      }, {
        alpha,
        background: 'rgba(29, 78, 216, 0.9)',
        offsetY: -24,
      });
    };

    const drawTransformGuide = (from, card, options = {}) => {
      if (!card) return;
      const mode = options.mode || 'active';
      const destination = options.destination || transformRrgPoint(from, card);
      const isGuess = mode === 'guess';
      const showAnswer = mode === 'solution' || mode === 'motion';
      const showDestination = showAnswer || isGuess;
      const alpha = options.alpha ?? 1;
      if (card.type === 'translasi') {
        const vectorDx = isGuess ? destination.x - from.x : card.dx;
        const vectorDy = isGuess ? destination.y - from.y : card.dy;
        const xStep = { x: clampBoard(from.x + vectorDx), y: from.y };
        drawGridLine(from, destination, '#ef4444', {
          alpha: alpha * 0.45,
          width: 7,
          dash: [14, 12],
          dashOffset: -game.time * 34,
          arrow: true,
          arrowSize: 13,
        });
        if (vectorDx !== 0) {
          drawGridLine(from, xStep, '#dc2626', { alpha, width: 3.5, arrow: true });
          drawGuideLabel(`x ${vectorDx > 0 ? '+' : ''}${vectorDx}`, {
            x: (from.x + xStep.x) / 2,
            y: from.y,
          }, { alpha, background: 'rgba(220, 38, 38, 0.88)', offsetY: -24 });
        }
        if (vectorDy !== 0) {
          drawGridLine(xStep, destination, '#f97316', { alpha, width: 3.5, arrow: true });
          drawGuideLabel(`y ${vectorDy > 0 ? '+' : ''}${vectorDy}`, {
            x: xStep.x,
            y: (xStep.y + destination.y) / 2,
          }, { alpha, background: 'rgba(249, 115, 22, 0.9)', offsetY: -24 });
        }
        drawGuideLabel(`${isGuess ? (langRef.current === 'en' ? 'guess vector' : 'vektor tekaan') : (langRef.current === 'en' ? 'vector' : 'vektor')} (${vectorDx}, ${vectorDy})`, {
          x: (from.x + destination.x) / 2,
          y: (from.y + destination.y) / 2,
        }, { alpha, background: 'rgba(127, 29, 29, 0.86)' });
      } else if (card.type === 'pantulan') {
        const foot = getRrgReflectionFoot(from, card);
        drawReflectionLineGuide(card, alpha);
        if (foot) {
          drawGridLine(from, foot, '#0f766e', { alpha: alpha * 0.78, width: 3, dash: [7, 7] });
          drawPointMarker(foot, '#0f766e', showAnswer ? (langRef.current === 'en' ? 'Equal dist' : 'Jarak sama') : (langRef.current === 'en' ? 'Perp to line' : 'Tegak ke garis'), {
            alpha: alpha * 0.88,
            radius: 5.5,
            labelOffsetY: -26,
            labelBackground: 'rgba(15, 118, 110, 0.9)',
          });
          if (showDestination) {
            drawGridLine(foot, destination, '#0f766e', { alpha: alpha * 0.78, width: 3, dash: [7, 7] });
            drawGridLine(from, destination, '#16a34a', {
              alpha: alpha * 0.55,
              width: 6,
              dash: [14, 12],
              dashOffset: -game.time * 32,
              arrow: true,
              arrowSize: 13,
            });
          }
        }
      } else if (card.type === 'putaran') {
        drawRotationArcGuide(from, card, {
          alpha,
          progress: showDestination ? 1 : 0.86,
          color: '#2563eb',
          signedAngle: isGuess ? getRrgGuessSignedRadians(from, destination, card) : undefined,
          label: isGuess ? (langRef.current === 'en' ? 'guess rotation' : 'putaran tekaan') : undefined,
          dash: mode === 'active' ? [12, 9] : [],
        });
        if (showDestination) {
          drawGridLine({ x: card.cx, y: card.cy }, destination, '#1d4ed8', { alpha: alpha * 0.48, width: 2.6, dash: [6, 7] });
        }
      }
      drawPointMarker(from, '#0f172a', langRef.current === 'en' ? 'Start' : 'Mula', {
        alpha: alpha * 0.9,
        radius: 6.5,
        labelOffsetY: 30,
        labelBackground: 'rgba(15, 23, 42, 0.86)',
      });
      if (showDestination) {
        drawPointMarker(destination, isGuess ? '#f97316' : '#16a34a', `${isGuess ? (langRef.current === 'en' ? 'Choice' : 'Pilihan') : (langRef.current === 'en' ? 'Answer' : 'Jawapan')} (${destination.x}, ${destination.y})`, {
          alpha,
          radius: 8.5,
          labelBackground: isGuess ? 'rgba(249, 115, 22, 0.92)' : 'rgba(22, 163, 74, 0.92)',
        });
      }
    };

    const drawActiveTransformGuide = () => {
      if (!game.card || game.animating) return;
      const player = game.players[game.currentPlayer];
      if (!player) return;
      const pos = gridToPixel(player.x, player.y);
      if (game.card.type === 'translasi') {
        drawGuideLabel(`${langRef.current === 'en' ? 'card vector' : 'vektor kad'} (${game.card.dx}, ${game.card.dy})`, { px: pos.px, py: pos.py }, {
          alpha: 0.74,
          offsetY: -48,
          background: 'rgba(127, 29, 29, 0.86)',
        });
        return;
      }
      if (game.card.type === 'pantulan') {
        drawReflectionLineGuide(game.card, 0.7);
        return;
      }
      if (game.card.type === 'putaran') {
        drawPointMarker({ x: game.card.cx, y: game.card.cy }, '#2563eb', `${langRef.current === 'en' ? 'Center' : 'Pusat'} (${game.card.cx}, ${game.card.cy})`, {
          alpha: 0.76,
          radius: 7,
          labelBackground: 'rgba(37, 99, 235, 0.9)',
        });
      }
    };

    const drawMotionTransformGuides = () => {
      game.players.forEach((player) => {
        const motion = player.motion;
        if (!motion?.card) return;
        drawTransformGuide(motion.from, motion.card, {
          destination: motion.destination,
          mode: motion.previewOnly ? 'guess' : 'motion',
          alpha: 0.72,
        });
      });
    };

    const drawSolutionPreview = () => {
      game.solutionPreview = null;
    };

    const drawMinimap = () => {
      const mW = miniMap.width;
      const mH = miniMap.height;
      mmCtx.clearRect(0, 0, mW, mH);
      const scale = mW / MAP_W;
      
      if (textures.officialBoard && textures.officialBoard.complete && textures.officialBoard.naturalWidth > 0) {
        mmCtx.drawImage(textures.officialBoard, 0, 0, mW, mH);
      } else {
        const miniOcean = mmCtx.createLinearGradient(0, 0, mW, mH);
        miniOcean.addColorStop(0, '#075985');
        miniOcean.addColorStop(0.55, '#0891b2');
        miniOcean.addColorStop(1, '#0e7490');
        mmCtx.fillStyle = miniOcean;
        mmCtx.fillRect(0, 0, mW, mH);
      }

      game.players.forEach((player) => {
        const pos = gridToPixel(player.x, player.y);
        mmCtx.fillStyle = player.finished ? '#22c55e' : player.color;
        mmCtx.beginPath();
        mmCtx.arc(pos.px * scale, pos.py * scale, 4.5, 0, Math.PI * 2);
        mmCtx.fill();
        mmCtx.strokeStyle = '#ffffff';
        mmCtx.lineWidth = 1.2;
        mmCtx.stroke();
      });

      const dpr = window.devicePixelRatio || 1;
      const viewportW = (canvas.width / (dpr * game.zoom)) * scale;
      const viewportH = (canvas.height / (dpr * game.zoom)) * scale;
      const viewportX = (game.camX - (canvas.width / (dpr * game.zoom)) / 2) * scale;
      const viewportY = (game.camY - (canvas.height / (dpr * game.zoom)) / 2) * scale;
      mmCtx.strokeStyle = '#facc15';
      mmCtx.lineWidth = 1.8;
      mmCtx.strokeRect(viewportX, viewportY, viewportW, viewportH);
    };

    const draw = (timestamp) => {
      const dt = Math.min(0.05, (timestamp - game.lastTime) / 1000 || 1 / 60);
      game.lastTime = timestamp;
      game.time += dt;
      const dpr = window.devicePixelRatio || 1;
      const camEase = game.isDragging ? 0.28 : game.animating ? 0.16 : 0.1;
      game.camX += (game.camTargetX - game.camX) * camEase;
      game.camY += (game.camTargetY - game.camY) * camEase;
      let cameraOffsetX = 0;
      let cameraOffsetY = 0;
      if (game.cameraKick) {
        const age = (timestamp - game.cameraKick.startedAt) / game.cameraKick.duration;
        if (age >= 1) {
          game.cameraKick = null;
        } else {
          const power = (1 - age) * game.cameraKick.strength;
          cameraOffsetX = Math.sin(age * 22) * power;
          cameraOffsetY = Math.cos(age * 27) * power * 0.46;
        }
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2 + cameraOffsetX * dpr, canvas.height / 2 + cameraOffsetY * dpr);
      ctx.scale(game.zoom * dpr, game.zoom * dpr);
      ctx.translate(-game.camX, -game.camY);

      // Dynamic Viewport Bounds for Infinite Ocean
      const worldVW = canvas.width / (game.zoom * dpr);
      const worldVH = canvas.height / (game.zoom * dpr);
      const drawX = game.camX - worldVW / 2 - 200;
      const drawY = game.camY - worldVH / 2 - 200;
      const drawW = worldVW + 400;
      const drawH = worldVH + 400;

      // Deep ocean background outside board
      const oceanGrad = ctx.createLinearGradient(drawX, drawY, drawX + drawW, drawY + drawH);
      oceanGrad.addColorStop(0, '#0369a1');
      oceanGrad.addColorStop(0.5, '#0891b2');
      oceanGrad.addColorStop(1, '#0f766e');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(drawX, drawY, drawW, drawH);

      // Layer 1: Gentle moving ocean caustics
      if (textures.water) {
        drawTiledImage(
          textures.water,
          drawX, drawY, drawW, drawH,
          420, 280,
          game.time * 16,
          Math.sin(game.time * 0.7) * 18,
          0.38
        );
      }

      // Draw Official Physical Board Game Artwork
      if (textures.officialBoard && textures.officialBoard.complete && textures.officialBoard.naturalWidth > 0) {
        ctx.save();
        ctx.shadowColor = 'rgba(3, 7, 18, 0.45)';
        ctx.shadowBlur = 36;
        ctx.shadowOffsetY = 16;
        ctx.drawImage(textures.officialBoard, 0, 0, MAP_W, MAP_H);
        ctx.restore();
      } else {
        // Fallback ground while loading
        ctx.fillStyle = '#efd79a';
        ctx.fillRect(0, 0, MAP_W, MAP_H);
      }

      // 1. Living Environmental World Layers over Official Physical Board
      drawLivingWaterfallAndRiver(ctx, game);
      drawLivingBukitKristal(ctx, game);
      drawLivingLighthouse(ctx, game);
      drawLivingFactorySmoke(ctx, game);
      drawLivingClinic(ctx, game);
      drawLivingRescueBoats(ctx, game);
      drawLivingPalmTrees(ctx, game);

      // 2. Living Interactive Collectibles (Diamonds, Chests, Money Bags, Checkpoints)
      drawLivingItems(ctx, game);

      // 3. Interactive Transform Guides
      drawActiveTransformGuide();
      drawMotionTransformGuides();

      // 4. Interactive Click Ripples & Real-time Hover Coordinate Reticle
      drawInteractiveCursorAndRipples(ctx, game);

      if (game.selected) {
        drawSelectedImageToken();
      }
      drawSolutionPreview();

      game.players.forEach((player) => {
        const motion = player.motion;
        if (motion) {
          const finishMotion = () => {
            const onDone = motion.onDone;
            const finalPoint = motion.previewOnly && motion.returnTo ? motion.returnTo : motion.destination;
            player.x = finalPoint.x;
            player.y = finalPoint.y;
            player.drawX = finalPoint.x;
            player.drawY = finalPoint.y;
            player.motion = null;
            player.motionLift = 0;
            player.motionTilt = 0;
            player.motionStretch = 0;
            player.motionTransformRotation = 0;

            // Trigger landing dust puff
            game.effects.push({
              id: Math.random().toString(),
              type: 'dust',
              x: finalPoint.x,
              y: finalPoint.y,
              startedAt: performance.now(),
              color: player.color
            });

            if (onDone) onDone();
          };
          if (motion.mode === 'direct' || motion.mode === 'rotation') {
            const raw = Math.min(1, (timestamp - motion.startedAt) / motion.duration);
            const eased = raw < 0.5
              ? 4 * raw * raw * raw
              : 1 - ((-2 * raw + 2) ** 3) / 2;
            const hop = Math.sin(raw * Math.PI);
            let nextPoint;
            if (motion.mode === 'rotation' && motion.center && motion.radius > 0.05) {
              const angle = motion.startAngle + motion.signedAngle * eased;
              nextPoint = {
                x: motion.center.x + Math.cos(angle) * motion.radius,
                y: motion.center.y + Math.sin(angle) * motion.radius,
              };
              const rawDestination = motion.rawDestination || motion.destination;
              const clamped = rawDestination.x !== motion.destination.x || rawDestination.y !== motion.destination.y;
              if (clamped && raw > 0.9) {
                const blend = (raw - 0.9) / 0.1;
                nextPoint = {
                  x: nextPoint.x + (motion.destination.x - nextPoint.x) * blend,
                  y: nextPoint.y + (motion.destination.y - nextPoint.y) * blend,
                };
              }
              player.motionTransformRotation = -(motion.signedAngle || 0) * eased;
              player.motionTilt = Math.sin(raw * Math.PI * 2) * 0.045;
              player.motionStretch = hop * 0.035;
            } else {
              nextPoint = {
                x: motion.from.x + (motion.to.x - motion.from.x) * eased,
                y: motion.from.y + (motion.to.y - motion.from.y) * eased,
              };
              player.motionTransformRotation = 0;
              player.motionTilt = motion.card?.type === 'pantulan'
                ? Math.sin(raw * Math.PI * 2) * 0.055
                : (motion.pixelVector.x / CELL) * 0.075 * hop;
              player.motionStretch = hop * (motion.card?.type === 'pantulan' ? 0.045 : 0.065);
            }
            player.drawX = nextPoint.x;
            player.drawY = nextPoint.y;
            player.motionLift = hop * (motion.mode === 'rotation' ? 14.5 : motion.card?.type === 'pantulan' ? 12 : 10.5);
            if (player.id === game.players[game.currentPlayer]?.id) {
              const follow = game.gridToPixel(player.drawX, player.drawY);
              game.camTargetX = follow.px + motion.pixelVector.x * 0.14;
              game.camTargetY = follow.py + motion.pixelVector.y * 0.14;
            }
            if (raw >= 1) {
              player.trail.push({ x: motion.destination.x, y: motion.destination.y, time: performance.now() });
              finishMotion();
            }
          } else {
            const raw = Math.min(1, (timestamp - motion.segmentStartedAt) / motion.segmentDuration);
            const eased = raw < 0.5
              ? 4 * raw * raw * raw
              : 1 - ((-2 * raw + 2) ** 3) / 2;
            const hop = Math.sin(raw * Math.PI);
            player.drawX = motion.from.x + (motion.to.x - motion.from.x) * eased;
            player.drawY = motion.from.y + (motion.to.y - motion.from.y) * eased;
            player.motionLift = hop * (motion.diagonal ? 13.5 : 10.8);
            player.motionTilt = (motion.pixelVector.x / CELL) * 0.08 * hop;
            player.motionStretch = hop * (motion.diagonal ? 0.075 : 0.06);
            player.motionTransformRotation = 0;
            if (player.id === game.players[game.currentPlayer]?.id) {
              const follow = game.gridToPixel(player.drawX, player.drawY);
              game.camTargetX = follow.px + motion.pixelVector.x * 0.18;
              game.camTargetY = follow.py + motion.pixelVector.y * 0.18;
            }
            if (raw >= 1) {
              player.trail.push({ x: motion.to.x, y: motion.to.y, time: performance.now() });
              if (motion.segmentIndex >= motion.path.length - 1) {
                finishMotion();
              } else {
                // Trigger intermediate landing dust puff
                game.effects.push({
                  id: Math.random().toString(),
                  type: 'dust',
                  x: motion.to.x,
                  y: motion.to.y,
                  startedAt: performance.now(),
                  color: player.color
                });

                motion.segmentIndex += 1;
                motion.from = motion.to;
                motion.to = motion.path[motion.segmentIndex];
                motion.segmentStartedAt = timestamp;
                motion.segmentDuration = motion.axisStep
                  ? getAxisSegmentDuration(motion.from, motion.to)
                  : getSegmentDuration(motion.from, motion.to, motion.path.length);
                motion.diagonal = motion.from.x !== motion.to.x && motion.from.y !== motion.to.y;
                const fromPixel = game.gridToPixel(motion.from.x, motion.from.y);
                const toPixel = game.gridToPixel(motion.to.x, motion.to.y);
                motion.pixelVector = { x: toPixel.px - fromPixel.px, y: toPixel.py - fromPixel.py };
              }
            }
          }
        } else {
          player.drawX += (player.x - player.drawX) * 0.16;
          player.drawY += (player.y - player.drawY) * 0.16;
          player.motionLift *= 0.72;
          player.motionTilt *= 0.72;
          player.motionStretch *= 0.7;
          player.motionTransformRotation *= 0.72;
        }
        player.trail.forEach((trail) => {
          const age = (performance.now() - trail.time) / 2000;
          if (age > 1) return;
          const pos = gridToPixel(trail.x, trail.y);
          ctx.globalAlpha = 0.3 * (1 - age);
          ctx.fillStyle = player.color;
          ctx.beginPath();
          ctx.arc(pos.px, pos.py, 8 * (1 - age), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      });

      game.players.forEach((player, index) => {
        const offset = RRG_PLAYER_OFFSETS[index % RRG_PLAYER_OFFSETS.length];
        const pos = gridToPixel(player.drawX + offset.x, player.drawY + offset.y);
        const landingAge = player.landingPulseAt ? (timestamp - player.landingPulseAt) / 620 : 99;
        const landingPulse = landingAge >= 0 && landingAge < 1 ? Math.sin((1 - landingAge) * Math.PI) : 0;
        const idleBounce = index === game.currentPlayer ? Math.sin(game.time * 5) * 3 : 0;
        const bounce = idleBounce - (player.motionLift || 0);
        const tokenSize = 19 * (1 + landingPulse * 0.14);
        const motionStretch = player.motionStretch || 0;
        const landingStretch = landingPulse * 0.035;
        const scaleX = 1 + motionStretch + landingStretch;
        const scaleY = Math.max(0.84, 1 - motionStretch * 0.74 - landingStretch * 0.78);
        const shadowScale = Math.max(0.62, 1 - (player.motionLift || 0) / 28 + landingPulse * 0.08);
        const rotation = (player.motionTilt || 0) + (player.motionTransformRotation || 0) + (index === game.currentPlayer ? Math.sin(game.time * 2.8 + index) * 0.01 : 0);
        if (index === game.currentPlayer) {
          ctx.fillStyle = player.color;
          ctx.globalAlpha = 0.08 + Math.sin(game.time * 4) * 0.05;
          ctx.beginPath();
          ctx.ellipse(pos.px, pos.py + 16, 24 + landingPulse * 10, 8 + landingPulse * 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = player.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.4 + Math.sin(game.time * 4) * 0.3;
          ctx.beginPath();
          ctx.arc(pos.px, pos.py + bounce, 28 + landingPulse * 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        if (landingPulse > 0.02) {
          ctx.save();
          ctx.fillStyle = player.color;
          ctx.globalAlpha = 0.08 * landingPulse;
          ctx.beginPath();
          ctx.ellipse(pos.px, pos.py + 16, 18 + (1 - landingAge) * 18, 7 + landingPulse * 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = player.color;
          ctx.globalAlpha = 0.35 * landingPulse;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(pos.px, pos.py + bounce, 20 + (1 - landingAge) * 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        // Penanda Sebenar Pemain: Objek Bentuk 2D Mengikut Koordinat Satah Cartes
        const poly = getPlayerObjectPolygon(player, index, langRef.current);
        if (poly && poly.vertices.length > 0) {
          ctx.save();
          // Lukis bentuk poligon
          ctx.beginPath();
          poly.vertices.forEach((v, vIndex) => {
            const vPos = gridToPixel(v.x, v.y);
            if (vIndex === 0) ctx.moveTo(vPos.px, vPos.py);
            else ctx.lineTo(vPos.px, vPos.py);
          });
          ctx.closePath();
          ctx.fillStyle = player.color + '40';
          ctx.fill();
          ctx.strokeStyle = player.color;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Lukis bucu-bucu (A, B, C...) di atas koordinat satah
          ctx.font = 'bold 10.5px Inter';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          poly.vertices.forEach((v, vIdx) => {
            const vPos = gridToPixel(v.x, v.y);
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(vPos.px, vPos.py, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillText(v.label, vPos.px, vPos.py + 0.5);

            // Pada bucu utama A (vIdx === 0), paparkan lencana nama pemain
            if (vIdx === 0) {
              ctx.save();
              ctx.font = 'bold 11px Inter';
              const displayName = getPlayerDisplayName(player, langRef.current);
              const textWidth = ctx.measureText(displayName).width;
              const badgeWidth = textWidth + 16;
              ctx.fillStyle = player.color;
              ctx.beginPath();
              ctx.roundRect(vPos.px - badgeWidth / 2, vPos.py - 26, badgeWidth, 18, 4);
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
              ctx.fillStyle = '#ffffff';
              ctx.fillText(displayName, vPos.px, vPos.py - 17);
              ctx.restore();
            }
          });
          ctx.restore();
        }
      });

      // Lukis Imej Hasil Transformasi (A', B', C'...) bila ada kad aktif
      const activePlayerObj = game.players[game.currentPlayer];
      const activePoly = getPlayerObjectPolygon(activePlayerObj, game.currentPlayer, langRef.current);
      const targetPoly = getTransformedPolygon(activePoly, game.card, langRef.current);
      if (targetPoly && targetPoly.vertices.length > 0) {
        ctx.save();
        ctx.beginPath();
        targetPoly.vertices.forEach((v, vIndex) => {
          const vPos = gridToPixel(v.x, v.y);
          if (vIndex === 0) ctx.moveTo(vPos.px, vPos.py);
          else ctx.lineTo(vPos.px, vPos.py);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(37, 99, 235, 0.22)';
        ctx.fill();
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        targetPoly.vertices.forEach((v) => {
          const vPos = gridToPixel(v.x, v.y);
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.arc(vPos.px, vPos.py, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.fillText(v.label, vPos.px, vPos.py + 0.5);
        });
        ctx.restore();
      }

      game.effects = game.effects.filter((effect) => performance.now() - effect.startedAt < 950);
      game.effects.forEach((effect) => {
        const age = (performance.now() - effect.startedAt) / 950;
        const pos = gridToPixel(effect.x, effect.y);
        if (effect.type === 'boom') {
          ctx.globalAlpha = 1 - age;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(pos.px, pos.py, 16 + age * 46, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.font = `${34 + age * 24}px serif`;
          ctx.fillText('💥', pos.px, pos.py);
        } else if (effect.type === 'coin') {
          ctx.globalAlpha = 1 - age;
          ctx.font = `${24 + age * 20}px serif`;
          ctx.fillText('💰', pos.px, pos.py - age * 40);
        } else if (effect.type === 'wrong') {
          ctx.globalAlpha = 1 - age;
          ctx.font = `${24 + age * 18}px serif`;
          ctx.fillText('❌', pos.px, pos.py - age * 26);
        } else if (effect.type === 'dust') {
          ctx.globalAlpha = 1 - age;
          ctx.strokeStyle = effect.color || 'rgba(214,168,107,0.8)';
          ctx.lineWidth = 2.5 * (1 - age);
          ctx.beginPath();
          ctx.ellipse(pos.px, pos.py + 12, 10 + age * 18, 4 + age * 8, 0, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.fillStyle = 'rgba(224,185,125,0.7)';
          for (let j = 0; j < 6; j++) {
            const angle = j * (Math.PI * 2 / 6);
            const dist = age * 24;
            const px = pos.px + Math.cos(angle) * dist;
            const py = pos.py + 12 + Math.sin(angle) * dist * 0.4 - age * 8;
            ctx.beginPath();
            ctx.arc(px, py, 2.5 * (1 - age), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      });

      ctx.font = 'bold 16px Inter';
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.textAlign = 'center';
      const safeZoneLabel = langRef.current === 'en' ? 'SAFE ZONE' : 'ZON SELAMAT';
      ctx.fillText(safeZoneLabel, gridToPixel(0, 15).px, gridToPixel(0, 15).py - 10);
      ctx.fillText(safeZoneLabel, gridToPixel(0, -15).px, gridToPixel(0, -15).py + 20);

      // --- ULTRA-REALISTIC DRIFTING CLOUDS (High-altitude) ---
      ctx.save();
      ctx.globalAlpha = 0.55; // Increase alpha since screen blending softens it
      ctx.globalCompositeOperation = 'screen'; // Automatically removes the black background!
      for (let i = 0; i < numClouds; i++) {
        const speedX = 9 + (i % 2) * 4;
        const speedY = 5 + (i % 3) * 2;
        const cx = ((game.time * speedX + i * 260) % (MAP_W + 1200)) - 600;
        const cy = ((game.time * speedY + i * 190) % (MAP_H + 1200)) - 600;
        
        const cWidth = 140 + (i % 3) * 50;
        const cHeight = 140 + (i % 3) * 50;
        
        // Draw the photorealistic AI cloud!
        if (textures.cloud && textures.cloud.complete && textures.cloud.naturalHeight !== 0) {
          ctx.drawImage(textures.cloud, cx, cy, cWidth, cHeight);
        } else {
          // Fallback if not loaded yet
          const grad = ctx.createRadialGradient(cx + cWidth/2, cy + cHeight/2, 0, cx + cWidth/2, cy + cHeight/2, cWidth/2);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(cx + cWidth/2, cy + cHeight/2, cWidth/2, cHeight/3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.restore(); // restores camera translate

      // --- CINEMATIC VIGNETTE & AMBIENT GLOW (Screen Space) ---
      ctx.save();
      const vigGrad = ctx.createRadialGradient(
        canvas.width / 2, 
        canvas.height / 2, 
        Math.min(canvas.width, canvas.height) * 0.42, 
        canvas.width / 2, 
        canvas.height / 2, 
        Math.max(canvas.width, canvas.height) * 0.78
      );
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vigGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.08)');
      vigGrad.addColorStop(1, 'rgba(8, 15, 30, 0.38)'); // rich dark slate cinematic edge
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      drawMinimap();
      game.raf = window.requestAnimationFrame(draw);
    };
    game.raf = window.requestAnimationFrame(draw);

    return () => {
      window.clearTimeout(game.popupTimer);
      window.clearTimeout(game.drawCardTimer);
      window.clearTimeout(game.rollTimer);
      if (game.raf) window.cancelAnimationFrame(game.raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [resetTrigger, getAxisSegmentDuration, getSegmentDuration, makePlayers, showPopup, submitAnswer, syncHud]);

  const handleRestartGame = () => {
    const confirmText = lang === 'en'
      ? "Are you sure you want to restart the game? All ongoing game data will be cleared."
      : "Adakah anda pasti mahu memulakan semula permainan? Semua data yang belum tamat akan dipadam.";
    if (window.confirm(confirmText)) {
      const saveKey = `rrg_save_${sessionUser?.uid || 'guest'}`;
      localStorage.removeItem(saveKey);
      localStorage.removeItem('rrg_save');
      setResetTrigger(prev => prev + 1);
    }
  };

  const handleZoomIn = () => {
    if (!gameRef.current) return;
    const g = gameRef.current;
    g.zoom = Math.min(3.0, g.zoom * 1.25);
  };

  const handleZoomOut = () => {
    if (!gameRef.current) return;
    const g = gameRef.current;
    const rect = g.canvas?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth || 1200;
    const h = rect?.height || (window.innerHeight - 120) || 600;
    const fitZ = Math.min(w / 2758, h / 2758) * 0.94;
    const minZ = Math.min(0.08, fitZ * 0.6);
    g.zoom = Math.max(minZ, g.zoom / 1.25);
  };

  const handleFitFullMap = () => {
    if (!gameRef.current) return;
    const g = gameRef.current;
    const rect = g.canvas?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth || 1200;
    const h = rect?.height || (window.innerHeight - 120) || 600;
    const fitZ = Math.min(w / 2758, h / 2758) * 0.94;
    g.zoom = fitZ;
    g.camTargetX = 1376.0;
    g.camTargetY = 1376.0;
  };

  const handleFocusPlayer = () => {
    if (!gameRef.current) return;
    const g = gameRef.current;
    const p = g.players[g.currentPlayer];
    if (p) {
      centerOnPlayer(g, p);
      const rect = g.canvas?.getBoundingClientRect();
      const h = rect?.height || 600;
      const fitZ = Math.min((rect?.width || 1200) / 2758, h / 2758) * 0.94;
      g.zoom = Math.max(fitZ * 1.8, 0.45);
    }
  };

  const handleMinimapClick = (event) => {
    if (!gameRef.current || !miniMapRef.current) return;
    const rect = miniMapRef.current.getBoundingClientRect();
    const clickX = (event.clientX - rect.left) / rect.width;
    const clickY = (event.clientY - rect.top) / rect.height;
    gameRef.current.camTargetX = clickX * 2758;
    gameRef.current.camTargetY = clickY * 2758;
  };

  const activePlayer = hud.players[hud.currentPlayer];
  const activePlayerDisplayName = getPlayerDisplayName(activePlayer, lang);
  const diceLabel = hud.diceRolling
    ? (lang === 'en' ? `${hud.dice?.symbol || '🎲'} Choosing color...` : `${hud.dice?.symbol || '🎲'} Memilih warna...`)
    : hud.dice
    ? `${hud.dice.symbol} ${lang === 'en' ? (hud.dice.label_en || hud.dice.label) : hud.dice.label}`
    : (lang === 'en' ? 'Not rolled' : 'Belum roll');

  return (
    <div className="rrg-canvas-game">
      <canvas ref={canvasRef} className="rrg-game-canvas" aria-label="Running Rangers Game digital canvas" />
      <div className="rrg-game-hud">
        <div className="rrg-hud-left">
          <div className="rrg-title-bar">🏝️ RRG — {lang === 'en' ? 'DREAM ISLAND' : 'PULAU IDAMAN'}</div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <button
              type="button"
              onClick={handleFitFullMap}
              className="text-xs bg-indigo-600/90 hover:bg-indigo-600 text-white px-2.5 py-1.5 rounded shadow-sm font-bold transition flex items-center gap-1"
              title={lang === 'en' ? 'Fit and view whole board' : 'Muat dan lihat keseluruhan papan'}
            >
              <Maximize className="w-3.5 h-3.5" /> {lang === 'en' ? 'Full Board' : 'Peta Penuh'}
            </button>
            <button
              type="button"
              onClick={handleFocusPlayer}
              className="text-xs bg-slate-700/90 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded shadow-sm font-bold transition flex items-center gap-1"
              title={lang === 'en' ? 'Focus current player' : 'Fokus pemain semasa'}
            >
              📍 {lang === 'en' ? 'Focus Player' : 'Fokus Pemain'}
            </button>
            <button
              type="button"
              onClick={handleRestartGame}
              className="text-xs bg-red-500/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded shadow-sm font-bold transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> {lang === 'en' ? 'Restart' : 'Mula Semula'}
            </button>
          </div>
        </div>
        <div className="rrg-hud-right">
          <div className="rrg-hud-panel"><span>{lang === 'en' ? 'Current Turn' : 'Giliran Semasa'}</span><b>{activePlayerDisplayName || (lang === 'en' ? 'Player 1' : 'Pemain 1')}</b></div>
          <label className="rrg-hud-panel rrg-player-hud-control">
            <span>{lang === 'en' ? 'Players' : 'Bil. Pemain'}</span>
            <select value={playerCount} onChange={updatePlayerCount} disabled={hud.animating} aria-label={lang === 'en' ? 'Number of players' : 'Bilangan pemain'}>
              {[2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} {lang === 'en' ? 'Players' : 'Pemain'}</option>)}
            </select>
          </label>
          <div className="rrg-hud-panel"><span>{lang === 'en' ? 'Cash' : 'Wang'}</span><b>RM{activePlayer?.score ?? 0}</b></div>
          <div className="rrg-hud-panel"><span>{lang === 'en' ? 'Position' : 'Posisi'}</span><b>({activePlayer?.x ?? 0}, {activePlayer?.y ?? 0})</b></div>
        </div>
      </div>
      <div className={`rrg-turn-indicator ${hud.animating ? 'animating' : ''}`}>
        {hud.players.map((player, index) => <span key={player.id} className={`rrg-turn-dot ${hud.currentPlayer === index ? 'active' : ''}`} style={{ background: player.finished ? '#22c55e' : player.color, color: player.color }} />)}
        <b>{hud.gameOver ? (lang === 'en' ? 'Game Over' : 'Game tamat') : `${activePlayerDisplayName || (lang === 'en' ? 'Player' : 'Pemain')} ${lang === 'en' ? 'is playing' : 'sedang bermain'}`}</b>
      </div>
      <div className="rrg-card-panel">
        <div className="rrg-card-title">{lang === 'en' ? 'Transformation Card' : 'Kad Transformasi'}</div>
        <div className={`rrg-card-dice ${hud.diceRolling ? 'rolling' : ''}`}>{diceLabel}</div>
        <h3>{hud.card ? getRrgCardTitle(hud.card, lang) : (lang === 'en' ? 'Roll color dice' : 'Roll dadu warna')}</h3>
        <p>{hud.card ? getRrgCardText(hud.card, lang) : hud.message}</p>
        {hud.card && (
          <div className="mt-2">
            <RRGCardVisual
              card={hud.card}
              lang={lang}
              className="rrg-current-card-img"
              onClick={() => setZoomedCard(hud.card)}
            />
            <button
              type="button"
              onClick={() => setZoomedCard(hud.card)}
              className="mt-1 text-[11px] text-blue-300 hover:text-white underline font-semibold flex items-center gap-1 transition"
            >
              🔍 {lang === 'en' ? 'Click card to enlarge' : 'Klik kad untuk besarkan'}
            </button>
          </div>
        )}
        
        {(() => {
          const activePoly = getPlayerObjectPolygon(activePlayer, hud.currentPlayer, lang);
          const targetPoly = getTransformedPolygon(activePoly, hud.card, lang);
          if (!activePoly) return null;
          return (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-900/90 text-white border border-blue-400/40 text-xs">
              <p className="font-extrabold text-blue-300 uppercase tracking-wide text-[10px]">📐 {lang === 'en' ? '2D Marker' : 'Penanda 2D'}: <span className="text-white font-bold">{activePoly.name}</span></p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {activePoly.vertices.map(v => (
                  <span key={v.label} className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-200 text-[10px] font-mono font-bold border border-slate-700">
                    {v.label}({v.x},{v.y})
                  </span>
                ))}
              </div>
              {targetPoly && (
                <div className="mt-2 pt-2 border-t border-slate-700/80">
                  <p className="font-extrabold text-amber-300 uppercase tracking-wide text-[10px]">{lang === 'en' ? 'Transformed Image (Cartesian Plane):' : 'Imej Transformasi (Satah Cartes):'}</p>
                  <div className="space-y-1 mt-1 max-h-28 overflow-y-auto pr-1">
                    {activePoly.vertices.map((v, i) => {
                      const tv = targetPoly.vertices[i];
                      return (
                        <div key={v.label} className="flex items-center justify-between font-mono text-[10px] bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700">
                          <span className="text-slate-300">{v.label}({v.x},{v.y})</span>
                          <span className="text-amber-400">➔</span>
                          <span className="text-blue-300 font-bold">{tv.label}({tv.x},{tv.y})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {!hud.card && hud.lastActionCard && (
          <div className="rrg-last-card cursor-pointer" onClick={() => setZoomedCard(hud.lastActionCard)}>
            <span>{lang === 'en' ? 'Last item card' : 'Kad item terakhir'}</span>
            <RRGCardVisual card={hud.lastActionCard} lang={lang} isThumbnail />
          </div>
        )}
        {hud.selected && <div className="rrg-selected-coord">{lang === 'en' ? 'Selection' : 'Pilihan'}: ({hud.selected.x}, {hud.selected.y})</div>}
        {hud.hintLevel > 0 && <div className="rrg-selected-coord hint">Hint {hud.hintLevel}: {hud.message}</div>}
      </div>
      <div className="rrg-deck-rack" aria-label={lang === 'en' ? 'RRGs Card Decks' : 'Deck kad RRGs'}>
        {[
          { deck: 'merah', label: lang === 'en' ? 'Translation' : 'Translasi' },
          { deck: 'hijau', label: lang === 'en' ? 'Reflection' : 'Pantulan' },
          { deck: 'biru', label: lang === 'en' ? 'Rotation' : 'Putaran' },
          { deck: 'kuning', label: lang === 'en' ? 'Reward' : 'Ganjaran' },
          { deck: 'hitam', label: lang === 'en' ? 'Penalty' : 'Denda' },
        ].map(item => (
          <div key={item.deck} className={`rrg-deck-stack rrg-deck-${item.deck}`}>
            <img src={RRG_CARD_IMAGE(item.deck, 1)} alt={`Deck ${item.label}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      {hud.drawCard && (
        <div key={hud.drawCard.token} className={`rrg-card-flight rrg-deck-${hud.drawCard.deckKey}`}>
          <RRGCardVisual card={hud.drawCard.card} lang={lang} />
        </div>
      )}
      <div className="rrg-dice-panel rrg-transform-actions">
        <button type="button" className={hud.diceRolling ? 'roll-active' : ''} onClick={rollDice} disabled={!!hud.card || hud.gameOver || hud.animating}>🎲 {lang === 'en' ? 'Roll Color' : 'Roll Warna'}</button>
        <button type="button" onClick={buyHint} disabled={!hud.card || hud.hintLevel >= 2 || hud.gameOver || hud.animating || (activePlayer?.score ?? 0) < HINT_COST}>💡 Hint RM{HINT_COST}</button>
        <button type="button" onClick={submitAnswer} disabled={!hud.card || !hud.selected || hud.gameOver || hud.animating}>✅ {lang === 'en' ? 'Check' : 'Semak'}</button>
        <button type="button" onClick={() => resetGame()} disabled={hud.animating}>↻ Reset</button>
      </div>
      <div className="rrg-view-controls">
        <button type="button" onClick={handleZoomIn} title={lang === 'en' ? 'Zoom In' : 'Zum Masuk'}>
          <ZoomIn className="w-4 h-4" />
        </button>
        <button type="button" onClick={handleZoomOut} title={lang === 'en' ? 'Zoom Out' : 'Zum Keluar'}>
          <ZoomOut className="w-4 h-4" />
        </button>
        <button type="button" onClick={handleFitFullMap} title={lang === 'en' ? 'Fit Whole Map' : 'Lihat Keseluruhan Peta'}>
          <Maximize className="w-4 h-4" />
        </button>
      </div>
      <div
        className="rrg-minimap"
        onClick={handleMinimapClick}
        title={lang === 'en' ? 'Click minimap to jump camera' : 'Klik minimap untuk navigasi kamera'}
      >
        <canvas ref={miniMapRef} width="140" height="140" />
      </div>
      <div className="rrg-controls-hint">
        <span><kbd>Click</kbd> {lang === 'en' ? 'Select coord' : 'Pilih koordinat'}</span>
        <span><kbd>WASD</kbd> {lang === 'en' ? 'Adjust selection' : 'Laras pilihan'}</span>
        <span><kbd>Enter</kbd> {lang === 'en' ? 'Check' : 'Semak'}</span>
        <span><kbd>{lang === 'en' ? 'White' : 'Putih'}</kbd> {lang === 'en' ? 'Object' : 'Objek'}</span>
        <span><kbd>{lang === 'en' ? 'Blue' : 'Biru'}</kbd> {lang === 'en' ? 'Image' : 'Imej'}</span>
        <span><kbd>Scroll</kbd> Zoom</span>
        <span><kbd>Drag</kbd> Pan</span>
      </div>
      {hud.popup && (
        <div className="rrg-message-popup show">
          <div className="rrg-popup-emoji">{hud.popup.emoji}</div>
          <h3>{hud.popup.title}</h3>
          <p>{hud.popup.text}</p>
        </div>
      )}
      {zoomedCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setZoomedCard(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold p-1 rounded-lg bg-slate-800"
              onClick={() => setZoomedCard(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="text-lg font-black text-amber-400 mb-3 tracking-wide">
              {getRrgCardTitle(zoomedCard, lang)}
            </h3>
            <div className="w-[180px] my-2">
              <RRGCardVisual card={zoomedCard} lang={lang} className="w-full" />
            </div>
            <div className="mt-4 p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 w-full text-center">
              <p className="text-sm font-semibold text-blue-200 mb-1.5">
                {getRrgCardText(zoomedCard, lang)}
              </p>
              <p className="text-xs text-slate-400">
                {lang === 'en'
                  ? 'Identify the transformation rule and select your target coordinate on the grid.'
                  : 'Kenal pasti peraturan transformasi dan klik koordinat sasaran pada grid.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setZoomedCard(null)}
              className="mt-4 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm text-white shadow-lg transition"
            >
              {lang === 'en' ? 'Got It' : 'Faham'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const USERS_STORAGE_KEY = 'fyp_math_registered_users';

const readStoredUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveStoredUsers = (users) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const getFirebaseAuthMessage = (error) => {
  const code = error?.code || '';
  if (code === 'auth/email-already-in-use') return 'Emel ini sudah didaftarkan dalam Firebase. Sila login atau guna emel lain.';
  if (code === 'auth/invalid-email') return 'Format emel tidak sah.';
  if (code === 'auth/weak-password') return 'Kata laluan terlalu lemah. Guna sekurang-kurangnya 6 aksara.';
  if (code === 'auth/operation-not-allowed') return 'Email/Password belum di-enable di Firebase Authentication. Enable dan klik Save dahulu.';
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') return 'Emel atau kata laluan tidak betul.';
  if (code === 'auth/network-request-failed') return 'Sambungan internet/Firebase gagal. Cuba semula.';
  if (code === 'auth/too-many-requests') return 'Terlalu banyak percubaan. Tunggu sekejap sebelum cuba lagi.';
  if (code === 'auth/unauthorized-domain') return 'Domain website belum authorized dalam Firebase Authentication settings.';
  if (code === 'permission-denied') return 'Firestore menolak akses. Pergi ke Firebase Console > Firestore Database > Rules, tukar kepada "allow read, write: if true;" dan tekan Publish.';
  if (code === 'failed-precondition') return 'Firestore Database belum siap. Pergi Firestore Database dan klik Create database.';
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'Firestore/Firebase lambat atau tidak dapat dicapai. Cuba semula sebentar lagi.';
  return 'Firebase error: ' + (code || 'unknown') + '. ' + (error?.message || 'Semak Authentication dan Firestore.');
};

const LoginPage = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loginData, setLoginData] = useState(() => ({ email: localStorage.getItem('rrg_remembered_email') || '', password: '' }));
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [rememberLogin, setRememberLogin] = useState(() => Boolean(localStorage.getItem('rrg_remembered_email')));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDisplayName = (email) => {
    const prefix = email.split('@')[0] || 'Pelajar';
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  const updateRememberedEmail = (email) => {
    if (rememberLogin) localStorage.setItem('rrg_remembered_email', email);
    else localStorage.removeItem('rrg_remembered_email');
  };

  const handleLocalLogin = (email, password) => {
    const users = readStoredUsers();
    const user = users.find((item) => item.email === email && item.password === password);

    if (!user) {
      setError('Emel atau kata laluan tidak betul. Jika belum ada akaun, sila daftar dahulu.');
      return;
    }

    saveStoredUsers(users.map((item) => item.email === email ? { ...item, lastLoginAt: new Date().toISOString() } : item));
    updateRememberedEmail(email);
    onLogin({ name: user.name || getDisplayName(email), email: user.email, role: 'Pelajar', database: 'localStorage' });
  };

  const handleFirebaseLogin = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await credential.user.reload();

    const profileRef = doc(db, 'users', credential.user.uid);
    const profileSnap = await getDoc(profileRef);
    const profile = profileSnap.exists() ? profileSnap.data() : {};
    const name = profile.name || credential.user.displayName || getDisplayName(email);
    
    const isAdminEmail = email.toLowerCase() === 'zaimshahbudin@gmail.com' || email.toLowerCase() === 'ahmadzaim2021@gmail.com' || profile.role === 'admin';

    if (!credential.user.emailVerified && !isAdminEmail) {
      setError('Emel belum disahkan. Sila buka inbox emel anda dan klik link verification daripada Firebase.');
      return;
    }
    const role = isAdminEmail ? 'admin' : (profile.role || 'Pelajar');
    const isApproved = isAdminEmail ? true : (profile.isApproved === true);

    if (role !== 'admin' && isApproved !== true) {
      await auth.signOut();
      setError('Akaun anda sedang diproses. Sila tunggu kelulusan cikgu untuk mula bermain.');
      return;
    }

    await setDoc(profileRef, {
      name,
      email,
      role,
      isApproved,
      emailVerified: true,
      lastLoginAt: serverTimestamp(),
    }, { merge: true });

    updateRememberedEmail(email);
    onLogin({ uid: credential.user.uid, name, email, role, database: 'firebase' });
  };

  const handleForgotPassword = async () => {
    const email = normalizeEmail(loginData.email);
    if (!email) {
      setError('Masukkan emel dahulu sebelum reset kata laluan.');
      return;
    }
    if (!isFirebaseConfigured) {
      setError('Reset kata laluan hanya tersedia selepas Firebase aktif.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Link reset kata laluan sudah dihantar. Sila semak inbox emel anda.');
    } catch (firebaseError) {
      setError(getFirebaseAuthMessage(firebaseError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const email = normalizeEmail(loginData.email);
    const password = loginData.password;

    if (!email || !password.trim()) {
      setError('Masukkan emel dan kata laluan dahulu.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (isFirebaseConfigured) await handleFirebaseLogin(email, password);
      else handleLocalLogin(email, password);
    } catch (firebaseError) {
      setError(getFirebaseAuthMessage(firebaseError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocalRegister = (name, email, password) => {
    const users = readStoredUsers();
    const alreadyExists = users.some((user) => user.email === email);

    if (alreadyExists) {
      setError('Emel ini sudah didaftarkan. Sila login atau guna emel lain.');
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };

    saveStoredUsers([...users, newUser]);
    setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
    setLoginData({ email, password: '' });
    setSuccess('Akaun berjaya didaftarkan dalam database browser. Sila login dengan emel dan kata laluan tadi.');
    setError('');
    setIsRegister(false);
  };

  const handleFirebaseRegister = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    try { await sendEmailVerification(credential.user); } catch (e) { console.warn("Email verification failed to send", e); }
    
    const isAdminEmail = email.toLowerCase() === 'zaimshahbudin@gmail.com' || email.toLowerCase() === 'ahmadzaim2021@gmail.com';
    await setDoc(doc(db, 'users', credential.user.uid), {
      name,
      email,
      role: isAdminEmail ? 'admin' : 'Pelajar',
      isApproved: isAdminEmail ? true : false,
      emailVerified: false,
      createdAt: serverTimestamp(),
      lastLoginAt: null,
    });

    setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
    setLoginData({ email, password: '' });
    setSuccess(isAdminEmail ? 'Akaun Admin berjaya didaftarkan! Sila log masuk.' : 'Akaun berjaya didaftarkan. Sila tunggu kelulusan cikgu sebelum anda boleh log masuk.');
    setError('');
    setIsRegister(false);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const name = registerData.name.trim();
    const email = normalizeEmail(registerData.email);
    const password = registerData.password;

    if (!name || !email || !password.trim() || !registerData.confirmPassword.trim()) {
      setError('Lengkapkan semua maklumat pendaftaran.');
      return;
    }
    if (password.length < 6) {
      setError('Kata laluan mesti sekurang-kurangnya 6 aksara.');
      return;
    }
    if (password !== registerData.confirmPassword) {
      setError('Kata laluan dan pengesahan kata laluan tidak sama.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (isFirebaseConfigured) await handleFirebaseRegister(name, email, password);
      else handleLocalRegister(name, email, password);
    } catch (firebaseError) {
      setError(getFirebaseAuthMessage(firebaseError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showLogin = () => { setIsRegister(false); setError(''); setSuccess(''); };
  const showRegister = () => { setIsRegister(true); setError(''); setSuccess(''); };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center px-5 py-8">
      <video className="auth-bg-video" autoPlay muted loop playsInline aria-hidden="true">
        <source src="/assets/auth/transformasi-bg.mp4" type="video/mp4" />
      </video>
      <div className="auth-bg-wash" aria-hidden="true" />
      <div className={`auth-container ${isRegister ? 'active' : ''}`}>
        <div className="auth-form-box auth-login-box">
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-brand">
              <Calculator className="w-6 h-6" />
              <span>Transformasi Isometri</span>
              <small className="auth-db-pill">{isFirebaseConfigured ? 'Firebase' : 'Demo DB'}</small>
            </div>
            <h1>Login Here</h1>
            <p className="auth-subtitle">Masuk untuk sambung nota, kuiz dan misi RRG anda.</p>

            <div className="auth-input-group">
              <input
                type="email"
                placeholder="Alamat emel"
                value={loginData.email}
                onChange={(event) => { setLoginData({ ...loginData, email: event.target.value }); setError(''); }}
                required
              />
            </div>
            <div className="auth-input-group">
              <input
                type="password"
                placeholder="Kata laluan"
                minLength="6"
                value={loginData.password}
                onChange={(event) => { setLoginData({ ...loginData, password: event.target.value }); setError(''); }}
                required
              />
            </div>

            <div className="auth-option-row">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={rememberLogin}
                  onChange={(event) => setRememberLogin(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button type="button" className="auth-link-button" onClick={handleForgotPassword}>Forgot password?</button>
            </div>
            {error && !isRegister && <p className="auth-error">{error}</p>}
            {success && !isRegister && <p className="auth-success">{success}</p>}
            <button type="submit" className="auth-primary-button" disabled={isSubmitting}>{isSubmitting && !isRegister ? 'Memproses...' : 'Login'}</button>
            <p className="auth-mobile-switch">
              Belum ada akaun? <button type="button" onClick={showRegister}>Daftar</button>
            </p>
          </form>
        </div>

        <div className="auth-form-box auth-register-box">
          <form onSubmit={handleRegister} className="auth-form">
            <div className="auth-brand">
              <ShieldCheck className="w-6 h-6" />
              <span>Akaun Pelajar</span>
              <small className="auth-db-pill">{isFirebaseConfigured ? 'Firebase' : 'Demo DB'}</small>
            </div>
            <h1>Register Here</h1>
            <p className="auth-subtitle">{isFirebaseConfigured ? 'Cipta akaun baru dan sahkan emel sebelum login.' : 'Cipta akaun demo dalam browser peranti ini.'}</p>

            <div className="auth-input-group">
              <input
                type="text"
                placeholder="Nama penuh"
                value={registerData.name}
                onChange={(event) => { setRegisterData({ ...registerData, name: event.target.value }); setError(''); }}
                required
              />
            </div>
            <div className="auth-input-group">
              <input
                type="email"
                placeholder="Alamat emel"
                value={registerData.email}
                onChange={(event) => { setRegisterData({ ...registerData, email: event.target.value }); setError(''); }}
                required
              />
            </div>
            <div className="auth-input-group">
              <input
                type="password"
                placeholder="Kata laluan"
                minLength="6"
                value={registerData.password}
                onChange={(event) => { setRegisterData({ ...registerData, password: event.target.value }); setError(''); }}
                required
              />
            </div>
            <div className="auth-input-group">
              <input
                type="password"
                placeholder="Sahkan kata laluan"
                minLength="6"
                value={registerData.confirmPassword}
                onChange={(event) => { setRegisterData({ ...registerData, confirmPassword: event.target.value }); setError(''); }}
                required
              />
            </div>

            {error && isRegister && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-primary-button" disabled={isSubmitting}>{isSubmitting && isRegister ? 'Mendaftar...' : 'Register'}</button>

            <div className="auth-divider"><span>or register with</span></div>
            <div className="auth-social-row" aria-label="Social register options">
              <span aria-hidden="true">f</span>
              <span aria-hidden="true">G</span>
              <span aria-hidden="true">in</span>
            </div>

            <p className="auth-mobile-switch">
              Dah ada akaun? <button type="button" onClick={showLogin}>Login</button>
            </p>
          </form>
        </div>

        <div className="auth-overlay">
          <video className="auth-overlay-video" autoPlay muted loop playsInline aria-hidden="true">
            <source src="/assets/auth/transformasi-bg.mp4" type="video/mp4" />
          </video>
          <div className="auth-overlay-content">
            <div className="auth-overlay-icon">
              {isRegister ? <LogIn className="w-7 h-7" /> : <UserRound className="w-7 h-7" />}
            </div>
            <h2>{isRegister ? 'Welcome Back' : 'Start Your Journey Now'}</h2>
            <p>
              {isRegister
                ? 'Login semula untuk memulakan permainan. Akaun anda memerlukan kelulusan admin.'
                : 'Daftar akaun pelajar untuk bermain. Anda perlu menunggu kelulusan admin selepas mendaftar.'}
            </p>
            <button type="button" className="auth-ghost-button" onClick={isRegister ? showLogin : showRegister}>
              {isRegister ? 'Login Sekarang' : 'Daftar Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// KOMPONEN UTAMA (PENYATUAN)
// =====================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState('nota');
  const [lang, setLang] = useState('ms'); // 'ms' untuk Bahasa Melayu, 'en' untuk English
  const [sessionUser, setSessionUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setSessionLoading(false);
      return;
    }
    const unsubscribe = subscribeToAuth(async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists() && userDoc.data().isApproved) {
            setSessionUser({ ...userDoc.data(), uid: user.uid });
          } else {
            setSessionUser(null);
          }
        } catch (e) {
          console.error("Error fetching user session:", e);
          setSessionUser(null);
        }
      } else {
        setSessionUser(null);
      }
    setSessionLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setSessionUser(null);
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  if (sessionLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  }

  if (!sessionUser) {
    return <LoginPage onLogin={setSessionUser} />;
  }

  return (
    <div className={`apple-page bg-slate-50 text-slate-800 font-sans relative scroll-smooth ${activeTab === 'rrgs' ? 'pb-0 h-screen overflow-hidden' : 'pb-12 min-h-screen'}`}>
      
      {/* HEADER & NAVIGASI STICKY */}
      <header className="sticky top-0 z-50 bg-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.png" alt="Logo" className="h-12 w-auto object-contain drop-shadow-lg scale-125 ml-2 mr-1" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">{lang === 'en' ? 'Isometric Transformations' : 'Transformasi Isometri'}</h1>
                <span className="text-blue-200 text-xs tracking-wider uppercase font-semibold">{lang === 'en' ? 'Form 2 Mathematics - Chapter 11' : 'Matematik Tingkatan 2 - Bab 11'}</span>
              </div>
            </div>
            {/* Butang Dwibahasa untuk paparan peranti kecil (Mobile) */}
            <div className="md:hidden flex bg-blue-900/40 p-1 rounded-full backdrop-blur-sm">
              <button onClick={() => setLang('ms')} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === 'ms' ? 'bg-white text-blue-800 shadow' : 'text-blue-200 hover:bg-blue-800'}`}>BM</button>
              <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-blue-800 shadow' : 'text-blue-200 hover:bg-blue-800'}`}>EN</button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:flex-1 justify-between md:justify-end">
            <nav className={`grid ${sessionUser.role === 'admin' ? 'grid-cols-5' : 'grid-cols-4'} flex-1 min-w-0 gap-1 bg-blue-800/50 p-1 rounded-full backdrop-blur-sm`}>
              <button 
                onClick={() => setActiveTab('nota')}
                className={`w-full justify-center px-2 sm:px-4 md:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'nota' ? 'bg-white text-blue-700 shadow-md' : 'text-blue-100 hover:bg-blue-600/50'}`}
              >
                <BookOpen className="w-4 h-4 shrink-0"/> {lang === 'en' ? 'Notes' : 'Nota'}
              </button>
              <button 
                onClick={() => setActiveTab('makmal')}
                className={`w-full justify-center px-2 sm:px-4 md:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'makmal' ? 'bg-white text-blue-700 shadow-md' : 'text-blue-100 hover:bg-blue-600/50'}`}
              >
                <InfinityIcon className="w-4 h-4 shrink-0"/> {lang === 'en' ? 'Lab' : 'Makmal'}
              </button>
              <button 
                onClick={() => setActiveTab('kuiz')}
                className={`w-full justify-center px-2 sm:px-4 md:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'kuiz' ? 'bg-white text-blue-700 shadow-md' : 'text-blue-100 hover:bg-blue-600/50'}`}
              >
                <Trophy className="w-4 h-4 shrink-0"/> {lang === 'en' ? 'Quiz' : 'Kuiz'}
              </button>
              <button 
                onClick={() => setActiveTab('rrgs')}
                className={`w-full justify-center px-2 sm:px-4 md:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'rrgs' ? 'bg-white text-blue-700 shadow-md' : 'text-blue-100 hover:bg-blue-600/50'}`}
              >
                <Shapes className="w-4 h-4 shrink-0"/> RRGs
              </button>
              {sessionUser.role === 'admin' && (
                <button 
                  onClick={() => setActiveTab('admin')}
                  className={`w-full justify-center px-2 sm:px-4 md:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'admin' ? 'bg-amber-100 text-amber-800 shadow-md' : 'text-blue-100 hover:bg-blue-600/50'}`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0"/> Admin
                </button>
              )}
            </nav>

            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-600 bg-white/70 border border-slate-200 px-3 py-2 rounded-lg">
              <UserRound className="w-4 h-4" /> {sessionUser.name}
            </div>
            <button onClick={handleLogout} className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800">
              <LogOut className="w-4 h-4" /> Keluar
            </button>

            {/* Butang Dwibahasa paparan Desktop */}
            <div className="hidden md:flex bg-blue-900/40 p-1 rounded-full backdrop-blur-sm ml-2">
              <button onClick={() => setLang('ms')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${lang === 'ms' ? 'bg-white text-blue-800 shadow' : 'text-blue-200 hover:bg-blue-800'}`}>BM</button>
              <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-blue-800 shadow' : 'text-blue-200 hover:bg-blue-800'}`}>EN</button>
            </div>
          </div>
        </div>
      </header>

      {/* BANNER SEKSYEN */}
      {activeTab !== 'rrgs' && (
        <div className="apple-hero bg-gradient-to-b from-blue-700 to-indigo-800 text-white py-12 px-6 shadow-inner mb-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
              {activeTab === 'nota' && (lang === 'en' ? "Comprehensive Notes & Tutorials" : "Nota Komprehensif & Tutorial")}
              {activeTab === 'makmal' && (lang === 'en' ? "Interactive Cartesian Plane Lab" : "Makmal Satah Cartes Interaktif")}
              {activeTab === 'kuiz' && (lang === 'en' ? "Mind Test: Visual Quiz" : "Uji Minda: Kuiz Visual")}
            </h2>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              {activeTab === 'nota' && (lang === 'en' ? "Master translation, reflection, rotation, isometry, and rotational symmetry through clear step-by-step visuals." : "Kuasai translasi, pantulan, putaran, isometri dan simetri putaran melalui visual langkah demi langkah.")}
              {activeTab === 'makmal' && (lang === 'en' ? "Draw shapes, adjust transformation values, and watch every coordinate move on the Cartesian plane." : "Lakar bentuk, ubah nilai transformasi, dan lihat setiap koordinat bergerak pada satah Cartes.")}
              {activeTab === 'kuiz' && (lang === 'en' ? "Practise image coordinates with visual questions that reveal the solution after each answer." : "Latih koordinat imej dengan soalan visual yang menunjukkan penyelesaian selepas setiap jawapan.")}
            </p>
            <div className="apple-hero-metrics" aria-label={lang === 'en' ? 'Learning highlights' : 'Sorotan pembelajaran'}>
              <span>{lang === 'en' ? 'Visual steps' : 'Langkah visual'}</span>
              <span>{lang === 'en' ? 'Live coordinate lab' : 'Makmal koordinat live'}</span>
              <span>{lang === 'en' ? 'Mission game' : 'Game misi'}</span>
            </div>
          </div>
        </div>
      )}

      {/* KANDUNGAN SEKSYEN */}
      <main className={`mx-auto ${activeTab === 'rrgs' ? 'w-full max-w-[1920px] px-2 md:px-4' : 'max-w-7xl px-4 md:px-6'}`}>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'nota' && <SectionNota lang={lang} />}
          {activeTab === 'makmal' && <SectionMakmal lang={lang} />}
          {activeTab === 'kuiz' && <SectionKuiz lang={lang} sessionUser={sessionUser} />}
          {activeTab === 'rrgs' && (
            <RRGErrorBoundary lang={lang} sessionUser={sessionUser}>
              <RRGCanvasGame lang={lang} sessionUser={sessionUser} />
            </RRGErrorBoundary>
          )}
          {activeTab === 'admin' && sessionUser.role === 'admin' && <AdminDashboard />}
        </div>
      </main>

      {activeTab !== 'rrgs' && (
        <footer className="max-w-7xl mx-auto mt-16 text-center text-slate-400 text-sm border-t border-slate-200 pt-8">
          <p>{lang === 'en' ? 'Interactive Form 2 Mathematics Module' : 'Modul Matematik Tingkatan 2 Interaktif'} &copy; 2026</p>
        </footer>
      )}
    </div>
  );
}
