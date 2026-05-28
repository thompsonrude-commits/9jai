import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { NIGERIAN_LANGUAGES } from '../lib/nigerianLanguages';
import AppHeader from './AppHeader';

export default function LanguagesMenu() {
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleRegion = (regionId: string) => {
    setExpandedRegions(prev =>
      prev.includes(regionId)
        ? prev.filter(id => id !== regionId)
        : [...prev, regionId]
    );
  };

  return (
    <div className="bg-white p-2 sm:p-4 md:p-8 flex flex-col overflow-y-auto">
      <AppHeader />
      <div className="flex-1 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-serif text-[#008751] tracking-tight">Nigerian Languages</h1>
              <p className="text-xs sm:text-sm text-[#008751]/60 mt-0.5">Explore and learn languages from all regions of Nigeria</p>
            </div>
          </div>
        </div>

        {/* Regions */}
        <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
          {NIGERIAN_LANGUAGES.map((region) => (
            <div key={region.id} className="border-2 border-[#008751]/20 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-white shadow-sm">
              {/* Region Header */}
              <button
                onClick={() => toggleRegion(region.id)}
                className="w-full px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 flex items-center justify-between hover:bg-[#008751]/5 transition-colors"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                  {expandedRegions.includes(region.id) ? (
                    <ChevronDown className="w-4 sm:w-5 h-4 sm:h-5 text-[#008751] shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-[#008751] shrink-0" />
                  )}
                  <h2 className="text-sm sm:text-base md:text-lg font-serif text-[#008751] truncate">{region.name}</h2>
                  <span className="text-[9px] sm:text-xs text-[#008751]/60 font-bold uppercase tracking-widest shrink-0">
                    {region.languages.length}
                  </span>
                </div>
              </button>

              {/* Languages List */}
              <AnimatePresence>
                {expandedRegions.includes(region.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 sm:px-3 md:px-4 lg:px-6 pb-2 sm:pb-3 md:pb-4 space-y-1.5 sm:space-y-2 md:space-y-3">
                      {region.languages.map((language) => (
                        <button
                          key={language.id}
                          onClick={() => navigate(`/language/${language.id}`)}
                          className="w-full p-2 sm:p-2.5 md:p-3 lg:p-4 bg-[#008751]/5 hover:bg-[#008751]/10 border border-[#008751]/20 hover:border-[#008751]/40 rounded-lg sm:rounded-xl transition-all text-left group"
                        >
                          <div className="flex items-start justify-between gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 flex-wrap">
                                <h3 className="text-xs sm:text-sm md:text-base font-serif text-[#008751] group-hover:text-[#00A862]">
                                  {language.name}
                                </h3>
                                <span className="text-[9px] sm:text-xs text-[#008751]/60 italic">
                                  ({language.nativeName})
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-[#008751]/70 mb-1 sm:mb-1.5 leading-relaxed line-clamp-2">
                                {language.description}
                              </p>
                              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 text-[8px] sm:text-xs text-[#008751]/60">
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <Users size={10} className="sm:w-3 sm:h-3" />
                                  <span className="truncate">{language.speakers}</span>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <div className="w-6 sm:w-8 md:w-10 h-6 sm:h-8 md:h-10 bg-gradient-to-br from-[#008751] to-[#00A862] rounded-lg sm:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="w-3 sm:w-4 md:w-5 h-3 sm:h-4 md:h-5 text-white" />
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-12 p-2.5 sm:p-3 md:p-4 lg:p-6 bg-gradient-to-br from-[#008751]/10 to-[#00A862]/10 border-2 border-[#008751]/20 rounded-lg sm:rounded-xl md:rounded-2xl">
          <h3 className="text-sm sm:text-base md:text-lg font-serif text-[#008751] mb-1 sm:mb-1.5">About Nigerian Languages</h3>
          <p className="text-xs sm:text-sm text-[#008751]/70 leading-relaxed">
            Nigeria is home to over 500 languages, making it one of the most linguistically diverse countries in the world.
            The languages listed here represent the major languages spoken across Nigeria's six geopolitical zones.
            Each language has its own rich history, culture, and traditions.
          </p>
        </div>
      </div>
    </div>
  );
}
