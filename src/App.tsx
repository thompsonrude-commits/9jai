import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signOut } from './lib/firebase';
import { Globe, BookOpen, Brain, Languages, LogOut, Database, GraduationCap, Users, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SearchLanguage from './components/SearchLanguage';
import LanguageExplorer from './components/LanguageExplorer';
import AdminRepository from './components/AdminRepository';
import AdminTraining from './components/AdminTraining';
import TeamManagement from './components/TeamManagement';
import LanguagesMenu from './components/LanguagesMenu';
import AfricanLanguages from './components/AfricanLanguages';
import AfricanLanguagePage from './components/AfricanLanguagePage';
import Utilities from './components/Utilities';
import Profile from './components/Profile';
import GeneralAssistant from './components/GeneralAssistant';
import SuperEcosystem from './components/SuperEcosystem';
import AdminLogin from './components/AdminLogin';
import UserLibrary from './components/UserLibrary';
import { NIGERIAN_LANGUAGES } from './lib/nigerianLanguages';
import { trackUserLogin } from './lib/analyticsService';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@9jai.app';

// Build a flat map of languageId -> languageName from nigerianLanguages
const LANGUAGE_ID_TO_NAME: Record<string, string> = {};
NIGERIAN_LANGUAGES.forEach(region => {
  region.languages.forEach(lang => {
    LANGUAGE_ID_TO_NAME[lang.id] = lang.name;
  });
});

// ── Language Page wrapper ─────────────────────────────────────────────────
function LanguagePage({ user, isAdmin }: { user: User | null; isAdmin: boolean }) {
  const location = useLocation();
  // Extract language id from path e.g. /language/edo -> edo
  const langId = location.pathname.split('/').pop() || '';
  const langName = LANGUAGE_ID_TO_NAME[langId];

  if (!langName) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-2xl font-serif text-[#008751] mb-2">Language not found</p>
          <p className="text-sm text-[#008751]/60">The language "{langId}" is not in our database yet.</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageExplorer
      languageName={langName}
      currentUser={user}
      isAdmin={isAdmin}
    />
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [developerUser, setDeveloperUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isMasterAdmin = user?.email === ADMIN_EMAIL;
  const isDeveloper = !!developerUser;
  const isAdmin = isMasterAdmin || isDeveloper;

  useEffect(() => {
    const savedDev = localStorage.getItem('lexicon_dev_user');
    if (savedDev) {
      try { setDeveloperUser(JSON.parse(savedDev)); } catch (_) {}
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && !u.isAnonymous) {
        setDeveloperUser(null);
        localStorage.removeItem('lexicon_dev_user');
      }
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user && user.email) trackUserLogin(user.uid, user.email);
  }, [user]);

  // ── No sidebar, no idle timer needed ────────────────────────────────────

  // ── App layout (both authenticated and unauthenticated) ──────────────────
  const path = location.pathname;
  const isHome = path === '/';
  const isChat = path === '/assistant';
  const isLanguages = path === '/languages';
  const isAfricanLanguages = path === '/african-languages';
  const isUtilities = path === '/utilities';
  const isProfile = path === '/profile';
  const isDiscover = path === '/discover';
  const isRepository = path === '/admin/repository';
  const isTraining = path === '/admin/training';
  const isTeam = path === '/admin/team';
  const isLanguagePage = path.startsWith('/language/');
  const isAfricanLanguagePage = path.startsWith('/african-language/');

  // Shared routes available to everyone
  const sharedRoutes = (
    <>
      <Route path="/" element={<GeneralAssistant user={user} isAdmin={isAdmin} onOpenLibrary={() => setShowLibrary(true)} />} />
      <Route path="/assistant" element={<GeneralAssistant user={user} isAdmin={isAdmin} onOpenLibrary={() => setShowLibrary(true)} />} />
      <Route path="/super" element={<SuperEcosystem user={user} isAdmin={isAdmin} onOpenLibrary={() => setShowLibrary(true)} />} />
      <Route path="/languages" element={<div className="flex-1 overflow-y-auto"><LanguagesMenu /></div>} />
      <Route path="/african-languages" element={<div className="flex-1 overflow-y-auto"><AfricanLanguages /></div>} />
      <Route path="/african-language/:langId" element={<AfricanLanguagePage user={user} isAdmin={isAdmin} />} />
      <Route path="/utilities" element={<div className="flex-1 overflow-y-auto"><Utilities /></div>} />
      <Route path="/profile" element={<div className="flex-1 overflow-y-auto"><Profile user={user} /></div>} />
      <Route path="/language/:langId" element={<LanguagePage user={user} isAdmin={isAdmin} />} />
      <Route path="/admin" element={<AdminLogin onLoginSuccess={() => {}} />} />
    </>
  );

  // Unauthenticated layout — no sidebar
  if (!user && !developerUser) {
    return (
      <div className="h-full flex flex-col bg-white overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Routes>
            {sharedRoutes}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
        <AnimatePresence>
          {showLibrary && <UserLibrary user={user} onClose={() => setShowLibrary(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  // Authenticated layout — no sidebar, full width
  return (
    <div className="h-full bg-white font-sans flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white">
        <Routes>
          {sharedRoutes}
          {isMasterAdmin && (
            <>
              <Route path="/discover" element={<div className="flex-1 overflow-y-auto"><SearchLanguage onLanguageFound={(langName) => { let id = langName.toLowerCase().replace(/\s+/g, '-'); for (const [k, v] of Object.entries(LANGUAGE_ID_TO_NAME)) { if (v.toLowerCase() === langName.toLowerCase()) { id = k; break; } } navigate(`/language/${id}`); }} /></div>} />
              <Route path="/admin/repository" element={<div className="flex-1 overflow-y-auto"><AdminRepository onSelectLanguage={(langName) => { let id = langName.toLowerCase().replace(/\s+/g, '-'); for (const [k, v] of Object.entries(LANGUAGE_ID_TO_NAME)) { if (v.toLowerCase() === langName.toLowerCase()) { id = k; break; } } navigate(`/language/${id}`); }} /></div>} />
              <Route path="/admin/training" element={<div className="flex-1 overflow-y-auto"><AdminTraining /></div>} />
              <Route path="/admin/team" element={<div className="flex-1 overflow-y-auto"><TeamManagement /></div>} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />

      <AnimatePresence>
        {showLibrary && <UserLibrary user={user} onClose={() => setShowLibrary(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#008751]/10 bg-white py-2 px-2 text-center bg-white">
      <p className="text-[10px] text-[#008751] whitespace-nowrap overflow-hidden text-ellipsis">
        © 2026 Tomega Technology Limited · Thompson Obosa · 📞 +917973268733
      </p>
    </footer>
  );
}

function NavItem({
  icon, active, onClick, label,
}: {
  icon: React.ReactElement;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="relative group w-full">
      <button
        onClick={onClick}
        className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all flex items-center justify-center relative overflow-hidden ${
          active
            ? 'bg-white/20 backdrop-blur-sm text-white shadow-lg'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        {active && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        )}
        <span className="relative z-10">{icon}</span>
      </button>
      <span className="absolute left-full ml-2 sm:ml-3 top-1/2 -translate-y-1/2 py-1 px-2 bg-[#008751] border border-white/20 text-white text-[9px] sm:text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest whitespace-nowrap z-[100] pointer-events-none shadow-xl">
        {label}
      </span>
    </div>
  );
}
