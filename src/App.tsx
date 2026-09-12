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
import AgentManagement from './components/AgentManagement';
import TeamManagement from './components/TeamManagement';
import LanguagesMenu from './components/LanguagesMenu';
import AfricanLanguages from './components/AfricanLanguages';
import AfricanLanguagePage from './components/AfricanLanguagePage';
import Utilities from './components/Utilities';
import Profile from './components/Profile';
import GeneralAssistant from './components/GeneralAssistant';
import SuperEcosystem from './components/SuperEcosystem';
import AdminLogin from './components/AdminLogin';
import AdminPage from './components/AdminPage';
import HomePage from './components/HomePage';
import UserLibrary from './components/UserLibrary';
import MinimalSidebar from './components/MinimalSidebar';
import { PlatformStatus } from './components/PlatformStatus';
import { NIGERIAN_LANGUAGES } from './lib/nigerianLanguages';
import { trackUserLogin } from './lib/analyticsService';

const ADMIN_EMAIL = 'obosathompsons@gmail.com';

// Build a flat map of languageId -> languageName from nigerianLanguages
const LANGUAGE_ID_TO_NAME: Record<string, string> = {};
NIGERIAN_LANGUAGES.forEach(region => {
  region.languages.forEach(lang => {
    LANGUAGE_ID_TO_NAME[lang.id] = lang.name;
  });
});

// ΓöÇΓöÇ Language Page wrapper ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

// ΓöÇΓöÇ Main App ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [developerUser, setDeveloperUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
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
      // Only clear developer user if a REAL Firebase user logs in
      // Don't clear for anonymous users
      if (u && !u.isAnonymous && u.email) {
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

  // Handle new chat from sidebar
  const handleNewChat = useCallback(() => {
    setCurrentSessionId(undefined);
    navigate('/');
  }, [navigate]);

  // Handle session selection from sidebar
  const handleSelectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    navigate('/');
  }, [navigate]);

  // ── App layout (both authenticated and unauthenticated) ─────────────────
  const path = location.pathname;
  const isHome = path === '/';
  const isChat = path === '/chat' || path === '/assistant';
  const isLanguages = path === '/languages';
  const isAfricanLanguages = path === '/african-languages';
  const isUtilities = path === '/utilities';
  const isProfile = path === '/profile';
  const isDiscover = path === '/discover';
  const isAdminPath = path === '/admin';
  const isRepository = path === '/admin/repository';
  const isTraining = path === '/admin/training';
  const isTeam = path === '/admin/team';
  const isLanguagePage = path.startsWith('/language/');
  const isAfricanLanguagePage = path.startsWith('/african-language/');

  // Shared routes available to everyone
  const sharedRoutes = (
    <>
      <Route path="/" element={<GeneralAssistant user={user} isAdmin={isAdmin} currentSessionId={currentSessionId} onOpenLibrary={() => setShowLibrary(true)} />} />
      <Route path="/chat" element={<GeneralAssistant user={user} isAdmin={isAdmin} currentSessionId={currentSessionId} onOpenLibrary={() => setShowLibrary(true)} />} />
      <Route path="/assistant" element={<GeneralAssistant user={user} isAdmin={isAdmin} currentSessionId={currentSessionId} onOpenLibrary={() => setShowLibrary(true)} />} />
      <Route path="/super" element={<SuperEcosystem user={user} isAdmin={isAdmin} onOpenLibrary={() => setShowLibrary(true)} />} />
      <Route path="/languages" element={<div className="flex-1 overflow-y-auto"><LanguagesMenu /></div>} />
      <Route path="/african-languages" element={<div className="flex-1 overflow-y-auto"><AfricanLanguages /></div>} />
      <Route path="/african-language/:langId" element={<AfricanLanguagePage user={user} isAdmin={isAdmin} />} />
      <Route path="/utilities" element={<div className="flex-1 overflow-y-auto"><Utilities /></div>} />
      <Route path="/profile" element={<div className="flex-1 overflow-y-auto"><Profile user={user} /></div>} />
      <Route path="/language/:langId" element={<LanguagePage user={user} isAdmin={isAdmin} />} />
    </>
  );

  // Unauthenticated layout — no sidebar (login required for chat history)
  if (!user && !developerUser) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-[#0a2818] to-[#051f16] overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Routes>
            {sharedRoutes}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <PlatformStatus />
        <Footer />
        <AnimatePresence>
          {showLibrary && <UserLibrary user={user} onClose={() => setShowLibrary(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  // Authenticated layout — with minimal sidebar (ChatGPT-style)
  // Show sidebar on home and chat pages
  const showSidebar = isHome || isChat;

  return (
    <div className="h-full bg-gradient-to-br from-[#0a2818] to-[#051f16] font-sans flex overflow-hidden">
      {/* Minimal Sidebar - shows on home/chat */}
      {showSidebar && (
        <MinimalSidebar
          user={user}
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-gradient-to-br from-[#0a2818] to-[#051f16] relative">
        <Routes>
          {sharedRoutes}
          {isMasterAdmin && (
            <>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/discover" element={<div className="flex-1 overflow-y-auto"><SearchLanguage onLanguageFound={(langName) => { let id = langName.toLowerCase().replace(/\s+/g, '-'); for (const [k, v] of Object.entries(LANGUAGE_ID_TO_NAME)) { if (v.toLowerCase() === langName.toLowerCase()) { id = k; break; } } navigate(`/language/${id}`); }} /></div>} />
              <Route path="/admin/repository" element={<div className="flex-1 overflow-y-auto"><AdminRepository onSelectLanguage={(langName) => { let id = langName.toLowerCase().replace(/\s+/g, '-'); for (const [k, v] of Object.entries(LANGUAGE_ID_TO_NAME)) { if (v.toLowerCase() === langName.toLowerCase()) { id = k; break; } } navigate(`/language/${id}`); }} /></div>} />
              <Route path="/admin/training" element={<div className="flex-1 overflow-y-auto"><AdminTraining /></div>} />
              <Route path="/admin/agents" element={<div className="flex-1 overflow-y-auto"><AgentManagement /></div>} />
              <Route path="/admin/team" element={<div className="flex-1 overflow-y-auto"><TeamManagement /></div>} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </main>
        <PlatformStatus />
        <Footer />

        <AnimatePresence>
          {showLibrary && <UserLibrary user={user} onClose={() => setShowLibrary(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#00ff88]/20 bg-black py-4 px-4 text-center">
      <div className="flex items-center justify-center gap-2 text-sm">
        <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <p className="text-white font-medium">
          <span className="text-[#00ff88] font-black">BLACK AI</span> created by <span className="font-semibold">Obosa Thompson Emuze</span>
        </p>
      </div>
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
