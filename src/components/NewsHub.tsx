import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe, TrendingUp, Calendar, Tag, ExternalLink, Search,
  RefreshCw, Filter, Clock, BookOpen
} from 'lucide-react';
import { NEWS_CATEGORIES } from '../lib/newsService';

interface NewsItem {
  id?: string;
  title: string;
  description: string;
  content: string;
  source: string;
  url: string;
  imageUrl?: string;
  category: string;
  publishedAt?: any;
  isHistorical?: boolean;
}

export default function NewsHub({ languageName = 'Nigerian Languages' }: NewsHubProps) {
  const [news, setNews] = useState<NewsItem[]>([
    {
      id: '1',
      title: 'Nigeria Launches New Tech Initiative',
      description: 'The Nigerian government announces a new technology development program',
      content: 'The Nigerian government has announced a comprehensive technology development initiative aimed at boosting innovation and digital transformation across the nation.',
      source: 'BBC News',
      url: 'https://bbc.com',
      category: 'technology',
      publishedAt: new Date(),
      isHistorical: false,
    },
    {
      id: '2',
      title: 'African Union Meets on Climate Change',
      description: 'African leaders discuss climate action strategies',
      content: 'African Union leaders gathered to discuss comprehensive climate change strategies and sustainable development goals for the continent.',
      source: 'Reuters',
      url: 'https://reuters.com',
      category: 'world',
      publishedAt: new Date(),
      isHistorical: false,
    },
  ]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>(news);
  const [selectedCategory, setSelectedCategory] = useState<string>('world');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTopics, setTrendingTopics] = useState<string[]>(['Nigeria', 'Africa', 'Technology', 'Climate', 'Education']);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Filter news by category
  useEffect(() => {
    const filtered = news.filter(item => 
      item.category === selectedCategory && 
      (showHistorical ? item.isHistorical : !item.isHistorical)
    );
    setFilteredNews(filtered);
  }, [selectedCategory, showHistorical, news]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = news.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredNews(results);
    } else {
      const filtered = news.filter(item => 
        item.category === selectedCategory && 
        (showHistorical ? item.isHistorical : !item.isHistorical)
      );
      setFilteredNews(filtered);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#008751]/20 backdrop-blur-sm">
        <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden">
                <img src="/logo.png" alt="9jai" className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl object-cover" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-serif text-[#008751]">News Hub</h1>
                <p className="text-[10px] sm:text-xs text-[#008751]/60">Global & Local Updates</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#008751]/10 hover:bg-[#008751]/20 text-[#008751] transition-all"
              title="Refresh news"
            >
              <RefreshCw size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-[#008751]/5 border border-[#008751]/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 focus-within:border-[#008751]">
            <Search size={16} className="sm:w-5 sm:h-5 text-[#008751]/60" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs sm:text-sm text-[#1A1A1A] placeholder-[#008751]/40 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6">
        {/* Category Filter */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="sm:w-5 sm:h-5 text-[#008751]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#008751]">Categories</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl whitespace-nowrap text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#008751] text-white'
                    : 'bg-[#008751]/10 text-[#008751] hover:bg-[#008751]/20'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Topics */}
        {trendingTopics.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="sm:w-5 sm:h-5 text-[#008751]" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#008751]">Trending</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {trendingTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleSearch(topic)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#008751]/5 border border-[#008751]/20 hover:border-[#008751] text-[10px] sm:text-xs text-[#008751] font-bold uppercase tracking-widest whitespace-nowrap transition-all"
                >
                  #{topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Historical Toggle */}
        <div className="mb-6 sm:mb-8 flex items-center gap-2">
          <button
            onClick={() => setShowHistorical(!showHistorical)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
              showHistorical
                ? 'bg-[#008751] text-white'
                : 'bg-[#008751]/10 text-[#008751] hover:bg-[#008751]/20'
            }`}
          >
            <BookOpen size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Historical Records</span>
            <span className="sm:hidden">History</span>
          </button>
        </div>

        {/* News List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-[#008751]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw size={24} className="sm:w-8 sm:h-8 text-[#008751] animate-spin" />
              </div>
              <p className="text-xs sm:text-sm text-[#008751]/60">Loading news...</p>
            </div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Globe size={32} className="sm:w-12 sm:h-12 text-[#008751]/20 mx-auto mb-4" />
              <p className="text-xs sm:text-sm text-[#008751]/60">No news found</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            <AnimatePresence>
              {filteredNews.map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => setSelectedNews(item)}
                  className="p-3 sm:p-4 bg-white border border-[#008751]/20 rounded-lg sm:rounded-xl hover:border-[#008751] hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 sm:w-24 h-16 sm:h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                        <h3 className="text-xs sm:text-sm font-bold text-[#008751] line-clamp-2 group-hover:text-[#00A862]">
                          {item.title}
                        </h3>
                        <ExternalLink size={14} className="sm:w-4 sm:h-4 text-[#008751]/40 shrink-0 mt-0.5" />
                      </div>
                      <p className="text-[10px] sm:text-xs text-[#008751]/60 line-clamp-2 mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#008751]/50">
                          <Clock size={12} />
                          {item.publishedAt?.toDate?.().toLocaleDateString?.() || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#008751]/50">
                          <Tag size={12} />
                          {item.source}
                        </div>
                        {item.isHistorical && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#008751]/10 rounded text-[9px] sm:text-[10px] text-[#008751] font-bold">
                            <BookOpen size={10} />
                            Historical
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* News Detail Modal */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNews(null)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg sm:rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-4 sm:p-6">
                {selectedNews.imageUrl && (
                  <img
                    src={selectedNews.imageUrl}
                    alt={selectedNews.title}
                    className="w-full h-48 sm:h-64 rounded-lg object-cover mb-4"
                  />
                )}
                <h2 className="text-lg sm:text-2xl font-bold text-[#008751] mb-2 sm:mb-3">
                  {selectedNews.title}
                </h2>
                <div className="flex items-center gap-2 mb-4 text-[10px] sm:text-xs text-[#008751]/60">
                  <span>{selectedNews.source}</span>
                  <span>•</span>
                  <span>{selectedNews.publishedAt?.toDate?.().toLocaleDateString?.() || 'N/A'}</span>
                </div>
                <div className="prose prose-sm max-w-none mb-4">
                  <p className="text-xs sm:text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
                    {selectedNews.content}
                  </p>
                </div>
                <a
                  href={selectedNews.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#008751] text-white rounded-lg hover:bg-[#00A862] transition-all text-xs sm:text-sm font-bold"
                >
                  <ExternalLink size={14} />
                  Read Full Article
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
