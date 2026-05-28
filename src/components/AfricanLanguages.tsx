import React from 'react';
import { useNavigate } from 'react-router-dom';
import AFRICAN_LANGUAGES from '../lib/africanLanguages';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AppHeader from './AppHeader';

export default function AfricanLanguages() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <AppHeader />
      <header className="mb-6">
        <h1 className="text-3xl font-serif text-[#008751]">African Languages</h1>
        <p className="text-sm text-gray-600">Explore languages across Africa. Tap a region to expand.</p>
      </header>

      <div className="space-y-4">
        {AFRICAN_LANGUAGES.map(region => (
          <div key={region.id} className="border border-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpen(prev => ({ ...prev, [region.id]: !prev[region.id] }))}
              className="w-full px-4 py-3 flex items-center justify-between bg-white"
            >
              <div>
                <div className="text-sm font-bold text-[#1A1A1A]">{region.name}</div>
                <div className="text-[12px] text-gray-500">{region.languages.length} languages</div>
              </div>
              <div className="text-[#008751]">{open[region.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
            </button>

            {open[region.id] && (
              <div className="p-3 bg-white">
                <ul className="grid grid-cols-2 gap-2">
                  {region.languages.map(lang => (
                    <li key={lang.id}>
                      <button
                        onClick={() => navigate(`/african-language/${lang.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#008751]/6 transition-colors"
                      >
                        <div className="font-semibold text-sm text-gray-900">{lang.name}</div>
                        <div className="text-[12px] text-gray-500">{lang.nativeName || ''}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
