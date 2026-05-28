import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AFRICAN_LANGUAGES from '../lib/africanLanguages';
import LanguageExplorer from './LanguageExplorer';
import AppHeader from './AppHeader';

const LANGUAGE_ID_TO_NAME: Record<string, string> = {};
AFRICAN_LANGUAGES.forEach(region => {
  region.languages.forEach(lang => {
    LANGUAGE_ID_TO_NAME[lang.id] = lang.name;
  });
});

export default function AfricanLanguagePage({ user, isAdmin }: { user: any; isAdmin: boolean }) {
  const location = useLocation();
  const langId = location.pathname.split('/').pop() || '';
  const langName = LANGUAGE_ID_TO_NAME[langId];
  const navigate = useNavigate();

  if (!langName) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <p className="text-2xl font-serif text-[#008751] mb-2">African language not found</p>
          <p className="text-sm text-[#008751]/60 mb-4">The language "{langId}" is not in our African language list yet.</p>
          <button
            onClick={() => navigate('/african-languages')}
            className="px-4 py-2 rounded-full bg-[#008751] text-white font-bold hover:bg-[#00A862] transition-colors"
          >Return to African Languages</button>
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
